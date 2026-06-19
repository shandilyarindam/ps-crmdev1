"use client";

import React, { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WardMetric } from "./cm-types";
import { Skeleton } from "@/components/ui/skeleton";

gsap.registerPlugin(useGSAP);

export interface WardPerformanceGridProps {
  metrics?: WardMetric[];
  loading?: boolean;
}

const defaultMetrics: WardMetric[] = [
  { label: "Resolved Month", value: "1,248", change: "+15.6% vs LM", isPositive: true },
  { label: "Grievance Growth", value: "+12%", change: "vs last month", isPositive: false },
  { label: "Ward Ranking", value: "8 / 250", change: "among all wards" },
  { label: "SLA Compliance", value: "78%", change: "+5.0% vs LM", isPositive: true },
];

export const WardPerformanceGrid: React.FC<WardPerformanceGridProps> = ({
  metrics = defaultMetrics,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!loading) {
        // Entry slide transition
        gsap.fromTo(
          ".metric-box",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power1.out" }
        );
      }
    },
    { dependencies: [loading], scope: containerRef }
  );

  if (loading) {
    return (
      <div
        className="bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex flex-col justify-between h-60 min-h-0 select-none transition-colors duration-300"
      >
        <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-2">
          WARD PERFORMANCE
        </h3>

        <div className="grid grid-cols-2 gap-3 flex-1 mt-2">
          {[0, 1, 2, 3].map((i) => {
            const borderClasses = `
              ${i === 0 ? "border-r border-b border-theme-border pb-2 pr-2" : ""}
              ${i === 1 ? "border-b border-theme-border pb-2 pl-2" : ""}
              ${i === 2 ? "border-r border-theme-border pt-2 pr-2" : ""}
              ${i === 3 ? "pt-2 pl-2" : ""}
            `;
            return (
              <div key={i} className={`flex flex-col justify-center ${borderClasses} space-y-1.5`}>
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-4.5 w-12" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex flex-col justify-between h-60 min-h-0 select-none transition-colors duration-300"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-2">
        WARD PERFORMANCE
      </h3>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {metrics.map((metric, idx) => {
          // Determine borders based on index
          const borderClasses = `
            ${idx === 0 ? "border-r border-b border-theme-border pb-2 pr-2" : ""}
            ${idx === 1 ? "border-b border-theme-border pb-2 pl-2" : ""}
            ${idx === 2 ? "border-r border-theme-border pt-2 pr-2" : ""}
            ${idx === 3 ? "pt-2 pl-2" : ""}
          `;

          return (
            <div
              key={idx}
              className={`metric-box opacity-0 flex flex-col justify-center ${borderClasses}`}
            >
              <p className="text-[9px] font-bold text-theme-muted uppercase leading-tight">
                {metric.label}
              </p>
              <h4
                className={`text-base font-black mt-1 leading-none ${
                  metric.label.toLowerCase().includes("growth")
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-theme-text"
                }`}
              >
                {metric.value}
              </h4>
              {metric.change && (
                <span
                  className={`text-[8px] font-bold mt-1.5 flex items-center gap-0.5 ${
                    metric.isPositive === undefined
                      ? "text-theme-muted font-medium"
                      : metric.isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-theme-muted font-medium"
                  }`}
                >
                  {metric.isPositive && <ArrowUpRight size={10} />}
                  {metric.change}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
