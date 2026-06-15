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
}

export const LocalityHealthTable: React.FC<LocalityHealthTableProps> = ({
  localities,
  onViewAnalyticsClick,
  className,
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
      className={cn("bg-white rounded-xl border border-slate-200 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-60 min-h-0 select-none", className)}
    >
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase mb-2 shrink-0">
        LOCALITY HEALTH OVERVIEW
      </h3>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 dark:border-zinc-800">
              <th className="pb-1.5 font-bold">Locality</th>
              <th className="pb-1.5 font-bold text-center">Complaints</th>
              <th className="pb-1.5 font-bold text-right">Severity</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-zinc-300 font-semibold divide-y divide-slate-50 dark:divide-zinc-800/30">
            {localities.map((loc, idx) => (
              <tr
                key={idx}
                className="locality-row opacity-0 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-2.5 font-bold">{loc.name}</td>
                <td className="py-2.5 text-center font-bold text-slate-800 dark:text-white">
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
        <div className="mt-2 text-center border-t border-slate-100 pt-2 dark:border-zinc-800 shrink-0">
          <a
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onViewAnalyticsClick();
            }}
          >
            View Locality Analytics
          </a>
        </div>
      )}
    </div>
  );
};
