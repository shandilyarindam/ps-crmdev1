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
import { ZONE_BY_ID, type ZoneId, zoneIdForWard } from "./ward-zone-map";

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

/** Fetch precomputed zone boundaries directly from the local static GeoJSON. */
export function usePrecomputedZoneRegions(): { zoneRegions: ZoneFeature[]; status: GeoStatus } {
  const [zoneRegions, setZoneRegions] = useState<ZoneFeature[]>([]);
  const [status, setStatus] = useState<GeoStatus>("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/delhi_zones.geojson");
        if (!res.ok) throw new Error("Failed to fetch zones GeoJSON");
        const data = await res.json();
        if (!alive) return;
        setZoneRegions(data.features || []);
        setStatus("ready");
      } catch (err) {
        console.error("Error loading zones GeoJSON:", err);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { zoneRegions, status };
}

/** Fetch all ward polygons from the local static GeoJSON, tagging each with its derived zone. */
export function useWardGeoJSON(enabled: boolean = true): { wards: WardFeature[]; status: GeoStatus } {
  const [wards, setWards] = useState<WardFeature[]>([]);
  const [status, setStatus] = useState<GeoStatus>("loading");

  useEffect(() => {
    if (!enabled) {
      // Defer loading when disabled
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/delhi_wards.geojson");
        if (!res.ok) throw new Error("Failed to fetch wards GeoJSON");
        const data = await res.json();
        if (!alive) return;
        const feats: WardFeature[] = (data.features || [])
          .filter((f: any) => f.geometry)
          .map((f: any) => ({
            type: "Feature",
            id: f.properties.Ward_No ?? undefined,
            geometry: f.geometry,
            properties: {
              ward_no: f.properties.Ward_No ?? -1,
              wardname: f.properties.WardName ?? "",
              ac_name: f.properties.AC_Name ?? null,
              totalpop: f.properties.TotalPop ?? null,
              zoneId: zoneIdForWard(f.properties.Ward_No),
            },
          }));
        setWards(feats);
        setStatus(feats.length ? "ready" : "empty");
      } catch (err) {
        console.error("Error loading wards GeoJSON:", err);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [enabled]);

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
export interface ComplaintPoint {
  lat: number;
  lng: number;
  severity: string;
  sla_breached: boolean;
  assigned_department: string | null;
  title: string;
  description: string;
}

export function useComplaintPoints(): { points: ComplaintPoint[]; loaded: boolean } {
  const [points, setPoints] = useState<ComplaintPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("location, severity, effective_severity, sla_breached, assigned_department, title, description");
      if (!alive) return;
      if (error || !data) {
        setLoaded(true);
        return;
      }
      const pts = data
        .map((c: any) => {
          const latLng = parseLocationToLatLng(c.location);
          if (!latLng) return null;
          return {
            lat: latLng.lat,
            lng: latLng.lng,
            severity: c.effective_severity || c.severity,
            sla_breached: !!c.sla_breached,
            assigned_department: c.assigned_department,
            title: c.title ?? "",
            description: c.description ?? "",
          };
        })
        .filter((p): p is ComplaintPoint => !!p);
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
