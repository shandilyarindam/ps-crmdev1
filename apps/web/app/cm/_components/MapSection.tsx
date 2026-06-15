"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { Search, List } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-[#1a1a1a] dark:text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <span>Initializing Command Map...</span>
      </div>
    </div>
  ),
});

import { cn } from "@/src/lib/utils";

export interface MapSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onShowIncidentsClick?: () => void;
  wardTitle?: string;
  wardSubtitle?: string;
  className?: string;
}

export const MapSection: React.FC<MapSectionProps> = ({
  searchQuery,
  onSearchChange,
  onShowIncidentsClick,
  wardTitle = "Ward 11 - Najafgarh (Delhi)",
  wardSubtitle = "South West Zone  |  Population: 2.13 Lakh  |  Households: 38,542",
  className,
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
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white leading-tight">
            {wardTitle}
          </h2>
          <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
            {wardSubtitle}
          </p>
        </div>
        <div className="relative w-full sm:w-auto shrink-0">
          <input
            type="text"
            placeholder="Search location in Ward..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-4 py-1 border border-slate-200 rounded-md text-xs w-full sm:w-48 bg-slate-50 focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all dark:border-zinc-800 dark:bg-zinc-800 dark:focus:bg-zinc-900"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Leaflet Map Component Container */}
      <div className="flex-1 w-full relative z-0">
        <MapComponent />
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5 shadow-sm">
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
