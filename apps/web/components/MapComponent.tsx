"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import { supabase } from "@/src/lib/supabase";
import type { Tables } from "@/src/types/database.types";
import { useTheme } from "@/components/ThemeProvider";
import { getMapStyle } from "@/lib/map-tiles";
import { parseLocationToLatLng } from "@/lib/parse-location";

type ComplaintRow = Tables<"complaints">;

type MapComplaint = {
  id: string;
  title: string;
  description: string;
  severity: string;
  lat: number;
  lng: number;
  sla_breached?: boolean;
  assigned_department?: string | null;
};

const DEFAULT_CENTER: [number, number] = [77.209, 28.6139]; // [longitude, latitude] for MapLibre
const DEFAULT_ZOOM = 12;

const SEVERITY_COLOR: Record<string, string> = {
  L1: "#38bdf8",
  L2: "#f59e0b",
  L3: "#f97316",
  L4: "#ef4444",
};

function normalizeSeverityLevel(severity: string): "L1" | "L2" | "L3" | "L4" {
  const s = (severity ?? "").toLowerCase().trim();
  if (s === "l4" || s === "critical" || s === "crit") return "L4";
  if (s === "l3" || s === "high") return "L3";
  if (s === "l2" || s === "medium" || s === "med") return "L2";
  return "L1";
}

type RegionFeature = Feature<Polygon | MultiPolygon>;

