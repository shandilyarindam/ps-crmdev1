"use client";

import React from "react";
import { Landmark, MapPin, ChevronDown, ChevronRight, Calendar, Clock } from "lucide-react";

export type ViewLevel = "delhi" | "zone" | "ward";

export interface CMHeaderProps {
  level: ViewLevel;
  zoneName?: string;
  wardName?: string;
  dateStr: string;
  timeStr: string;
  /** Navigate to a higher level via the breadcrumb. */
  onCrumb: (level: ViewLevel) => void;
}

export const CMHeader: React.FC<CMHeaderProps> = ({
  level,
  zoneName,
  wardName,
  dateStr,
  timeStr,
  onCrumb,
}) => {
  const crumb = (label: string, target: ViewLevel, active: boolean) =>
    active ? (
      <span className="text-theme-accent font-bold">{label}</span>
    ) : (
      <button
        onClick={() => onCrumb(target)}
        className="hover:text-theme-accent transition-colors"
      >
        {label}
      </button>
    );

  return (
    <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-theme-border bg-theme-card px-4 py-3 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-bg text-theme-text/80 transition-colors duration-300">
            <Landmark size={20} className="text-theme-accent" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight sm:text-lg">JanSamadhan</h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">CM Command Center</p>
          </div>
        </div>
        <div className="h-6 border-l border-theme-border"></div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCrumb("delhi")}
            className="flex items-center gap-2 rounded-md bg-theme-bg px-3 py-1.5 text-xs font-semibold text-theme-text hover:bg-theme-bg/80 transition-all duration-300"
          >
            <MapPin size={14} className="text-theme-accent" />
            <span>DELHI OVERVIEW</span>
            <ChevronDown size={12} className="text-theme-muted" />
          </button>
        </div>
      </div>

      <div className="hidden flex-1 justify-center md:flex">
        <nav aria-label="Breadcrumb" className="flex items-center text-xs font-semibold text-theme-muted">
          {crumb("Delhi", "delhi", level === "delhi")}
          {level !== "delhi" && (
            <>
              <ChevronRight size={10} className="mx-2 text-theme-muted" />
              {crumb(zoneName ? `${zoneName} Zone` : "Zone", "zone", level === "zone")}
            </>
          )}
          {level === "ward" && (
            <>
              <ChevronRight size={10} className="mx-2 text-theme-muted" />
              {crumb(wardName ?? "Ward", "ward", true)}
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold text-theme-text/80">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-theme-muted" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-theme-border pl-4">
          <Clock size={14} className="text-theme-muted" />
          <span className="tabular-nums">{timeStr}</span>
        </div>
        <div className="flex items-center gap-2 border-l border-theme-border pl-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-theme-accent text-[10px] font-bold text-white shadow-sm">
            CM
          </div>
          <span className="hidden sm:inline">CM Delhi</span>
        </div>
      </div>
    </header>
  );
};
