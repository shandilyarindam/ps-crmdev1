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
  { name: "Garbage", count: 56, iconName: "garbage", colorClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400" },
  { name: "Water", count: 32, iconName: "water", colorClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400" },
  { name: "Roads", count: 18, iconName: "roads", colorClass: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400" },
  { name: "Streetlights", count: 14, iconName: "streetlights", colorClass: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400" },
  { name: "Sewage", count: 12, iconName: "sewage", colorClass: "text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400" },
  { name: "Others", count: 10, iconName: "others", colorClass: "text-slate-600 bg-slate-50 dark:bg-zinc-800/40 dark:text-slate-400" },
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
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-60 min-h-0 select-none"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase mb-3 shrink-0">
        COMPLAINT BREAKDOWN
      </h3>

      <div className="grid grid-cols-3 gap-2 flex-1">
        {categories.map((cat, idx) => {
          const IconComponent = iconMap[cat.iconName] || List;

          return (
            <div
              key={idx}
              className="category-item opacity-0 flex flex-col justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-zinc-800/50 dark:hover:border-zinc-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-900/30 dark:hover:bg-zinc-800/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${cat.colorClass}`}>
                  <IconComponent size={14} />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase leading-none">
                  {cat.name}
                </p>
                <h4 className="text-base font-black text-slate-800 dark:text-white mt-1 leading-none">
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
