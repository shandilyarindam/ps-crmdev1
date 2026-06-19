"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { Globe, Map as MapIcon } from "lucide-react";
import union from "@turf/union";
import { featureCollection } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

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
  status: string;
  severity: string;
  lat: number;
  lng: number;
  sla_breached?: boolean;
  assigned_department?: string | null;
};

const DEFAULT_CENTER: [number, number] = [77.209, 28.6139]; // [longitude, latitude] for MapLibre
const DEFAULT_ZOOM = 10.5;

const DELHI_BOUNDS: [[number, number], [number, number]] = [
  [76.68, 28.25], // Southwest [lng, lat]
  [77.50, 29.03], // Northeast [lng, lat]
];
const INDIA_CENTER: [number, number] = [78.9629, 20.5937];
const INDIA_ZOOM = 4.5;

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

const getRegionPopulation = (name: string, props: any) => {
  if (props.totalpop) return `${(props.totalpop / 100000).toFixed(2)} Lakh`;
  const zonePops: Record<string, string> = {
    "City-SP": "1.12 Lakh",
    "Karol Bagh": "1.45 Lakh",
    "Civil Lines": "1.82 Lakh",
    "Narela": "2.24 Lakh",
    "Rohini": "2.51 Lakh",
    "Keshav Puram": "1.92 Lakh",
    "West": "2.33 Lakh",
    "Najafgarh": "2.13 Lakh",
    "South": "2.41 Lakh",
    "Central": "2.05 Lakh",
    "Shahdara South": "2.11 Lakh",
    "Shahdara North": "2.58 Lakh",
  };
  return zonePops[name] || zonePops[props.name] || "2.1 Lakh";
};

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
  defaultViewMode = "delhi",
  complaints = [],
}: {
  selectedComplaintId?: string | null;
  recenterTrigger?: number;
  regions?: RegionFeature[];
  regionCounts?: Record<string, number>;
  onRegionClick?: (regionId: string) => void;
  fitToRegionId?: string;
  choropleth?: boolean;
  showComplaints?: boolean;
  activeLayer?: string;
  intensity?: number;
  showRecenterButton?: boolean;
  defaultViewMode?: "delhi" | "india";
  complaints?: MapComplaint[];
}) {
  const [isClientReady, setIsClientReady] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedPopupComplaint, setSelectedPopupComplaint] = useState<MapComplaint | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<{ id: string; name: string; count?: number; x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<"delhi" | "india">(defaultViewMode);
  const [appliedMaxBounds, setAppliedMaxBounds] = useState<[[number, number], [number, number]] | undefined>(
    defaultViewMode === "delhi" ? DELHI_BOUNDS : undefined
  );
  const [activeHUDTab, setActiveHUDTab] = useState("complaints");
  const { theme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const isTransitioningFromIndiaRef = useRef(false);

  const mapStyle = getMapStyle(theme);

  const handleHUDTabChange = (tabId: string) => {
    setActiveHUDTab(tabId);
  };

  const handleToggleViewMode = () => {
    const nextMode = viewMode === "delhi" ? "india" : "delhi";
    setViewMode(nextMode);

    const map = mapRef.current;
    if (map) {
      if (nextMode === "delhi") {
        isTransitioningFromIndiaRef.current = true;
      } else {
        // Clear bounds instantly so we can zoom out to all of India
        map.getMap().setMaxBounds(undefined);
        setAppliedMaxBounds(undefined);
        map.flyTo({
          center: INDIA_CENTER,
          zoom: INDIA_ZOOM,
          duration: 1500,
        });
      }
    }
  };

  const filteredComplaints = useMemo(() => {
    let pts = complaints;

    if (activeHUDTab === "health") {
      pts = pts.filter((c) => {
        const title = (c.title ?? "").toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        const dept = (c.assigned_department ?? "").toLowerCase();
        return title.includes("water") || title.includes("sewage") || title.includes("leak") || title.includes("drain") || desc.includes("water") || desc.includes("sewage") || desc.includes("leak") || desc.includes("drain") || dept === "djb";
      });
    } else if (activeHUDTab === "infrastructure") {
      pts = pts.filter((c) => {
        const title = (c.title ?? "").toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        const dept = (c.assigned_department ?? "").toLowerCase();
        return title.includes("road") || title.includes("pothole") || desc.includes("road") || desc.includes("pothole") || dept === "pwd" || title.includes("light") || title.includes("electricity") || desc.includes("light") || desc.includes("electricity");
      });
    } else if (activeHUDTab === "environment") {
      pts = pts.filter((c) => {
        const title = (c.title ?? "").toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        const dept = (c.assigned_department ?? "").toLowerCase();
        return title.includes("garbage") || title.includes("dump") || desc.includes("garbage") || desc.includes("dump") || dept === "mcd";
      });
    } else if (activeHUDTab === "safety") {
      pts = pts.filter((c) => {
        const title = (c.title ?? "").toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        const sev = normalizeSeverityLevel(c.severity);
        return sev === "L4" || title.includes("cctv") || title.includes("camera") || title.includes("detect") || desc.includes("cctv") || desc.includes("camera") || desc.includes("detect");
      });
    } else if (activeHUDTab === "projects") {
      return [
        { id: "proj-1", title: "Flyover Construction (Najafgarh)", description: "Elevated road construction at 84% progress. ETA: Dec 2026.", status: "in_progress", severity: "L1", lat: 28.61, lng: 77.01, assigned_department: "pwd" },
        { id: "proj-2", title: "Wastewater Treatment Plant Upgrade", description: "Enhancing capacity to 15 MGD. Phase 2 completion.", status: "in_progress", severity: "L2", lat: 28.58, lng: 77.22, assigned_department: "djb" },
        { id: "proj-3", title: "Smog Tower Installation (Connaught Place)", description: "High capacity air filter maintenance check.", status: "active", severity: "L1", lat: 28.63, lng: 77.21, assigned_department: "mcd" },
        { id: "proj-4", title: "CCTV Network Integration (North Delhi)", description: "Installing 400 new smart surveillance nodes.", status: "planning", severity: "L3", lat: 28.71, lng: 77.15, assigned_department: "pwd" }
      ] as MapComplaint[];
    }

    if (!activeLayer || activeLayer === "density") return pts;
    return pts.filter((c) => {
      const title = (c.title ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      const dept = (c.assigned_department ?? "").toLowerCase();
      const sev = normalizeSeverityLevel(c.severity);

      if (activeLayer === "critical") return sev === "L4";
      if (activeLayer === "sla") return !!c.sla_breached;
      if (activeLayer === "garbage") return title.includes("garbage") || title.includes("dump") || desc.includes("garbage") || desc.includes("dump") || dept === "mcd";
      if (activeLayer === "roads") return title.includes("road") || title.includes("pothole") || desc.includes("road") || desc.includes("pothole") || dept === "pwd";
      if (activeLayer === "water") return title.includes("water") || title.includes("sewage") || title.includes("leak") || title.includes("drain") || desc.includes("water") || desc.includes("sewage") || desc.includes("leak") || desc.includes("drain") || dept === "djb";
      if (activeLayer === "streetlights") return title.includes("light") || title.includes("electricity") || desc.includes("light") || desc.includes("electricity");
      if (activeLayer === "cctv") return title.includes("cctv") || title.includes("camera") || title.includes("detect") || desc.includes("cctv") || desc.includes("camera") || desc.includes("detect");
      return true;
    });
  }, [complaints, activeLayer, activeHUDTab]);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const getBBoxForFeatures = useCallback((features: RegionFeature[]) => {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    let hasCoords = false;
    const traverseCoords = (coords: any) => {
      if (Array.isArray(coords[0])) {
        coords.forEach(traverseCoords);
      } else if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        const [lng, lat] = coords;
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

  const max = useMemo(() => Math.max(1, ...Object.values(regionCounts ?? {})), [regionCounts]);
  const safeRegions = useMemo(() => (regions ?? []).filter((r) => {
    const g = r.geometry as { type?: string; coordinates?: unknown };
    return (g?.type === "Polygon" || g?.type === "MultiPolygon") && Array.isArray(g.coordinates) && g.coordinates.length > 0;
  }), [regions]);

  const handleRecenter = () => {
    if (viewMode === "delhi" && safeRegions.length > 0) {
      const targetFeatures = fitToRegionId
        ? safeRegions.filter((f) => String(f.id) === String(fitToRegionId))
        : safeRegions;

      if (targetFeatures.length > 0) {
        const bbox = getBBoxForFeatures(targetFeatures);
        if (bbox) {
          mapRef.current?.fitBounds(bbox, {
            padding: 40,
            duration: 1500,
          });
          return;
        }
      }
    }

    mapRef.current?.flyTo({
      center: viewMode === "delhi" ? DEFAULT_CENTER : INDIA_CENTER,
      zoom: viewMode === "delhi" ? DEFAULT_ZOOM : INDIA_ZOOM,
      duration: 1500,
    });
  };

  const regionGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: safeRegions.map((f) => ({
      ...f,
      properties: { ...f.properties, id: String(f.id), count: regionCounts?.[String(f.id)] ?? 0, name: (f.properties?.name as string) ?? (f.properties?.wardname as string) ?? String(f.id) },
    })),
  }), [safeRegions, regionCounts]);

  const maskGeoJSON = useMemo(() => {
    if (!safeRegions.length) return null;
    const unioned = safeRegions.reduce((acc, curr) => (acc ? union(featureCollection([acc, curr])) : curr), null as any);
    return unioned;
  }, [safeRegions]);

  const fillColorExpression = useMemo(() => {
    if (!choropleth) return theme === "dark" ? "rgba(39, 39, 42, 0.45)" : "rgba(226, 232, 240, 0.45)";
    return ["step", ["get", "count"], "#22c55e", max * 0.25, "#eab308", max * 0.5, "#f97316", max * 0.75, "#ef4444"];
  }, [choropleth, theme, max]);

  useEffect(() => {
    if (!isClientReady || !safeRegions.length || viewMode !== "delhi") return;

    const targetFeatures = fitToRegionId
      ? safeRegions.filter((f) => String(f.id) === String(fitToRegionId))
      : safeRegions;

    if (!targetFeatures.length) return;

    const bbox = getBBoxForFeatures(targetFeatures);
    if (bbox) {
      mapRef.current?.fitBounds(bbox, {
        padding: 40,
        duration: 1500,
      });

      if (isTransitioningFromIndiaRef.current) {
        isTransitioningFromIndiaRef.current = false;
        const timer = setTimeout(() => {
          const innerMap = mapRef.current;
          if (innerMap && viewMode === "delhi") {
            innerMap.getMap().setMaxBounds(DELHI_BOUNDS);
            setAppliedMaxBounds(DELHI_BOUNDS);
          }
        }, 1550);
        return () => clearTimeout(timer);
      }
    }
  }, [isClientReady, safeRegions, fitToRegionId, viewMode, getBBoxForFeatures]);

  const onMouseMove = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === "regions-fill") {
      setHoveredFeature({ id: feature.properties.id, name: feature.properties.name, count: feature.properties.count, x: event.point.x, y: event.point.y });
    } else { setHoveredFeature(null); }
  }, []);

  const onMouseLeave = useCallback(() => { setHoveredFeature(null); }, []);
  const onMapClick = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === "regions-fill" && feature.properties.id !== "unzoned" && onRegionClick) onRegionClick(feature.properties.id);
  }, [onRegionClick]);

  const complaintGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: filteredComplaints.map((c) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
      properties: { id: c.id, intensity: ["L4", "L3", "L2", "L1"].indexOf(normalizeSeverityLevel(c.severity)) * 0.25 + 0.25 },
    })),
  }), [filteredComplaints]);

  const hoveredFeatureStats = useMemo(() => {
    if (!hoveredFeature) return null;
    return { population: getRegionPopulation(hoveredFeature.name, {}), total: (hoveredFeature.count || 0) * 12, critical: Math.floor((hoveredFeature.count || 0) * 0.3), slaBreached: Math.floor((hoveredFeature.count || 0) * 0.15), satisfaction: "68%", topDept: "PWD", healthScore: 72, trend: "+12%", isPositive: true };
  }, [hoveredFeature]);

  if (!isClientReady) return null;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <style jsx global>{`
        @keyframes pulse-glow {
          0% { transform: scale(0.95); opacity: 0.85; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); opacity: 0.85; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-glow-effect { animation: pulse-glow 2s infinite ease-in-out; }
      `}</style>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <button onClick={() => { if (viewMode !== "delhi") handleToggleViewMode(); }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${viewMode === "delhi" ? "bg-slate-900 text-white shadow-sm dark:bg-zinc-800" : "text-slate-500 hover:text-slate-700"}`}>
          <MapIcon size={12} /><span>Delhi View</span>
        </button>
        <button onClick={() => { if (viewMode !== "india") handleToggleViewMode(); }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${viewMode === "india" ? "bg-slate-900 text-white shadow-sm dark:bg-zinc-800" : "text-slate-500 hover:text-slate-700"}`}>
          <Globe size={12} /><span>India View</span>
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />
        {[{ id: "complaints", label: "Complaints" }, { id: "projects", label: "Projects" }, { id: "health", label: "Health" }, { id: "infrastructure", label: "Infrastructure" }, { id: "environment", label: "Environment" }, { id: "safety", label: "Public Safety" }].map((item) => (
          <button key={item.id} onClick={() => handleHUDTabChange(item.id)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${activeHUDTab === item.id ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "text-slate-500 hover:text-slate-700"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="absolute right-4 top-4 z-[1000] flex items-center gap-3 pointer-events-none">
        {showComplaints && (
          <button onClick={() => setShowHeatmap(!showHeatmap)} className="pointer-events-auto rounded-lg bg-slate-950/80 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md border border-slate-800 hover:bg-slate-900 transition-all active:scale-95">
            {showHeatmap ? "Show Markers" : "Show Heatmap"}
          </button>
        )}
      </div>

      <Map ref={mapRef} initialViewState={{ longitude: DEFAULT_CENTER[0], latitude: DEFAULT_CENTER[1], zoom: DEFAULT_ZOOM }} maxBounds={appliedMaxBounds} style={{ height: "100%", width: "100%" }} mapStyle={mapStyle} scrollZoom={true} interactiveLayerIds={regions && regions.length > 0 ? ["regions-fill"] : []} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} onClick={onMapClick}>
        {regions && regions.length > 0 && (
          <Source id="regions-source" type="geojson" data={regionGeoJSON}>
            <Layer id="regions-shadow" type="fill" paint={{ "fill-color": "#000000", "fill-opacity": theme === "dark" ? 0.5 : 0.25, "fill-translate": [4, 6] }} />
            <Layer id="regions-fill" type="fill" paint={{ "fill-color": fillColorExpression as any, "fill-opacity": choropleth ? 0.55 : 0.15 }} />
            <Layer id="regions-line" type="line" paint={{ "line-color": theme === "dark" ? "#52525b" : "#94a3b8", "line-width": 1.25 }} />
            <Layer id="regions-hover-line" type="line" filter={["==", ["get", "id"], hoveredFeature?.id ?? ""]} paint={{ "line-color": theme === "dark" ? "#f59e0b" : "#d97706", "line-width": 2.5 }} />
          </Source>
        )}

        {showComplaints && !showHeatmap &&
          filteredComplaints.map((c) => {
            const severity = normalizeSeverityLevel(c.severity);
            const isCritical = severity === "L4";
            const color = SEVERITY_COLOR[severity];
            return (
              <Marker key={c.id} longitude={c.lng} latitude={c.lat} onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedPopupComplaint(c); }}>
                <div className="relative group cursor-pointer">
                  {isCritical && <div className="absolute -inset-2.5 rounded-full animate-ping opacity-60 pointer-events-none" style={{ border: `2px solid ${color}`, animationDuration: "1.8s" }} />}
                  <div style={{ backgroundColor: color, width: isCritical ? "13px" : "9px", height: isCritical ? "13px" : "9px", borderRadius: "50%", border: "1.5px solid #ffffff", boxShadow: `0 0 6px ${color}` }} className="transition-transform duration-200 group-hover:scale-125" />
                </div>
              </Marker>
            );
          })}

        {selectedPopupComplaint && (
          <Popup longitude={selectedPopupComplaint.lng} latitude={selectedPopupComplaint.lat} anchor="bottom" onClose={() => setSelectedPopupComplaint(null)} closeOnClick={false} offset={10}>
            <div className="text-sm text-gray-900"><strong>{selectedPopupComplaint.title}</strong><br />{selectedPopupComplaint.description}<br /><b>Severity:</b> {selectedPopupComplaint.severity}</div>
          </Popup>
        )}

        {showComplaints && showHeatmap && (
          <Source id="heatmap-source" type="geojson" data={complaintGeoJSON}>
            <Layer id="heatmap-layer" type="heatmap" paint={{ "heatmap-weight": ["get", "intensity"], "heatmap-intensity": intensity / 100, "heatmap-radius": 20, "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "#22c55e", 0.45, "#eab308", 0.7, "#f97316", 1.0, "#ef4444"] }} />
          </Source>
        )}
      </Map>

      {hoveredFeature && (
        <div className="pointer-events-none absolute z-[2000] w-64 rounded-xl border border-slate-800 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md" style={{ left: hoveredFeature.x + 20, top: hoveredFeature.y + 20 }}>
          <div className="mb-2.5 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-100">{hoveredFeature.name}</span>
            {hoveredFeatureStats && <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${hoveredFeatureStats.healthScore >= 60 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>Score: {hoveredFeatureStats.healthScore}</span>}
          </div>
          {hoveredFeatureStats ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
              <div><span className="block text-[8px] font-medium uppercase tracking-wider text-slate-500">Population</span><span className="font-bold text-slate-200">{hoveredFeatureStats.population}</span></div>
              <div><span className="block text-[8px] font-medium uppercase tracking-wider text-slate-500">Complaints</span><span className="font-bold text-slate-200">{hoveredFeatureStats.total}</span></div>
              <div><span className="block text-[8px] font-medium uppercase tracking-wider text-slate-500">Critical</span><span className="font-bold text-red-400">{hoveredFeatureStats.critical}</span></div>
              <div><span className="block text-[8px] font-medium uppercase tracking-wider text-slate-500">SLA Breaches</span><span className="font-bold text-amber-500">{hoveredFeatureStats.slaBreached}</span></div>
              <div className="col-span-2 border-t border-slate-900 pt-1.5 mt-0.5 flex justify-between"><span className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Weekly Trend</span><span className="font-bold text-emerald-400">{hoveredFeatureStats.trend}</span></div>
            </div>
          ) : <div className="text-[10px] text-slate-400">Loading metrics...</div>}
        </div>
      )}

      {showRecenterButton && (
        <div className="absolute right-4 bottom-20 z-[1000] pointer-events-auto">
          <button onClick={handleRecenter} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 shadow-md hover:bg-white border border-slate-200 transition-all active:scale-95 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
