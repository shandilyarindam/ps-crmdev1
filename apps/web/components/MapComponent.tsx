"use client";

import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { Layer, PathOptions } from "leaflet";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import type { Tables } from "@/src/types/database.types";
import { useTheme } from "@/components/ThemeProvider";
import { getMapTileLayerConfig } from "@/lib/map-tiles";
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

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];
const DEFAULT_ZOOM = 12;

// Module-level Leaflet import promise to trigger parallel fetching before component mounts
const leafletPromise = typeof window !== "undefined" ? import("leaflet") : null;

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
  highQuality,
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
  highQuality?: boolean;
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
  /** Render the complaint marker/heatmap layer + toggle. Default true (unchanged for existing pages). */
  showComplaints?: boolean;
  activeLayer?: string;
  intensity?: number;
  /** Show a button to recenter the map to default view when zoomed or panned away */
  showRecenterButton?: boolean;
}) {
  const [complaints, setComplaints] = useState<MapComplaint[]>([]);
  const [mounted, setMounted] = useState(false);
  const [leaflet, setLeaflet] = useState<any>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rawCount, setRawCount] = useState(0);
  const { theme } = useTheme();
  const tileConfig = getMapTileLayerConfig({ theme, highQuality });

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
    setMounted(true);
    if (leafletPromise) {
      leafletPromise.then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;

        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        setLeaflet(L);
      });
    }

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

  if (!mounted || !leaflet || typeof window === 'undefined') return null;

  const getSeverityIcon = (severity: string, L: any) => {
    const level = normalizeSeverityLevel(severity);
    const color = SEVERITY_COLOR[level];

    return new L.DivIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
        "></div>
      `,
      className: "",
    });
  };

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

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        maxZoom={highQuality ? 20 : 19}
        zoomSnap={highQuality ? 0.25 : 1}
        zoomDelta={highQuality ? 0.25 : 1}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          detectRetina={tileConfig.detectRetina}
          maxNativeZoom={tileConfig.maxNativeZoom}
          subdomains={tileConfig.subdomains}
        />
        <ZoomToComplaint
          complaints={filteredComplaints}
          selectedComplaintId={selectedComplaintId}
        />
        <ResetToDefaultView recenterTrigger={recenterTrigger} />
        <RecenterButton show={showRecenterButton} regions={regions} fitToRegionId={fitToRegionId} />

        {regions && regions.length > 0 && (
          <>
            <RegionsLayer
              regions={regions}
              regionCounts={regionCounts}
              onRegionClick={onRegionClick}
              choropleth={choropleth}
              isDark={theme === "dark"}
            />
            <FitBounds regions={regions} fitToRegionId={fitToRegionId} />
          </>
        )}

        {showComplaints && !showHeatmap &&
          filteredComplaints.map((c) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={
                leaflet
                  ? getSeverityIcon(c.severity, leaflet)
                  : undefined
              }
            >
              <Popup>
                <strong>{c.title}</strong>
                <br />
                {c.description}
                <br />
                <b>Severity:</b> {c.severity}
              </Popup>
            </Marker>
          ))}

        {showComplaints && showHeatmap && <HeatmapLayer complaints={filteredComplaints} intensity={intensity} />}
      </MapContainer>

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

function ResetToDefaultView({ recenterTrigger }: { recenterTrigger?: number }) {
  const map = useMap();

  useEffect(() => {
    if (!recenterTrigger) return;
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
  }, [recenterTrigger, map]);

  return null;
}

function HeatmapLayer({ complaints, intensity = 70 }: { complaints: any[]; intensity?: number }) {
  const map = useMap();

  useEffect(() => {
    const L = require("leaflet");
    if (typeof window !== "undefined" && !(window as any).L) {
      (window as any).L = L;
    }
    require("leaflet.heat");

    // Scale intensity (10-100) to adjust heatmap radius and blur
    const radius = Math.round(10 + (intensity / 100) * 25);
    const blur = Math.round(10 + (intensity / 100) * 15);

    const heatLayer = (L as any).heatLayer(
      complaints.map((c: any) => [
        c.lat,
        c.lng,
        getIntensity(c.severity),
      ]),
      {
        radius: radius,
        blur: blur,
        minOpacity: 0.35,
        gradient: {
          0.2: "#22c55e",
          0.45: "#eab308",
          0.7: "#f97316",
          1.0: "#ef4444",
        },
      }
    );

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [complaints, map, intensity]);

  return null;
}

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
function RegionsLayer({
  regions,
  regionCounts,
  onRegionClick,
  choropleth,
  isDark,
}: {
  regions: RegionFeature[];
  regionCounts?: Record<string, number>;
  onRegionClick?: (regionId: string) => void;
  choropleth: boolean;
  isDark: boolean;
}) {
  const max = useMemo(
    () => Math.max(1, ...Object.values(regionCounts ?? {})),
    [regionCounts]
  );

  // Defensive: only render features with a usable Polygon/MultiPolygon geometry
  // so one malformed feature can never crash the GeoJSON layer.
  const safeRegions = useMemo(
    () =>
      regions.filter((r) => {
        const g = r.geometry as { type?: string; coordinates?: unknown };
        return (
          (g?.type === "Polygon" || g?.type === "MultiPolygon") &&
          Array.isArray(g.coordinates) &&
          g.coordinates.length > 0
        );
      }),
    [regions]
  );

  // GeoJSON caches its `data`; bump the key so fills/handlers refresh on change.
  const layerKey = useMemo(
    () => safeRegions.map((r) => String(r.id)).join(",") + "|" + JSON.stringify(regionCounts ?? {}) + "|" + String(choropleth) + "|" + String(isDark),
    [safeRegions, regionCounts, choropleth, isDark]
  );

  const data = useMemo(
    () => ({ type: "FeatureCollection" as const, features: safeRegions }),
    [safeRegions]
  );

  const fillFor = (id: string): string => {
    const c = regionCounts?.[id] ?? 0;
    if (!choropleth || c <= 0) return isDark ? "#27272a" : "#e2e8f0";
    const t = c / max;
    if (t > 0.75) return "#ef4444";
    if (t > 0.5) return "#f97316";
    if (t > 0.25) return "#eab308";
    return "#22c55e";
  };

  const styleFor = (feature?: RegionFeature): PathOptions => {
    const id = String(feature?.id ?? "");
    return {
      color: isDark ? "#52525b" : "#94a3b8",
      weight: 1,
      fillColor: fillFor(id),
      fillOpacity: choropleth ? 0.55 : 0.15,
    };
  };

  const onEachFeature = (feature: RegionFeature, layer: Layer) => {
    const id = String(feature?.id ?? "");
    const name =
      (feature?.properties?.name as string) ??
      (feature?.properties?.wardname as string) ??
      id;
    const count = regionCounts?.[id];
    layer.bindTooltip(count != null ? `${name} · ${count}` : String(name), {
      sticky: true,
    });

    if (!id || id === "unzoned" || !onRegionClick) return;
    layer.on({
      click: () => onRegionClick(id),
      mouseover: (e) =>
        (e.target as { setStyle: (s: PathOptions) => void }).setStyle({
          weight: 2.5,
          fillOpacity: choropleth ? 0.75 : 0.3,
        }),
      mouseout: (e) =>
        (e.target as { setStyle: (s: PathOptions) => void }).setStyle(styleFor(feature)),
    });
  };

  if (safeRegions.length === 0) return null;

  return (
    <GeoJSON
      key={layerKey}
      data={data as never}
      style={styleFor as never}
      onEachFeature={onEachFeature as never}
    />
  );
}

function FitBounds({
  regions,
  fitToRegionId,
}: {
  regions: RegionFeature[];
  fitToRegionId?: string;
}) {
  const map = useMap();

  useEffect(() => {
    const L = require("leaflet");
    const target = fitToRegionId
      ? regions.find((r) => String(r.id) === String(fitToRegionId))
      : null;
    const features = target ? [target] : regions;
    if (!features.length) return;
    try {
      const bounds = L.geoJSON({ type: "FeatureCollection", features }).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { 
          paddingTopLeft: [320, 20],
          paddingBottomRight: [20, 20] 
        });
      }
    } catch {
      /* ignore fit errors */
    }
  }, [regions, fitToRegionId, map]);

  return null;
}

function ZoomToComplaint({
  complaints,
  selectedComplaintId,
}: {
  complaints: MapComplaint[];
  selectedComplaintId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedComplaintId) return;

    const complaint = complaints.find(
      (c) => c.id === selectedComplaintId
    );

    if (complaint) {
      map.setView([complaint.lat, complaint.lng], 15, {
        animate: true,
      });
    }
  }, [selectedComplaintId, complaints, map]);

  return null;
}

function RecenterButton({ show, regions, fitToRegionId }: { show: boolean, regions?: RegionFeature[], fitToRegionId?: string }) {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(false);
  const [initialBounds, setInitialBounds] = useState<any>(null);

  useEffect(() => {
    if (!regions || regions.length === 0) return;
    const L = require("leaflet");
    const target = fitToRegionId
      ? regions.find((r) => String(r.id) === String(fitToRegionId))
      : null;
    const features = target ? [target] : regions;
    if (!features.length) return;
    try {
      const bounds = L.geoJSON({ type: "FeatureCollection", features }).getBounds();
      if (bounds.isValid()) {
        setInitialBounds(bounds);
      }
    } catch {
      /* ignore */
    }
  }, [regions, fitToRegionId]);

  useEffect(() => {
    if (!show) return;

    const checkZoom = () => {
      // Show the button if the user has changed the view significantly
      // Since we fitBounds initially, we can just check if center/zoom changed from current
      setIsVisible(true);
    };
    
    // We can just always show it, or check distance. For simplicity, just show it when show=true
    setIsVisible(true);
  }, [show]);

  if (!show || !isVisible) return null;

  return (
    <div className="absolute right-4 bottom-20 z-[1000] pointer-events-auto">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (initialBounds) {
            map.fitBounds(initialBounds, { 
              paddingTopLeft: [320, 20],
              paddingBottomRight: [20, 20], 
              animate: true 
            });
          } else {
            // Fallback for overview if no regions
            map.setView(DEFAULT_CENTER, 10.5, { animate: true });
          }
        }}
        title="Recenter Map"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 shadow-md hover:bg-white border border-slate-200 text-slate-700 transition-all active:scale-95 backdrop-blur-sm dark:bg-zinc-900/90 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>
  );
}
