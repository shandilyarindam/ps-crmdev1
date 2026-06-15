"use client";

import React, { useRef } from "react";
import { User } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CouncillorData } from "./cm-types";

gsap.registerPlugin(useGSAP);

export interface CouncillorInfoCardProps {
  councillor: CouncillorData;
}

export const CouncillorInfoCard: React.FC<CouncillorInfoCardProps> = ({ councillor }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Zoom-in/fade-in for the avatar and details
      gsap.fromTo(
        cardRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    },
    { scope: cardRef }
  );

  return (
    <div
      ref={cardRef}
      className="opacity-0 bg-white rounded-xl border border-slate-200 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex-1 lg:max-w-md select-none"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase mb-3">
        COUNCILLOR INFORMATION
      </h3>
      
      {/* Header Profile Area */}
      <div className="flex items-start gap-3.5 mb-3.5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-emerald-100 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
          <User size={32} className="text-emerald-600 dark:text-emerald-400" />
          <div className="absolute bottom-1 left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 text-[7px] text-white font-black">
            A
          </div>
        </div>
        <div className="flex-1">
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block leading-none">
            {councillor.role}
          </span>
          <h4 className="text-base font-bold text-slate-800 dark:text-white mt-0.5 leading-tight">
            {councillor.name}
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight font-medium">
            {councillor.body}  |  {councillor.electionYear}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Party:</span>
            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded leading-none ${councillor.partyColor}`}>
              {councillor.party}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Main Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3.5 border-t border-b border-slate-100 py-2.5 dark:border-zinc-800">
        <div className="text-center">
          <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 leading-tight">Complaints</p>
          <p className="font-black text-slate-800 dark:text-white text-sm mt-0.5">
            {councillor.complaints}
          </p>
        </div>
        <div className="text-center border-l border-slate-100 dark:border-zinc-800 pl-1">
          <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 leading-tight">Resolution</p>
          <p className="font-black text-slate-800 dark:text-white text-sm mt-0.5">
            {councillor.resolutionTime}
          </p>
        </div>
        <div className="text-center border-l border-slate-100 dark:border-zinc-800 pl-1">
          <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 leading-tight">Satisfaction</p>
          <p className="font-black text-slate-800 dark:text-white text-sm mt-0.5">
            {councillor.satisfactionRate}
          </p>
        </div>
        <div className="text-center border-l border-slate-100 dark:border-zinc-800 pl-1">
          <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 leading-tight">Ward Health</p>
          <p className="font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 text-sm mt-0.5">
            {councillor.wardHealth}
            <span className="text-[9px] font-medium text-slate-400">/100</span>
          </p>
        </div>
      </div>

      {/* Detailed About section */}
      <div>
        <h5 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase">
          About Councillor
        </h5>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-600 dark:text-zinc-300 font-semibold">
          <div>
            <p className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase leading-none mb-0.5">
              Spouse Name:
            </p>
            <p className="text-slate-800 dark:text-white leading-tight">{councillor.spouseName}</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase leading-none mb-0.5">
              Profession:
            </p>
            <p className="text-slate-800 dark:text-white leading-tight">{councillor.profession}</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase leading-none mb-0.5">
              Age:
            </p>
            <p className="text-slate-800 dark:text-white leading-tight">{councillor.age} Years</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-zinc-500 text-[9px] uppercase leading-none mb-0.5">
              Voter Card:
            </p>
            <p className="text-slate-800 dark:text-white leading-tight">{councillor.voterCard}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
