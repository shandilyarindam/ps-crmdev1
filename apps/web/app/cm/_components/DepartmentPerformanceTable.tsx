"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DepartmentPerf } from "./cm-types";

gsap.registerPlugin(useGSAP);

export interface DepartmentPerformanceTableProps {
  departments: DepartmentPerf[];
  sortField: keyof DepartmentPerf;
  sortAsc: boolean;
  onSort: (field: keyof DepartmentPerf) => void;
  onViewAllClick?: () => void;
}

export const DepartmentPerformanceTable: React.FC<DepartmentPerformanceTableProps> = ({
  departments,
  sortField,
  sortAsc,
  onSort,
  onViewAllClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Row entry transition
      gsap.fromTo(
        ".dept-row",
        { opacity: 0, x: 10 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: "power1.out" }
      );
    },
    { scope: containerRef }
  );

  const renderSortIndicator = (field: keyof DepartmentPerf) => {
    if (sortField !== field) return null;
    return sortAsc ? " ▲" : " ▼";
  };

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex-1 flex flex-col min-h-0 select-none"
    >
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase mb-3 shrink-0">
        DEPARTMENT PERFORMANCE
      </h3>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 dark:border-zinc-800 select-none">
              <th
                className="pb-2 font-bold cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                onClick={() => onSort("name")}
              >
                Dept{renderSortIndicator("name")}
              </th>
              <th
                className="pb-2 font-bold text-center cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                onClick={() => onSort("open")}
              >
                Open{renderSortIndicator("open")}
              </th>
              <th
                className="pb-2 font-bold text-center cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                onClick={() => onSort("slaMissed")}
              >
                SLA Miss{renderSortIndicator("slaMissed")}
              </th>
              <th
                className="pb-2 font-bold text-right cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                onClick={() => onSort("avgResponse")}
              >
                Response{renderSortIndicator("avgResponse")}
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-zinc-300 font-semibold divide-y divide-slate-50 dark:divide-zinc-800/50">
            {departments.map((dept) => (
              <tr
                key={dept.id}
                className="dept-row opacity-0 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-2.5 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dept.color}`}></span>
                  <span className="font-bold">{dept.name}</span>
                </td>
                <td className="py-2.5 text-center font-bold text-slate-800 dark:text-white">
                  {dept.open}
                </td>
                <td className="py-2.5 text-center text-red-500 font-bold">{dept.slaMissed}</td>
                <td className="py-2.5 text-right text-slate-500 dark:text-zinc-400">
                  {dept.avgResponse}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onViewAllClick && (
        <div className="mt-3 text-center border-t border-slate-100 pt-2.5 dark:border-zinc-800 shrink-0">
          <a
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onViewAllClick();
            }}
          >
            View All Departments
          </a>
        </div>
      )}
    </div>
  );
};