export default function MapComponent({
  selectedComplaintId,
  recenterTrigger,
  regions,
  regionCounts,
  onRegionClick,
  fitToRegionId,
  choropleth = false,
  showComplaints = true,
  activeLayer = "density",
  intensity = 70,
  showRecenterButton = false,
}: {
  selectedComplaintId?: string | null;
  recenterTrigger?: number;
  /** Polygon features to draw (zones at Delhi level, wards at zone/ward level). */
  regions?: RegionFeature[];
  /** regionId -> complaint count, drives choropleth fill. */
  regionCounts?: Record<string, number>;
  /** Click a region to drill down. */
  onRegionClick?: (regionId: string) => void;
  /** Pan/zoom-fit to one region id; if omitted, fits all `regions`. */
  fitToRegionId?: string;
  /** Color regions by density (Delhi/Zone). Default false. */
  choropleth?: boolean;
  /** Render the complaint marker/heatmap layer + toggle. Default true. */
  showComplaints?: boolean;
  activeLayer?: string;
  intensity?: number;
  /** Show a button to recenter the map to default view when zoomed or panned away */
  showRecenterButton?: boolean;
}) {
  const [complaints, setComplaints] = useState<MapComplaint[]>([]);
  const [isClientReady, setIsClientReady] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rawCount, setRawCount] = useState(0);
  const [selectedPopupComplaint, setSelectedPopupComplaint] = useState<MapComplaint | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<{ id: string; name: string; count?: number; x: number; y: number } | null>(null);
  const { theme } = useTheme();
  const mapRef = useRef<MapRef>(null);

  const mapStyle = getMapStyle(theme);

  const filteredComplaints = useMemo(() => {
    if (!activeLayer || activeLayer === "density") return complaints;
    return complaints.filter((c) => {
      const title = (c.title ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      const dept = (c.assigned_department ?? "").toLowerCase();
      const sev = normalizeSeverityLevel(c.severity);

      if (activeLayer === "critical") {
        return sev === "L4";
      }
      if (activeLayer === "sla") {
        return !!c.sla_breached;
      }
      if (activeLayer === "garbage") {
        return title.includes("garbage") || title.includes("dump") || desc.includes("garbage") || desc.includes("dump") || dept === "mcd";
      }
      if (activeLayer === "roads") {
        return title.includes("road") || title.includes("pothole") || desc.includes("road") || desc.includes("pothole") || dept === "pwd";
      }
      if (activeLayer === "water") {
        return title.includes("water") || title.includes("sewage") || title.includes("leak") || title.includes("drain") || desc.includes("water") || desc.includes("sewage") || desc.includes("leak") || desc.includes("drain") || dept === "djb";
      }
      if (activeLayer === "streetlights") {
        return title.includes("light") || title.includes("electricity") || desc.includes("light") || desc.includes("electricity");
      }
      if (activeLayer === "cctv") {
        return title.includes("cctv") || title.includes("camera") || title.includes("detect") || desc.includes("cctv") || desc.includes("camera") || desc.includes("detect");
      }
      return true;
    });
  }, [complaints, activeLayer]);

  // Fetch complaints from Supabase
  async function fetchComplaints() {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, title, description, location, severity, effective_severity, sla_breached, assigned_department");

      if (error) {
        setFetchError(error.message || "Unable to fetch complaints.");
        setComplaints([]);
        return;
      }

      if (!data) {
        setFetchError(null);
        setComplaints([]);
        setRawCount(0);
        return;
      }

      setRawCount(data.length);

      const formatted: MapComplaint[] = data
        .map((c: any) => {
          const parsed = parseLocationToLatLng(c.location);
          if (!parsed) return null;

          return {
            id: c.id,
            title: c.title,
            description: c.description,
            severity: c.effective_severity || c.severity,
            lat: parsed.lat,
            lng: parsed.lng,
            sla_breached: c.sla_breached,
            assigned_department: c.assigned_department,
          };
        })
        .filter(Boolean) as MapComplaint[];

      setFetchError(null);
      setComplaints(formatted);
    } catch {
      setFetchError("Unable to fetch complaints.");
      setComplaints([]);
      setRawCount(0);
    }
  }

  useEffect(() => {
    setIsClientReady(true);
    fetchComplaints();

    // PERFORMANCE OPTIMIZATION: Realtime subscription instead of 5s polling
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        () => {
          console.log('Complaints changed, fetching updates...');
          void fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Recenter/fly-to on external selectedComplaintId changes
  useEffect(() => {
    if (!selectedComplaintId || complaints.length === 0) return;
    const complaint = complaints.find((c) => c.id === selectedComplaintId);
    if (complaint) {
      setSelectedPopupComplaint(complaint);
      mapRef.current?.flyTo({
        center: [complaint.lng, complaint.lat],
        zoom: 15,
        duration: 1500,
      });
    }
  }, [selectedComplaintId, complaints]);

  // Recenter/fly-to on external recenterTrigger changes
  useEffect(() => {
    if (!recenterTrigger) return;
    mapRef.current?.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      duration: 1500,
    });
  }, [recenterTrigger]);

  // Bounding box calculation for regions and fitting bounds
  const getBBoxForFeatures = useCallback((features: RegionFeature[]) => {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    let hasCoords = false;

    const traverseCoords = (coords: any) => {
      if (Array.isArray(coords[0])) {
        coords.forEach(traverseCoords);
      } else if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        const lng = coords[0];
        const lat = coords[1];
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
        hasCoords = true;
      }
    };

    features.forEach((f) => {
      if (f.geometry && f.geometry.coordinates) {
        traverseCoords(f.geometry.coordinates);
      }
    });

    return hasCoords ? [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]] : null;
  }, []);

  // Fit map bounds to regions
  useEffect(() => {
    if (!regions || regions.length === 0) return;
    const target = fitToRegionId
      ? regions.find((r) => String(r.id) === String(fitToRegionId))
      : null;
    const features = target ? [target] : regions;
    const bounds = getBBoxForFeatures(features);
    if (bounds) {
      const timer = setTimeout(() => {
        mapRef.current?.fitBounds(bounds, { padding: 20, duration: 1500 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [regions, fitToRegionId, getBBoxForFeatures]);

  const handleRecenter = () => {
    if (regions && regions.length > 0) {
      const target = fitToRegionId
        ? regions.find((r) => String(r.id) === String(fitToRegionId))
        : null;
      const features = target ? [target] : regions;
      const bounds = getBBoxForFeatures(features);
      if (bounds) {
        mapRef.current?.fitBounds(bounds, { padding: 20, duration: 1500 });
        return;
      }
    }
    mapRef.current?.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      duration: 1500,
    });
  };

  // Choropleth color calculation for layers
  const max = useMemo(() => Math.max(1, ...Object.values(regionCounts ?? {})), [regionCounts]);

  const safeRegions = useMemo(() => {
    if (!regions) return [];
    return regions.filter((r) => {
      const g = r.geometry as { type?: string; coordinates?: unknown };
      return (
        (g?.type === "Polygon" || g?.type === "MultiPolygon") &&
        Array.isArray(g.coordinates) &&
        g.coordinates.length > 0
      );
    });
  }, [regions]);

  const regionGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: safeRegions.map((f) => {
        const id = String(f.id);
        const count = regionCounts?.[id] ?? 0;
        const name = (f.properties?.name as string) ?? (f.properties?.wardname as string) ?? id;
        return {
          ...f,
          properties: {
            ...f.properties,
            id,
            count,
            name,
          },
        };
      }),
    };
  }, [safeRegions, regionCounts]);

  const fillColorExpression = useMemo(() => {
    if (!choropleth) {
      return theme === "dark" ? "#27272a" : "#e2e8f0";
    }
    const step1 = max * 0.25;
    const step2 = max * 0.5;
    const step3 = max * 0.75;
    return [
      "case",
      ["<=", ["get", "count"], 0], theme === "dark" ? "#27272a" : "#e2e8f0",
      ["<=", ["get", "count"], step1], "#22c55e",
      ["<=", ["get", "count"], step2], "#eab308",
      ["<=", ["get", "count"], step3], "#f97316",
      "#ef4444",
    ];
  }, [choropleth, theme, max]);

  const onMouseMove = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === "regions-fill") {
      const id = feature.properties.id;
      const name = feature.properties.name;
      const count = feature.properties.count;
      setHoveredFeature({
        id,
        name,
        count,
        x: event.point.x,
        y: event.point.y,
      });
    } else {
      setHoveredFeature(null);
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    setHoveredFeature(null);
  }, []);

  const onMapClick = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === "regions-fill") {
      const id = feature.properties.id;
      if (id && id !== "unzoned" && onRegionClick) {
        onRegionClick(id);
      }
    }
  }, [onRegionClick]);

  // Heatmap source & paint configuration
  const complaintGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: filteredComplaints.map((c) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [c.lng, c.lat],
        },
        properties: {
          id: c.id,
          severity: c.severity,
          intensity: getIntensity(c.severity),
        },
      })),
    };
  }, [filteredComplaints]);

  const heatmapPaint = useMemo(() => {
    const radius = Math.round(10 + (intensity / 100) * 25);
    const val = intensity / 100;
    return {
      "heatmap-weight": ["get", "intensity"],
      "heatmap-intensity": val,
      "heatmap-radius": radius,
      "heatmap-opacity": 0.85,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(0,0,0,0)",
        0.2,
        "#22c55e",
        0.45,
        "#eab308",
        0.7,
        "#f97316",
        1.0,
        "#ef4444",
      ],
    };
  }, [intensity]);

  function getIntensity(severity: string) {
    switch (normalizeSeverityLevel(severity)) {
      case "L4":
        return 1.0;
      case "L3":
        return 0.75;
      case "L2":
        return 0.5;
      case "L1":
        return 0.25;
      default:
        return 0.3;
    }
  }

  if (!isClientReady) return null;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {showComplaints && (
        <div className="absolute right-4 top-4 z-[1000] flex items-center gap-3 pointer-events-none">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="pointer-events-auto rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white shadow-md hover:bg-gray-700 transition-colors"
          >
            {showHeatmap ? "Show Markers" : "Show Heatmap"}
          </button>
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: DEFAULT_ZOOM,
        }}
        style={{ height: "100%", width: "100%" }}
        mapStyle={mapStyle}
        scrollZoom={true}
        interactiveLayerIds={regions && regions.length > 0 ? ["regions-fill"] : []}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onMapClick}
      >
        {regions && regions.length > 0 && (
          <Source id="regions-source" type="geojson" data={regionGeoJSON}>
            {/* Base Fill Layer */}
            <Layer
              id="regions-fill"
              type="fill"
              paint={{
                "fill-color": fillColorExpression as any,
                "fill-opacity": choropleth ? 0.55 : 0.15,
              }}
            />
            {/* Outline Borders */}
            <Layer
              id="regions-line"
              type="line"
              paint={{
                "line-color": theme === "dark" ? "#52525b" : "#94a3b8",
                "line-width": 1,
              }}
            />
            {/* Hover Outline */}
            <Layer
              id="regions-hover-line"
              type="line"
              filter={["==", ["get", "id"], hoveredFeature?.id ?? ""]}
              paint={{
                "line-color": theme === "dark" ? "#f43f5e" : "#e11d48",
                "line-width": 2.5,
              }}
            />
          </Source>
        )}

        {showComplaints && !showHeatmap &&
          filteredComplaints.map((c) => (
            <Marker
              key={c.id}
              longitude={c.lng}
              latitude={c.lat}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedPopupComplaint(c);
              }}
            >
              <div
                style={{
                  backgroundColor: SEVERITY_COLOR[normalizeSeverityLevel(c.severity)],
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 0 6px rgba(0,0,0,0.4)",
                  cursor: "pointer",
                }}
              />
            </Marker>
          ))}

        {selectedPopupComplaint && (
          <Popup
            longitude={selectedPopupComplaint.lng}
            latitude={selectedPopupComplaint.lat}
            anchor="bottom"
            onClose={() => setSelectedPopupComplaint(null)}
            closeOnClick={false}
            offset={10}
          >
            <div className="text-sm text-gray-900 dark:text-gray-100">
              <strong>{selectedPopupComplaint.title}</strong>
              <br />
              {selectedPopupComplaint.description}
              <br />
              <b>Severity:</b> {selectedPopupComplaint.severity}
            </div>
          </Popup>
        )}

        {showComplaints && showHeatmap && (
          <Source id="heatmap-source" type="geojson" data={complaintGeoJSON}>
            <Layer
              id="heatmap-layer"
              type="heatmap"
              paint={heatmapPaint as any}
            />
          </Source>
        )}
      </Map>

      {hoveredFeature && (
        <div
          className="pointer-events-none absolute z-[2000] rounded bg-gray-900/90 px-2 py-1 text-xs text-white shadow-md backdrop-blur-sm dark:bg-zinc-900/90"
          style={{
            left: hoveredFeature.x + 15,
            top: hoveredFeature.y + 15,
          }}
        >
          {hoveredFeature.count !== undefined
            ? `${hoveredFeature.name} · ${hoveredFeature.count}`
            : hoveredFeature.name}
        </div>
      )}

      {showRecenterButton && (
        <div className="absolute right-4 bottom-20 z-[1000] pointer-events-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRecenter();
            }}
            title="Recenter Map"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 shadow-md hover:bg-white border border-slate-200 text-slate-700 transition-all active:scale-95 backdrop-blur-sm dark:bg-zinc-900/90 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      )}

      {fetchError && (
        <div
          style={{
            position: "absolute",
            zIndex: 2100,
            left: 20,
            top: 20,
            background: "#111",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            maxWidth: 380,
            fontSize: "13px",
          }}
        >
          Failed to load complaints: {fetchError}
        </div>
      )}

      {!fetchError && rawCount > 0 && complaints.length === 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 2100,
            left: 20,
            top: 20,
            background: "#111",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            maxWidth: 420,
            fontSize: "13px",
          }}
        >
          Loaded {rawCount} complaints, but none had valid map coordinates.
        </div>
      )}
    </div>
  );
}
