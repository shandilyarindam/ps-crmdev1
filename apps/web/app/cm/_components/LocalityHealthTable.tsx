"use client";

import React, { useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LocalityHealth } from "./cm-types";

gsap.registerPlugin(useGSAP);

import { cn } from "@/src/lib/utils";

export interface LocalityHealthTableProps {
  localities: LocalityHealth[];
  onViewAnalyticsClick?: () => void;
  className?: string;
  /** Card header label. Defaults to "LOCALITY HEALTH OVERVIEW". */
  title?: string;
  /** Header for the first column. Defaults to "Locality". */
  rowLabel?: string;
  /** Link text for the footer action. Defaults to "View Locality Analytics". */
  actionLabel?: string;
}

export const LocalityHealthTable: React.FC<LocalityHealthTableProps> = ({
  localities,
  onViewAnalyticsClick,
  className,
  title = "LOCALITY HEALTH OVERVIEW",
  rowLabel = "Locality",
  actionLabel = "View Locality Analytics",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  const filteredLocalities = useMemo(() => {
    if (!search) return localities;
    return localities.filter(loc => loc.name.toLowerCase().includes(search.toLowerCase()));
  }, [localities, search]);

  useGSAP(
    () => {
      // Row entry transition
      gsap.fromTo(
        ".locality-row",
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power1.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn("bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex flex-col h-60 min-h-0 select-none transition-colors duration-300", className)}
    >
      <div className="flex items-center justify-between mb-2 shrink-0 gap-3">
        <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase">
          {title}
        </h3>
        <input 
          type="text" 
          placeholder={`Search ${rowLabel}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-theme-bg/50 border border-theme-border rounded-md px-2.5 py-1 text-[11px] text-theme-text placeholder-theme-muted focus:outline-none focus:border-theme-accent w-28 md:w-36 transition-colors shadow-inner"
        />
      </div>
      <div className="flex-1 overflow-y-auto relative min-h-0 pr-1 custom-scrollbar">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-theme-card z-10 shadow-[0_1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            <tr className="text-theme-muted">
              <th className="pb-1.5 font-bold pt-1">{rowLabel}</th>
              <th className="pb-1.5 font-bold text-center pt-1">Complaints</th>
              <th className="pb-1.5 font-bold text-right pt-1">Severity</th>
            </tr>
          </thead>
          <tbody className="text-theme-text font-semibold divide-y divide-theme-border">
            {filteredLocalities.map((loc, idx) => (
              <tr
                key={idx}
                className="locality-row opacity-0 hover:bg-theme-bg/40 transition-colors"
              >
                <td className="py-2.5 font-bold">{loc.name}</td>
                <td className="py-2.5 text-center font-bold text-theme-text">
                  {loc.count}
                </td>
                <td className="py-2.5 text-right flex items-center justify-end gap-1.5 font-bold">
                  <span className={`h-1.5 w-1.5 rounded-full ${loc.color}`}></span>
                  <span>{loc.sev}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onViewAnalyticsClick && (
        <div className="mt-2 text-center border-t border-theme-border pt-2 shrink-0">
          <a
            className="text-[10px] font-bold text-theme-accent hover:opacity-85 transition-opacity"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onViewAnalyticsClick();
            }}
          >
            {actionLabel}
          </a>
        </div>
      )}
    </div>
  );
};
