"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { Search, List, ArrowLeft, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-theme-bg">
      {/* Premium Map Grid Skeleton Background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />
      {/* Radial fade for map focus effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-theme-bg/50 via-transparent to-theme-bg/50 pointer-events-none" />
      
      {/* Floating loading card with premium styling */}
      <div className="relative z-10 flex flex-col items-center gap-3.5 rounded-xl border border-theme-border bg-theme-card/85 p-6 shadow-xl backdrop-blur-md animate-pulse max-w-xs text-center">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-theme-bg text-theme-accent">
          <div className="absolute inset-0 animate-ping rounded-lg bg-theme-accent/20" />
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-theme-accent border-t-transparent" />
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-wider text-theme-text uppercase">COMMAND MAP</h4>
          <p className="text-[10px] text-theme-muted font-semibold mt-1">Acquiring secure satellite link & telemetry...</p>
        </div>
      </div>
    </div>
  ),
});

import { cn } from "@/src/lib/utils";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { MapLayersPanel } from "./MapLayersPanel";

type RegionFeature = Feature<Polygon | MultiPolygon>;

export interface MapSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onShowIncidentsClick?: () => void;
  wardTitle?: string;
  wardSubtitle?: string;
  searchPlaceholder?: string;
  /** When set, renders a back arrow before the title (drill-up). */
  onBack?: () => void;
  /** When set, renders a primary "drill-down" button over the map. */
  drillButtonLabel?: string;
  onDrill?: () => void;
  /** Geographic region overlay (zones at Delhi level, wards at zone/ward level). */
  regions?: RegionFeature[];
  regionCounts?: Record<string, number>;
  onRegionClick?: (regionId: string) => void;
  fitToRegionId?: string;
  choropleth?: boolean;
  /** Show the complaint marker/heatmap layer (ward level). Default true. */
  showComplaints?: boolean;
  className?: string;

  // Integrated map layers panel props
  activeLayer?: string;
  onLayerChange?: (layerId: string) => void;
  intensity?: number;
  onIntensityChange?: (intensity: number) => void;
  activeSeverities?: string[];
  onToggleSeverity?: (severity: string) => void;
}

export const MapSection: React.FC<MapSectionProps> = ({
  searchQuery,
  onSearchChange,
  onShowIncidentsClick,
  wardTitle = "Ward 11 - Najafgarh (Delhi)",
  wardSubtitle = "South West Zone  |  Population: 2.13 Lakh  |  Households: 38,542",
  searchPlaceholder = "Search location in Ward...",
  onBack,
  drillButtonLabel,
  onDrill,
  regions,
  regionCounts,
  onRegionClick,
  fitToRegionId,
  choropleth,
  showComplaints,
  className,
  activeLayer,
  onLayerChange,
  intensity,
  onIntensityChange,
  activeSeverities,
  onToggleSeverity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.98, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn("opacity-0 flex-1 min-h-[350px] md:min-h-[450px] bg-theme-card rounded-xl border border-theme-border shadow-sm relative overflow-hidden flex flex-col transition-colors duration-300", className)}
    >
      {/* Map Header */}
      <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-theme-border bg-theme-card/95 backdrop-blur-sm z-10 sticky top-0 transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/85 transition-all duration-300"
            >
               <ArrowLeft size={15} />
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-theme-text leading-tight">
              {wardTitle}
            </h2>
            <p className="text-[10px] font-medium text-theme-muted mt-0.5">
              {wardSubtitle}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-auto shrink-0">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim() !== "" && regions && regions.length > 0 && onRegionClick) {
                onRegionClick(String(regions[0].id));
              }
            }}
            className="pl-8 pr-4 py-1 border border-theme-border rounded-md text-xs w-full sm:w-48 bg-theme-bg focus:ring-1 focus:ring-theme-accent focus:bg-theme-card text-theme-text transition-all"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
        </div>
      </div>

      {/* Leaflet Map Component Container */}
      <div className="flex-1 w-full relative z-0">
        <MapComponent
          regions={regions}
          regionCounts={regionCounts}
          onRegionClick={onRegionClick}
          fitToRegionId={fitToRegionId}
          choropleth={choropleth}
          showComplaints={showComplaints}
          activeLayer={activeLayer}
          intensity={intensity}
          showRecenterButton={true}
        />

        {activeLayer !== undefined && onLayerChange && intensity !== undefined && onIntensityChange && (
          <div className="absolute left-4 top-4 z-[1000] pointer-events-none hidden lg:flex">
            <MapLayersPanel
              activeLayer={activeLayer}
              onLayerChange={onLayerChange}
              intensity={intensity}
              onIntensityChange={onIntensityChange}
              variant="floating"
              activeSeverities={activeSeverities}
              onToggleSeverity={onToggleSeverity}
            />
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-1.5 shadow-sm">
          {drillButtonLabel && onDrill && (
            <button
              onClick={onDrill}
              className="flex items-center gap-1.5 bg-theme-accent hover:opacity-90 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 animate-pulse"
            >
              <span>{drillButtonLabel}</span>
              <ArrowRight size={13} />
            </button>
          )}
          <button
            onClick={onShowIncidentsClick}
            className="flex items-center gap-1 bg-theme-bg hover:bg-theme-bg/80 text-theme-text px-2.5 py-1.5 rounded-lg border border-theme-border text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <List size={12} />
            <span>Show Incidents</span>
          </button>
        </div>
      </div>
    </div>
  );
};
