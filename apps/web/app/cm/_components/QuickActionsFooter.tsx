"use client";

import React, { useRef } from "react";
import {
  Phone,
  CalendarDays,
  UserCheck,
  UserPlus,
  FileText,
  Radio,
  Sliders,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { QuickAction } from "./cm-types";

gsap.registerPlugin(useGSAP);

import { cn } from "@/src/lib/utils";

export interface QuickActionsFooterProps {
  /** Configurable action buttons. When empty/omitted, only the ticker row renders (e.g. Delhi overview). */
  actions?: QuickAction[];
  onAction?: (id: string) => void;
  onFiltersClick: () => void;
  /** Marquee items. Falls back to a default ticker. */
  tickerItems?: React.ReactNode[];
  className?: string;
}

const actionIcons: Record<QuickAction["icon"], LucideIcon> = {
  phone: Phone,
  calendar: CalendarDays,
  escalate: UserCheck,
  deploy: UserPlus,
  report: FileText,
  workforce: UserPlus,
  review: ClipboardCheck,
};

const actionColors: Record<QuickAction["color"], string> = {
  emerald:
    "border-emerald-200/50 text-emerald-700 hover:bg-emerald-50/40 dark:border-emerald-900/40 dark:text-emerald-300",
  red:
    "border-rose-200/50 text-rose-700 hover:bg-rose-50/40 dark:border-rose-900/40 dark:text-rose-300",
  blue:
    "border-blue-200/50 text-blue-700 hover:bg-blue-50/40 dark:border-blue-900/40 dark:text-blue-300",
};

const iconColors: Record<QuickAction["color"], string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  red: "text-rose-600 dark:text-rose-400",
  blue: "text-blue-600 dark:text-blue-400",
};

const defaultTicker: React.ReactNode[] = [
  <span key="t1">
    • <strong className="text-theme-text">142</strong> new complaints reported across zone today
  </span>,
  <span key="t2">
    • <strong className="text-theme-text">Mobile Workforce:</strong> 1,254 Workers online • 71% active deployment
  </span>,
  <span key="t3">
    • <strong className="text-theme-text">Departments:</strong> 24 key municipal areas under active surveillance
  </span>,
  <span key="t4">
    • <strong className="text-theme-text">Avg Resolution:</strong> 4h 12m response time (<span className="text-emerald-600 dark:text-emerald-400">-11% today</span>)
  </span>,
  <span key="t5">
    • <strong className="text-theme-text">Queue backlog:</strong> reduced by 8.2% in last 24h
  </span>,
];

export const QuickActionsFooter: React.FC<QuickActionsFooterProps> = ({
  actions,
  onAction,
  onFiltersClick,
  tickerItems = defaultTicker,
  className,
}) => {
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        footerRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      className={cn("opacity-0 bg-theme-card border-t border-theme-border mt-auto sticky bottom-0 z-50 shrink-0 select-none transition-colors duration-300", className)}
    >
      {/* Quick Actions Panel — only when actions are provided */}
      {actions && actions.length > 0 && (
        <div className="px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-theme-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest leading-none">
              QUICK
              <br />
              ACTIONS
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = actionIcons[action.icon];
              return (
                <button
                  key={action.id}
                  onClick={() => onAction?.(action.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 bg-theme-bg/60 hover:bg-theme-bg border border-theme-border rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95",
                    actionColors[action.color]
                  )}
                >
                  <Icon size={13} className={iconColors[action.color]} /> {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Ticker Marquee */}
      <div className="bg-theme-bg/50 py-1.5 px-4 flex items-center justify-between gap-8 overflow-hidden text-xs transition-colors duration-300">
        <div className="flex items-center gap-1.5 shrink-0 text-theme-text font-bold">
          <Radio size={12} className="text-rose-500 animate-pulse" />
          <span>LIVE FEED</span>
        </div>

        {/* Marquee Body */}
        <div className="flex-1 overflow-hidden relative h-5">
          <div className="absolute flex gap-16 whitespace-nowrap text-[10px] font-semibold text-theme-muted animate-marquee">
            {tickerItems}
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:text-theme-accent font-bold text-[10px] transition-colors"
          onClick={onFiltersClick}
        >
          <Sliders size={11} />
          <span>Filters</span>
        </div>
      </div>
    </footer>
  );
};
