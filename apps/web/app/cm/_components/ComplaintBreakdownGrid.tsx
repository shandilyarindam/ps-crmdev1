"use client";

import React, { useRef } from "react";
import { Trash2, Droplet, Route, Lightbulb, Flame, List, type LucideIcon } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ComplaintCategory } from "./cm-types";

gsap.registerPlugin(useGSAP);

export interface ComplaintBreakdownGridProps {
  categories?: ComplaintCategory[];
}

const iconMap: Record<ComplaintCategory["iconName"], LucideIcon> = {
  garbage: Trash2,
  water: Droplet,
  roads: Route,
  streetlights: Lightbulb,
  sewage: Flame,
  others: List,
};

const defaultCategories: ComplaintCategory[] = [
  { name: "Garbage", count: 56, iconName: "garbage", colorClass: "text-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/15 dark:text-emerald-300" },
  { name: "Water", count: 32, iconName: "water", colorClass: "text-blue-700 bg-blue-50/70 dark:bg-blue-950/15 dark:text-blue-300" },
  { name: "Roads", count: 18, iconName: "roads", colorClass: "text-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/15 dark:text-indigo-300" },
  { name: "Streetlights", count: 14, iconName: "streetlights", colorClass: "text-amber-700 bg-amber-50/70 dark:bg-amber-950/15 dark:text-amber-300" },
  { name: "Sewage", count: 12, iconName: "sewage", colorClass: "text-orange-700 bg-orange-50/70 dark:bg-orange-950/15 dark:text-orange-300" },
  { name: "Others", count: 10, iconName: "others", colorClass: "text-theme-muted bg-theme-bg/40" },
];

export const ComplaintBreakdownGrid: React.FC<ComplaintBreakdownGridProps> = ({
  categories = defaultCategories,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Entry scale stagger
      gsap.fromTo(
        ".category-item",
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: "back.out(1.5)" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex flex-col h-60 min-h-0 select-none transition-colors duration-300"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-3 shrink-0">
        COMPLAINT BREAKDOWN
      </h3>

      <div className="grid grid-cols-3 gap-2 flex-1">
        {categories.map((cat, idx) => {
          const IconComponent = iconMap[cat.iconName] || List;

          return (
            <div
              key={idx}
              className="category-item opacity-0 flex flex-col justify-between p-2.5 rounded-lg border border-theme-border/40 hover:border-theme-border bg-theme-bg/30 hover:bg-theme-bg/60 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${cat.colorClass}`}>
                  <IconComponent size={14} />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-[9px] font-bold text-theme-muted uppercase leading-none">
                  {cat.name}
                </p>
                <h4 className="text-base font-black text-theme-text mt-1 leading-none">
                  {cat.count}
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
