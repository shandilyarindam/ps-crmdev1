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
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-zinc-950">
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
      <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 via-transparent to-slate-100/50 dark:from-zinc-900/50 dark:to-zinc-900/50 pointer-events-none" />
      
      {/* Floating loading card with premium styling */}
      <div className="relative z-10 flex flex-col items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white/85 p-6 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/85 animate-pulse max-w-xs text-center">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
          <div className="absolute inset-0 animate-ping rounded-lg bg-emerald-500/20" />
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">COMMAND MAP</h4>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">Acquiring secure satellite link & telemetry...</p>
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
      className={cn("opacity-0 flex-1 min-h-[350px] md:min-h-[450px] bg-white rounded-xl border border-slate-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 relative overflow-hidden flex flex-col", className)}
    >
      {/* Map Header */}
      <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-10 sticky top-0">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white leading-tight">
              {wardTitle}
            </h2>
            <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
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
            className="pl-8 pr-4 py-1 border border-slate-200 rounded-md text-xs w-full sm:w-48 bg-slate-50 focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all dark:border-zinc-800 dark:bg-zinc-800 dark:focus:bg-zinc-900"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 animate-pulse"
            >
              <span>{drillButtonLabel}</span>
              <ArrowRight size={13} />
            </button>
          )}
          <button
            onClick={onShowIncidentsClick}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-md transition-all active:scale-95"
          >
            <List size={12} />
            <span>Show Incidents</span>
          </button>
        </div>
      </div>
    </div>
  );
};
