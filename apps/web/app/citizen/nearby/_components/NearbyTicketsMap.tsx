"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { ChevronDown, ChevronUp, Flame, LocateFixed } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getMapStyle } from "@/lib/map-tiles";

import type { MappedComplaint } from "./useNearbyTickets";
import { getSeverityConfig } from "./useNearbyTickets";
import { calculateDistanceMeters, formatDistance, type GeoPoint } from "./distance";

interface NearbyTicketsMapProps {
  complaints: MappedComplaint[];
  selectedId: string | null;
  flyTarget: { lat: number; lng: number } | null;
  userLocation: GeoPoint | null;
  radiusMeters: number;
  onRadiusChange: (radiusMeters: number) => void;
  onMarkerClick: (complaint: MappedComplaint) => void;
  reportLocation?: { lat: number; lng: number };
  onReportLocationMove?: (lat: number, lng: number) => void;
  customHeight?: string;
  hideCollapse?: boolean;
  onRecenterClick?: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeExpandedMapHeight(viewportHeight: number): number {
  if (viewportHeight <= 800) {
    return clamp(Math.round(viewportHeight * 0.36), 240, 360);
  }
  return clamp(Math.round(viewportHeight * 0.42), 280, 460);
}

function createGeoJSONCircle(center: [number, number], radiusMeters: number, points = 64) {
  const coords = [];
  const radiusKm = radiusMeters / 1000;
  const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]); // Close polygon

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  };
}

