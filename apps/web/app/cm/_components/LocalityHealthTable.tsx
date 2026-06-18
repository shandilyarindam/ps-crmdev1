"use client";

import React, { useRef } from "react";
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
      <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-2 shrink-0">
        {title}
      </h3>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-theme-muted border-b border-theme-border">
              <th className="pb-1.5 font-bold">{rowLabel}</th>
              <th className="pb-1.5 font-bold text-center">Complaints</th>
              <th className="pb-1.5 font-bold text-right">Severity</th>
            </tr>
          </thead>
          <tbody className="text-theme-text font-semibold divide-y divide-theme-border">
            {localities.map((loc, idx) => (
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
