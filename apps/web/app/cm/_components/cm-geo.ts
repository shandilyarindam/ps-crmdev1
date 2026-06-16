"use client";

// Geo data layer for the CM dashboard map.
//
// Pulls real ward polygons from the `ward_geojson` view, derives 12 MCD zone
// polygons by unioning member-ward geometries (ward -> zone via ward-zone-map),
// and tallies real complaint points per region by point-in-polygon. Pure data /
// hooks — no UI. The three CM views feed slices of this into <MapComponent />.

import { useEffect, useMemo, useState } from "react";
import union from "@turf/union";
import { featureCollection } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { supabase } from "@/src/lib/supabase";
import { parseLocationToLatLng } from "@/lib/parse-location";
import { ZONE_BY_ID, type ZoneId } from "./ward-zone-map";

export interface WardProps {
  ward_no: number;
  wardname: string;
  ac_name: string | null;
  totalpop: number | null;
  zoneId: ZoneId;
}
export type WardFeature = Feature<Polygon | MultiPolygon, WardProps>;

export interface ZoneProps {
  zoneId: ZoneId;
  name: string;
  color: string;
  wardCount: number;
}
export type ZoneFeature = Feature<Polygon | MultiPolygon, ZoneProps>;

export type GeoStatus = "loading" | "ready" | "empty" | "error";

/** Fetch all ward polygons once, tagging each with its derived zone. */
export function useWardGeoJSON(): { wards: WardFeature[]; status: GeoStatus } {
  const [wards, setWards] = useState<WardFeature[]>([]);
  const [status, setStatus] = useState<GeoStatus>("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("ward_geojson")
        .select("ward_no,wardname,ac_name,totalpop,zone_id,geometry")
        // Deterministic order so the turf union below is stable run-to-run.
        .order("ward_no", { ascending: true });
      if (!alive) return;
      if (error) {
        setStatus("error");
        return;
      }
      if (!data || data.length === 0) {
        setStatus("empty");
        return;
      }
      const feats: WardFeature[] = data
        .filter((r) => r.geometry)
        .map((r) => ({
          type: "Feature",
          id: r.ward_no ?? undefined,
          geometry: r.geometry as unknown as Polygon | MultiPolygon,
          properties: {
            ward_no: r.ward_no ?? -1,
            wardname: r.wardname ?? "",
            ac_name: r.ac_name,
            totalpop: r.totalpop,
            zoneId: (r.zone_id as ZoneId) ?? "unzoned",
          },
        }));
      setWards(feats);
      setStatus(feats.length ? "ready" : "empty");
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { wards, status };
}

/** True only for a Polygon/MultiPolygon with non-empty coordinates. */
export function hasValidGeometry(geom: unknown): geom is Polygon | MultiPolygon {
  if (!geom || typeof geom !== "object") return false;
  const g = geom as { type?: string; coordinates?: unknown };
  if (g.type !== "Polygon" && g.type !== "MultiPolygon") return false;
  return Array.isArray(g.coordinates) && g.coordinates.length > 0;
}

/**
 * Concatenate member-ward polygons into one MultiPolygon. Always valid and
 * order-independent — used as the fallback when turf union fails or yields a
 * degenerate geometry.
 */
function mergeToMultiPolygon(members: WardFeature[]): MultiPolygon {
  const coordinates: Position[][][] = [];
  for (const m of members) {
    const g = m.geometry;
    if (g.type === "Polygon") coordinates.push(g.coordinates);
    else if (g.type === "MultiPolygon") coordinates.push(...g.coordinates);
  }
  return { type: "MultiPolygon", coordinates };
}

/** Dissolve member-ward polygons into one geometry per zone (memoize at call site). */
export function buildZoneRegions(wards: WardFeature[]): ZoneFeature[] {
  const groups = new Map<ZoneId, WardFeature[]>();
  for (const w of wards) {
    const z = w.properties.zoneId;
    if (z === "unzoned" || !hasValidGeometry(w.geometry)) continue;
    const list = groups.get(z);
    if (list) list.push(w);
    else groups.set(z, [w]);
  }

  const out: ZoneFeature[] = [];
  for (const [zoneId, members] of groups) {
    const def = ZONE_BY_ID[zoneId];

    // Try a clean dissolve; fall back to a guaranteed-valid MultiPolygon merge
    // if turf throws or returns a degenerate geometry (it is order-sensitive).
    let geometry: Polygon | MultiPolygon;
    try {
      const u =
        members.length === 1
          ? members[0]
          : union(featureCollection(members));
      geometry =
        u && hasValidGeometry(u.geometry) ? u.geometry : mergeToMultiPolygon(members);
    } catch {
      geometry = mergeToMultiPolygon(members);
    }

    if (!hasValidGeometry(geometry)) continue;
    out.push({
      type: "Feature",
      id: zoneId,
      geometry,
      properties: { zoneId, name: def.name, color: def.color, wardCount: members.length },
    });
  }
  return out;
}

/** Wards belonging to one zone. */
export function wardRegionsForZone(wards: WardFeature[], zoneId: ZoneId): WardFeature[] {
  return wards.filter((w) => w.properties.zoneId === zoneId);
}

/** A single ward feature by number. */
export function wardByNo(wards: WardFeature[], wardNo: number): WardFeature | undefined {
  return wards.find((w) => w.properties.ward_no === wardNo);
}

/**
 * Fetch complaint points once and tally how many fall inside each ward and each
 * zone (point-in-polygon). Real-but-sparse today; lights up as Delhi complaints
 * with valid coordinates are added.
 */
export function useComplaintPoints(): { points: { lat: number; lng: number }[]; loaded: boolean } {
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("complaints").select("location");
      if (!alive) return;
      if (error || !data) {
        setLoaded(true);
        return;
      }
      const pts = data
        .map((c) => parseLocationToLatLng((c as { location: unknown }).location))
        .filter((p): p is { lat: number; lng: number } => !!p);
      setPoints(pts);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { points, loaded };
}

/** Count complaint points inside each region feature; keyed by feature id. */
export function countPointsInRegions(
  regions: Feature<Polygon | MultiPolygon>[],
  points: { lat: number; lng: number }[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const region of regions) {
    const key = String(region.id ?? "");
    if (!hasValidGeometry(region.geometry)) {
      counts[key] = 0;
      continue;
    }
    let n = 0;
    for (const p of points) {
      try {
        // GeoJSON position order is [lng, lat].
        if (booleanPointInPolygon([p.lng, p.lat], region as Feature<Polygon | MultiPolygon>)) n++;
      } catch {
        /* skip points that error against a malformed ring */
      }
    }
    counts[key] = n;
  }
  return counts;
}

/** Convenience: memo-friendly counts for a region set against loaded points. */
export function useRegionCounts(
  regions: Feature<Polygon | MultiPolygon>[],
  points: { lat: number; lng: number }[]
): Record<string, number> {
  return useMemo(() => countPointsInRegions(regions, points), [regions, points]);
}
