"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export interface PredictiveDataPoint {
  name: string;
  value: number;
}

export interface PredictiveOutlookCardProps {
  data: PredictiveDataPoint[];
  expectedGrowth: string;
  estimatedSlaMisses: number;
  highRiskHotspots: string[];
  isDark?: boolean;
}

export const PredictiveOutlookCard: React.FC<PredictiveOutlookCardProps> = ({
  data,
  expectedGrowth,
  estimatedSlaMisses,
  highRiskHotspots,
  isDark = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(
    () => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="opacity-0 bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex flex-col h-60 min-h-0 select-none transition-colors duration-300"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-2">
        PREDICTIVE OUTLOOK <span className="font-semibold normal-case">(Next 48 Hours)</span>
      </h3>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-theme-muted uppercase leading-none">
              Expected Growth
            </p>
            <h4 className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              {expectedGrowth} <TrendingUp size={16} />
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-theme-muted uppercase leading-none">
              Est. SLA Misses
            </p>
            <h4 className="text-lg font-black text-theme-text mt-1">
              {estimatedSlaMisses}
            </h4>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-20 w-full mt-2">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="predictionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c85a53" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c85a53" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <RechartsTooltip
                  contentStyle={{
                    background: isDark ? "#181310" : "#e9ddce",
                    border: "1px solid rgba(181, 168, 150, 0.4)",
                    borderRadius: "8px",
                    fontSize: "10px",
                    color: isDark ? "#e8e2d6" : "#4a3c31",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#c85a53"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#predictionGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-theme-border">
          <p className="text-[9px] font-bold text-theme-muted uppercase leading-none mb-1">
            High Risk Hotspots
          </p>
          <div className="flex flex-wrap gap-1.5">
            {highRiskHotspots.map((tag, idx) => (
              <span
                key={idx}
                className="bg-rose-500/10 text-rose-700 text-[8px] font-black rounded px-1.5 py-0.5 dark:text-rose-300 uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