export default function NearbyTicketsMap({
  complaints,
  selectedId,
  flyTarget,
  userLocation,
  radiusMeters,
  onRadiusChange,
  onMarkerClick,
  reportLocation,
  onReportLocationMove,
  customHeight,
  hideCollapse,
  onRecenterClick,
}: NearbyTicketsMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const [isClientReady, setIsClientReady] = useState(false);
  const [expandedMapHeight, setExpandedMapHeight] = useState(360);
  const [collapsed, setCollapsed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);

  const mapStyle = getMapStyle(theme);

  useEffect(() => {
    setIsClientReady(true);

    const applyExpandedHeight = () => {
      setExpandedMapHeight(computeExpandedMapHeight(window.innerHeight));
    };

    applyExpandedHeight();
    window.addEventListener("resize", applyExpandedHeight);

    return () => {
      window.removeEventListener("resize", applyExpandedHeight);
    };
  }, []);

  const prevLocationRef = useRef<GeoPoint | null>(null);
  const prevRecenterRef = useRef<number>(0);

  // Live follow user location
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;

    const forceRecenter = recenterSignal !== prevRecenterRef.current;
    const prev = prevLocationRef.current;
    const movedMeters = prev ? calculateDistanceMeters(prev, userLocation) : Number.POSITIVE_INFINITY;

    if (!forceRecenter && movedMeters < 10) {
      return;
    }

    if (forceRecenter || !prev) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 18,
        duration: 800,
      });
    } else {
      mapRef.current.panTo([userLocation.lng, userLocation.lat], { duration: 800 });
    }

    prevLocationRef.current = userLocation;
    prevRecenterRef.current = recenterSignal;
  }, [userLocation, recenterSignal]);

  // Fly to target
  useEffect(() => {
    if (flyTarget && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyTarget.lng, flyTarget.lat],
        zoom: 18,
        duration: 800,
      });
    }
  }, [flyTarget]);

  function handleRecenter() {
    if (onRecenterClick) {
      onRecenterClick();
    } else {
      setRecenterSignal((prev) => prev + 1);
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => !prev);
  }

  // Radius circle GeoJSON
  const radiusCircleGeoJSON = useMemo(() => {
    if (!userLocation) return null;
    return createGeoJSONCircle([userLocation.lng, userLocation.lat], radiusMeters);
  }, [userLocation, radiusMeters]);

  // Heatmap source & paint configuration
  const heatmapGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: complaints.map((c) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [c.lng, c.lat],
        },
        properties: {
          intensity: c.effective_severity === "L4" || c.severity === "L4" ? 1.0 :
                     c.effective_severity === "L3" || c.severity === "L3" ? 0.75 :
                     c.effective_severity === "L2" || c.severity === "L2" ? 0.5 : 0.25,
        },
      })),
    };
  }, [complaints]);

  if (!isClientReady) {
    return (
      <div className="flex w-full items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-[#1e1e1e] dark:text-gray-400" style={{ height: customHeight || expandedMapHeight }}>
        Initializing map...
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden transition-all duration-300" style={{ height: collapsed ? 0 : customHeight || expandedMapHeight }}>
        {!collapsed && (
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: userLocation?.lng ?? 77.209,
              latitude: userLocation?.lat ?? 28.6139,
              zoom: 14,
            }}
            style={{ height: "100%", width: "100%" }}
            mapStyle={mapStyle}
            scrollZoom={true}
          >
            {/* Draggable pin if in report form */}
            {reportLocation && (
              <Marker
                longitude={reportLocation.lng}
                latitude={reportLocation.lat}
                draggable
                onDragEnd={(e) => {
                  onReportLocationMove?.(e.lngLat.lat, e.lngLat.lng);
                }}
              />
            )}

            {/* User Location Radius Circle & Custom Markers */}
            {userLocation && (
              <>
                {radiusCircleGeoJSON && (
                  <Source id="radius-source" type="geojson" data={radiusCircleGeoJSON}>
                    <Layer
                      id="radius-fill"
                      type="fill"
                      paint={{
                        "fill-color": "#7c3aed",
                        "fill-opacity": 0.12,
                      }}
                    />
                    <Layer
                      id="radius-outline"
                      type="line"
                      paint={{
                        "line-color": "#7c3aed",
                        "line-width": 2,
                      }}
                    />
                  </Source>
                )}

                {/* User pulsing double-ring marker */}
                <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex h-6 w-6 rounded-full border-2 border-white bg-blue-500 shadow-md"></span>
                  </div>
                </Marker>
              </>
            )}

            {/* Heatmap Layer */}
            {showHeatmap && (
              <Source id="heatmap-source" type="geojson" data={heatmapGeoJSON}>
                <Layer
                  id="heatmap-layer"
                  type="heatmap"
                  paint={{
                    "heatmap-weight": ["get", "intensity"],
                    "heatmap-intensity": 0.7,
                    "heatmap-radius": 25,
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
                  }}
                />
              </Source>
            )}

            {/* Mapped Complaints Markers */}
            {complaints.map((complaint) => {
              const distanceLabel = userLocation
                ? formatDistance(calculateDistanceMeters(userLocation, { lat: complaint.lat, lng: complaint.lng }))
                : "-";

              const isSelected = selectedId === complaint.id;
              const sev = getSeverityConfig(complaint.effective_severity || complaint.severity);
              const photo = complaint.photo_urls?.[0];
              const size = isSelected ? 52 : 42;

              return (
                <Marker
                  key={complaint.id}
                  longitude={complaint.lng}
                  latitude={complaint.lat}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    onMarkerClick(complaint);
                  }}
                >
                  <div className="group relative inline-block cursor-pointer">
                    <div
                      className={`overflow-hidden rounded-full border-2 bg-white shadow-md transition-all duration-200 hover:scale-105`}
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        borderColor: isSelected ? "#3b82f6" : sev.color,
                      }}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt="Ticket"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="h-full w-full items-center justify-center"
                        style={{
                          display: photo ? "none" : "flex",
                          backgroundColor: `${sev.color}15`,
                        }}
                      >
                        <span style={{ fontSize: `${size * 0.38}px` }}>📍</span>
                      </div>
                    </div>
                    {/* Hover tooltip for distance */}
                    <div
                      className="pointer-events-none absolute top-1/2 z-[9999] whitespace-nowrap rounded-lg border-l-[3px] bg-black/85 px-2 py-1.5 text-[11px] font-bold text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-zinc-950/90"
                      style={{
                        left: `${size + 6}px`,
                        transform: "translateY(-50%)",
                        borderLeftColor: sev.color,
                      }}
                    >
                      {distanceLabel}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </Map>
        )}

        {!collapsed && (
          <>
            {/* Top left: Heatmap button */}
            <button
              onClick={() => setShowHeatmap((v) => !v)}
              className={`absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-lg transition-all ${
                showHeatmap
                  ? "border-orange-600 bg-orange-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-[#2a2a2a]"
              }`}
              title="Toggle heatmap overlay"
            >
              <Flame size={12} />
              {showHeatmap ? "Heatmap On" : "Heatmap"}
            </button>

            {/* Bottom left: Radius slider */}
            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur dark:border-[#2a2a2a] dark:bg-[#1e1e1e]/95">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Radius</span>
              <input
                type="range"
                min={500}
                max={2000}
                step={500}
                value={radiusMeters}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="h-1 w-20 cursor-pointer accent-violet-600"
                aria-label="Nearby ticket radius"
              />
              <span className="w-10 text-right text-[11px] font-bold text-violet-700 dark:text-violet-300">
                {formatDistance(radiusMeters)}
              </span>
            </div>

            {/* Bottom right: Recenter button */}
            <button
              onClick={handleRecenter}
              className="absolute bottom-3 right-3 z-[1000] inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg transition-colors hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-[#2a2a2a]"
              title="Center on my current location"
              aria-label="Center on my current location"
            >
              <LocateFixed size={16} />
            </button>
          </>
        )}
      </div>

      {!hideCollapse && (
        <div className="group relative flex h-7 shrink-0 select-none items-center justify-center border-y border-gray-200 bg-gray-100 dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
          <button
            onClick={toggleCollapsed}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[10px] font-semibold text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            {collapsed ? (
              <>
                <ChevronDown size={13} /> Map
              </>
            ) : (
              <>
                <ChevronUp size={13} /> Hide
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
