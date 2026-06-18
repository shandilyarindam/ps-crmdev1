"use client";

import React, { useRef } from "react";
import {
  ClipboardList,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Smile,
  Video,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { KPICardData } from "./cm-types";

// Register useGSAP hook
gsap.registerPlugin(useGSAP);

export interface KPIStatsRowProps {
  kpis: KPICardData[];
  onCardClick?: (kpiId: string) => void;
}

const iconMap: Record<string, LucideIcon> = {
  active: ClipboardList,
  critical: AlertTriangle,
  sla: Clock3,
  resolved: CheckCircle2,
  satisfaction: Smile,
  cctv: Video,
};

const colorClasses: Record<KPICardData["color"], { bg: string; text: string; stroke: string }> = {
  emerald: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/15",
    text: "text-emerald-700 dark:text-emerald-300",
    stroke: "stroke-emerald-600 dark:stroke-emerald-400",
  },
  red: {
    bg: "bg-rose-50/70 dark:bg-rose-950/15",
    text: "text-rose-700 dark:text-rose-300",
    stroke: "stroke-rose-600 dark:stroke-rose-400",
  },
  amber: {
    bg: "bg-amber-50/70 dark:bg-amber-950/15",
    text: "text-amber-700 dark:text-amber-300",
    stroke: "stroke-amber-600 dark:stroke-amber-400",
  },
  teal: {
    bg: "bg-teal-50/70 dark:bg-teal-950/15",
    text: "text-teal-700 dark:text-teal-300",
    stroke: "stroke-teal-600 dark:stroke-teal-400",
  },
  blue: {
    bg: "bg-blue-50/70 dark:bg-blue-950/15",
    text: "text-blue-700 dark:text-blue-300",
    stroke: "stroke-blue-600 dark:stroke-blue-400",
  },
};

export const KPIStatsRow: React.FC<KPIStatsRowProps> = ({ kpis, onCardClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Entry Animation: Cards fade & slide up
      gsap.fromTo(
        ".kpi-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        }
      );

      // Count Up Animation for the number displays
      const countElements = document.querySelectorAll(".kpi-count-up");
      countElements.forEach((el) => {
        const targetVal = parseFloat(el.getAttribute("data-target") || "0");
        const suffix = el.getAttribute("data-suffix") || "";
        const obj = { val: 0 };
        gsap.to(obj, {
          val: targetVal,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            el.innerHTML = Math.floor(obj.val).toLocaleString() + suffix;
          },
        });
      });
    },
    { dependencies: [kpis], scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 shrink-0 select-none"
    >
      {kpis.map((kpi) => {
        const IconComponent = iconMap[kpi.id] || ClipboardList;
        const color = colorClasses[kpi.color] || colorClasses.emerald;
        const isPercent = kpi.id === "satisfaction";

        return (
          <div
            key={kpi.id}
            onClick={() => onCardClick?.(kpi.id)}
            className="kpi-card opacity-0 relative overflow-hidden rounded-xl border border-theme-border bg-theme-card p-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color.bg} ${color.text}`}>
                <IconComponent size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                  {kpi.label}
                </p>
                <h2
                  className={`text-2xl font-black mt-0.5 leading-none text-theme-text ${
                    kpi.animatePulse ? "animate-pulse" : ""
                  }`}
                >
                  <span
                    className="kpi-count-up"
                    data-target={kpi.value}
                    data-suffix={isPercent ? "%" : ""}
                  >
                    0{isPercent ? "%" : ""}
                  </span>
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5">
              <span
                className={`flex items-center gap-0.5 text-xs font-bold ${
                  kpi.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {kpi.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </span>
              <span className="text-[10px] font-medium text-theme-muted">
                {kpi.comparison}
              </span>
            </div>
            <div className="mt-2.5 h-6 w-full opacity-60">
              <svg
                className={`w-full h-full ${color.stroke} fill-none`}
                preserveAspectRatio="none"
                strokeWidth="2"
                viewBox="0 0 100 20"
              >
                <path d={kpi.sparklinePoints}></path>
              </svg>
            </div>
          </div>
        );
      })}
    </section>
  );
};
