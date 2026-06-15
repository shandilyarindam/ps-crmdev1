"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trash2, UserCheck, Droplet, Zap, type LucideIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WorkforceTeam, WorkforceStatusData } from "./cm-types";

gsap.registerPlugin(useGSAP);

export interface WorkforceStatusCardProps {
  teams?: WorkforceTeam[];
  chartData?: WorkforceStatusData[];
  activePercentage?: string;
}

const iconMap: Record<WorkforceTeam["iconName"], LucideIcon> = {
  trash: Trash2,
  check: UserCheck,
  droplet: Droplet,
  zap: Zap,
};

const defaultTeams: WorkforceTeam[] = [
  { title: "Sanitation Workers", count: 82, iconName: "trash" },
  { title: "Field Inspectors", count: 11, iconName: "check" },
  { title: "Water Teams", count: 5, iconName: "droplet" },
  { title: "Electric Teams", count: 4, iconName: "zap" },
];

const defaultChartData: WorkforceStatusData[] = [
  { name: "Active", value: 73, color: "#10b981" },
  { name: "Busy", value: 18, color: "#fbbf24" },
  { name: "Offline", value: 11, color: "#94a3b8" },
];

export const WorkforceStatusCard: React.FC<WorkforceStatusCardProps> = ({
  teams = defaultTeams,
  chartData = defaultChartData,
  activePercentage = "71%",
}) => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(
    () => {
      // Entry slide transition
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
      );

      // Donut scale pop
      gsap.fromTo(
        ".donut-container",
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, delay: 0.2, ease: "back.out(1.7)" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="opacity-0 bg-white rounded-xl border border-slate-200 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-60 min-h-0 select-none"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase mb-2 shrink-0">
        WORKFORCE STATUS
      </h3>

      <div className="flex-1 flex gap-3 items-center min-h-0">
        <div className="flex-1 space-y-2.5">
          {teams.map((team, idx) => {
            const IconComponent = iconMap[team.iconName];

            return (
              <div
                key={idx}
                className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-300"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {IconComponent && <IconComponent size={12} className="text-emerald-500 shrink-0" />}
                  <span className="truncate text-[11px]">{team.title}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white pl-2">
                  {team.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pie Chart / Donut */}
        <div className="donut-container opacity-0 h-28 w-28 shrink-0 relative flex items-center justify-center">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={44}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-[14px] font-black leading-none text-slate-800 dark:text-white">
              {activePercentage}
            </span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-sans">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex justify-between text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-2 dark:border-zinc-800 shrink-0">
        {chartData.map((data, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: data.color }}></span>
            <span>
              {data.name} {data.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
