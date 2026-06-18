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
      className="bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex-1 flex flex-col min-h-0 select-none transition-colors duration-300"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-3 flex items-center gap-2 shrink-0">
        <Sparkles size={12} className="text-theme-accent animate-pulse" /> AI INSIGHTS
      </h3>
      <div className="flex-1 overflow-y-auto pr-1">
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li
              key={idx}
              className="insight-item opacity-0 flex gap-2 p-2 rounded-lg bg-theme-bg/30 text-[11px] leading-relaxed font-medium transition-all hover:bg-theme-bg/60"
            >
              <span
                className={`h-2 w-2 rounded-full mt-1 shrink-0 ${
                  insight.type === "critical"
                    ? "bg-theme-critical animate-ping"
                    : insight.type === "warning"
                    ? "bg-theme-warning"
                    : "bg-theme-success"
                }`}
              ></span>
              <div>
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider block mb-0.5 ${
                    insight.type === "critical"
                      ? "text-theme-critical"
                      : insight.type === "warning"
                      ? "text-theme-warning"
                      : "text-theme-success"
                  }`}
                >
                  {insight.badge}
                </span>
                <p className="text-theme-text">{insight.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
