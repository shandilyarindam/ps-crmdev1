"use client";

import React, { useRef } from "react";
import { Clock, Building2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Intervention, InterventionTab } from "./cm-types";

gsap.registerPlugin(useGSAP);

export interface ActiveInterventionsPanelProps {
  interventions: Intervention[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onReviewClick: (item: Intervention) => void;
  onViewAllClick?: () => void;
  /** Card header label. Defaults to "ACTIVE INTERVENTIONS". */
  title?: string;
  /** Configurable filter tabs. Defaults to severity tabs (All/Critical/High/Medium). */
  tabs?: InterventionTab[];
  /** Show a thumbnail image on each card when the intervention has an imageUrl. */
  showThumbnails?: boolean;
}

const severityColors: Record<Intervention["severity"], string> = {
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

const defaultTabs: InterventionTab[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical", match: (i) => i.severity === "critical" },
  { id: "high", label: "High", match: (i) => i.severity === "high" },
  { id: "medium", label: "Medium", match: (i) => i.severity === "medium" },
];

export const ActiveInterventionsPanel: React.FC<ActiveInterventionsPanelProps> = ({
  interventions,
  activeFilter,
  onFilterChange,
  onReviewClick,
  onViewAllClick,
  title = "ACTIVE INTERVENTIONS",
  tabs = defaultTabs,
  showThumbnails = false,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeFilter) ?? tabs[0];
  const visibleItems = interventions.filter((item) =>
    activeTab?.match ? activeTab.match(item) : true
  );

  // Trigger animations whenever interventions are updated or filtered
  useGSAP(
    () => {
      gsap.fromTo(
        ".intervention-item",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power1.out" }
      );
    },
    { dependencies: [interventions, activeFilter], scope: listRef }
  );

  return (
    <div
      ref={listRef}
      className="bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex-1 flex flex-col min-h-0 select-none transition-colors duration-300"
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase">
          {title}
        </h3>
        {onViewAllClick && (
          <a
            className="text-[10px] font-bold text-theme-accent hover:opacity-85 transition-opacity"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onViewAllClick();
            }}
          >
            View All
          </a>
        )}
      </div>

      {/* Sub-tabs for filtering */}
      <div className="flex flex-wrap gap-2 border-b border-theme-border pb-2 shrink-0">
        {tabs.map((tab) => {
          const count = tab.match
            ? interventions.filter(tab.match).length
            : interventions.length;

          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                activeFilter === tab.id
                  ? "bg-theme-accent text-white shadow-sm"
                  : "text-theme-muted hover:bg-theme-bg/50"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List of Interventions */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-2.5">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="intervention-item opacity-0 flex gap-3 p-3 rounded-lg bg-theme-bg/30 hover:bg-theme-bg/60 transition-all cursor-pointer border border-transparent hover:border-theme-border"
            onClick={() => onReviewClick(item)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase leading-none ${
                    severityColors[item.severity]
                  }`}
                >
                  {item.severity}
                </span>
                {item.escalated && (
                  <span className="text-[9px] font-bold text-rose-500">• Escalated</span>
                )}
                {item.status === "monitoring" && (
                  <span className="text-[9px] font-bold text-theme-muted">• Monitoring</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-theme-text mt-1 leading-tight">
                {item.title}
              </h4>
              <p className="text-[10px] text-theme-muted font-medium mt-0.5 truncate">
                {item.ward ? `${item.ward}` : item.locality}
                {item.zone ? ` • ${item.zone}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {item.departments.map((dept, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] text-theme-muted/80 flex items-center gap-0.5 font-bold"
                  >
                    <Building2 size={10} /> {dept}
                  </span>
                ))}
                <span className="text-[9px] font-bold text-theme-muted/80 flex items-center gap-0.5">
                  <Clock size={10} /> {item.time}
                </span>
              </div>
            </div>

            {showThumbnails && (
              <div className="flex flex-col items-end justify-between w-20 shrink-0 gap-1.5">
                <div className="h-12 w-20 overflow-hidden rounded-md bg-theme-bg">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <button
                  className="px-2 py-1 bg-theme-accent hover:opacity-90 text-white text-[9px] font-bold rounded shadow-sm w-full leading-none transition-all active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReviewClick(item);
                  }}
                >
                  Review
                </button>
              </div>
            )}

            {!showThumbnails && (
              <div className="text-right flex flex-col items-end justify-end w-16 shrink-0">
                <button
                  className="px-2 py-1 bg-theme-accent hover:opacity-90 text-white text-[9px] font-bold rounded shadow-sm w-full leading-none transition-all active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReviewClick(item);
                  }}
                >
                  Review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
