"use client";

import React, { useRef } from "react";
import { Phone, CalendarDays, UserCheck, UserPlus, FileText, Radio, Sliders } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export interface QuickActionsFooterProps {
  onCallCouncillor: () => void;
  onScheduleVisit: () => void;
  onEscalateCommissioner: () => void;
  onDeployStaff: () => void;
  onGenerateReport: () => void;
  onFiltersClick: () => void;
}

export const QuickActionsFooter: React.FC<QuickActionsFooterProps> = ({
  onCallCouncillor,
  onScheduleVisit,
  onEscalateCommissioner,
  onDeployStaff,
  onGenerateReport,
  onFiltersClick,
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
      className="opacity-0 bg-white border-t border-slate-200 mt-auto sticky bottom-0 z-50 shrink-0 dark:border-zinc-800 dark:bg-zinc-900 select-none"
    >
      {/* Quick Actions Panel */}
      <div className="px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
            QUICK
            <br />
            ACTIONS
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCallCouncillor}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-50 dark:bg-zinc-800 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-zinc-700/50 shadow-sm transition-all active:scale-95"
          >
            <Phone size={13} className="text-emerald-500" /> Call Councillor
          </button>
          <button
            onClick={onScheduleVisit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 dark:bg-zinc-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-zinc-700/50 shadow-sm transition-all active:scale-95"
          >
            <CalendarDays size={13} className="text-red-500" /> Schedule Ward Visit
          </button>
          <button
            onClick={onEscalateCommissioner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 dark:bg-zinc-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-zinc-700/50 shadow-sm transition-all active:scale-95"
          >
            <UserCheck size={13} className="text-red-500" /> Escalate to Commissioner
          </button>
          <button
            onClick={onDeployStaff}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-50 dark:bg-zinc-800 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-zinc-700/50 shadow-sm transition-all active:scale-95"
          >
            <UserPlus size={13} className="text-emerald-500" /> Deploy Additional Staff
          </button>
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 dark:bg-zinc-800 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-zinc-700/50 shadow-sm transition-all active:scale-95"
          >
            <FileText size={13} className="text-blue-500" /> Generate Ward Report
          </button>
        </div>
      </div>

      {/* Live Ticker Marquee */}
      <div className="bg-slate-50 dark:bg-zinc-950 py-1.5 px-4 flex items-center justify-between gap-8 overflow-hidden text-xs">
        <div className="flex items-center gap-1.5 shrink-0 text-slate-800 dark:text-zinc-200 font-bold">
          <Radio size={12} className="text-emerald-500 animate-pulse" />
          <span>LIVE FEED</span>
        </div>

        {/* Marquee Body */}
        <div className="flex-1 overflow-hidden relative h-5">
          <div className="absolute flex gap-16 whitespace-nowrap text-[10px] font-semibold text-slate-500 dark:text-zinc-400 animate-marquee">
            <span>
              • <strong className="text-slate-700 dark:text-zinc-200">142</strong> new complaints
              reported across zone today
            </span>
            <span>
              • <strong className="text-slate-700 dark:text-zinc-200">Mobile Workforce:</strong>{" "}
              1,254 Workers online • 71% active deployment
            </span>
            <span>
              • <strong className="text-slate-700 dark:text-zinc-200">Departments:</strong> 24 key
              municipal areas under active surveillance
            </span>
            <span>
              • <strong className="text-slate-700 dark:text-zinc-200">Avg Resolution:</strong> 4h
              12m response time (<span className="text-emerald-500">-11% today</span>)
            </span>
            <span>
              • <strong className="text-slate-700 dark:text-zinc-200">Queue backlog:</strong>{" "}
              reduced by 8.2% in last 24h
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:text-emerald-600 font-bold text-[10px] dark:hover:text-emerald-400 transition-colors"
          onClick={onFiltersClick}
        >
          <Sliders size={11} />
          <span>Filters</span>
        </div>
      </div>
    </footer>
  );
};
