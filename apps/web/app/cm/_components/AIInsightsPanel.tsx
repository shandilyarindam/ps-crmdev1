"use client";

import React, { useRef } from "react";
import { Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AIInsightItem } from "./cm-types";

gsap.registerPlugin(useGSAP);

export interface AIInsightsPanelProps {
  insights: AIInsightItem[];
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Slide up/fade in each insight list item
      gsap.fromTo(
        ".insight-item",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex-1 flex flex-col min-h-0 select-none"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase mb-3 flex items-center gap-2 shrink-0">
        <Sparkles size={12} className="text-emerald-500 animate-pulse" /> AI INSIGHTS
      </h3>
      <div className="flex-1 overflow-y-auto pr-1">
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li
              key={idx}
              className="insight-item opacity-0 flex gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/40 text-[11px] leading-relaxed font-medium transition-all hover:bg-slate-100/60 dark:hover:bg-zinc-800/70"
            >
              <span
                className={`h-2 w-2 rounded-full mt-1 shrink-0 ${
                  insight.type === "critical"
                    ? "bg-red-500 animate-ping"
                    : insight.type === "warning"
                    ? "bg-amber-400"
                    : "bg-emerald-500"
                }`}
              ></span>
              <div>
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider block mb-0.5 ${
                    insight.type === "critical"
                      ? "text-red-500"
                      : insight.type === "warning"
                      ? "text-amber-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {insight.badge}
                </span>
                <p className="text-slate-600 dark:text-zinc-300">{insight.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
