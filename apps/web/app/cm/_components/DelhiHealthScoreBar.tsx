"use client";

import React, { useRef } from "react";
import { HeartPulse, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ZoneScore } from "./cm-types";

gsap.registerPlugin(useGSAP);

import { cn } from "@/src/lib/utils";

export interface DelhiHealthScoreBarProps {
  overall: number;
  trend: string;
  zones: ZoneScore[];
  className?: string;
  isLoading?: boolean;
}

export const DelhiHealthScoreBar: React.FC<DelhiHealthScoreBarProps> = ({
  overall,
  trend,
  zones,
  className,
  isLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Mount animation for logo and title header
  useGSAP(
    () => {
      gsap.fromTo(
        ".overall-header",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  // 2. Load animation for numbers and per-zone cards
  useGSAP(
    () => {
      if (isLoading) return;

      const tl = gsap.timeline();
      tl.fromTo(
        ".overall-numbers",
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      ).fromTo(
        ".zone-score",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: "power1.out" },
        "-=0.2"
      );
    },
    { dependencies: [isLoading, zones], scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4 select-none transition-colors duration-300",
        className
      )}
    >
      {/* Overall score */}
      <div className="group relative flex items-center gap-3 shrink-0 lg:border-r lg:border-theme-border lg:pr-5 cursor-help">
        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-2 w-64 p-2.5 rounded-lg bg-theme-accent text-[11px] text-white font-medium shadow-lg border border-theme-border backdrop-blur-sm z-[9999] opacity-0 pointer-events-none transition-all duration-200 ease-out translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-hover:delay-700">
          Calculated live based on complaint resolution rate (40%) and SLA compliance (60%) across Delhi.
        </div>

        <div className="overall-header opacity-0 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-bg text-theme-accent transition-colors duration-300">
            <HeartPulse size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
              Delhi Health Score
            </p>
            
            {/* Live Numbers (hidden during loading) */}
            {!isLoading && (
              <div className="overall-numbers opacity-0 flex items-end gap-1.5 mt-0.5">
                <span className="text-2xl font-black leading-none text-theme-text transition-colors duration-300">
                  {overall}
                </span>
                <span className="text-[10px] font-medium text-theme-muted">/100</span>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight size={12} /> {trend}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-zone scores */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-3 flex-1 min-h-[36px]">
        {!isLoading && zones.map((zone) => (
          <div key={zone.name} className="zone-score opacity-0 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-theme-muted truncate leading-tight">
              {zone.name}
            </p>
            <p className="text-base font-black text-theme-text transition-colors duration-300 mt-0.5 leading-none">
              {zone.score}
            </p>
            <span className={`mt-1 inline-block h-1.5 w-1.5 rounded-full ${zone.dotColor}`}></span>
          </div>
        ))}
      </div>
    </div>
  );
};
