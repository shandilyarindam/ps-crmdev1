"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { MapPin } from "lucide-react";
import gsap from "gsap";
import type { Complaint, ColumnId } from "./kanban-types";
import { COLUMN_META, statusToColumn } from "./kanban-types";

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                   */
/* ------------------------------------------------------------------ */

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "L4":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "L3":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "L2":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "L1":
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  }
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "L4":
      return "URGENT";
    case "L3":
      return "HIGH";
    case "L2":
      return "ROUTINE";
    case "L1":
    default:
      return "LOW";
  }
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface KanbanBoardProps {
  complaints: Complaint[];
  loading: boolean;
  draggedItem: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, column: ColumnId) => void;
  onCardClick: (complaint: Complaint) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function KanbanBoard({
  complaints,
  loading,
  draggedItem,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
}: KanbanBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  // Stagger-animate cards on first paint / data change
  useEffect(() => {
    if (loading || !boardRef.current) return;
    const cards = boardRef.current.querySelectorAll("[data-kanban-card]");
    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.out",
        clearProps: "opacity,transform",
      }
    );
  }, [loading, complaints]);

  const columnComplaints = useCallback(
    (colId: ColumnId) =>
      complaints.filter((c) => statusToColumn(c.status) === colId),
    [complaints]
  );

  const countByColumn = useCallback(
    (colId: ColumnId) =>
      complaints.filter((c) => statusToColumn(c.status) === colId).length,
    [complaints]
  );

  const COLUMNS: ColumnId[] = ["open", "in_progress", "resolved"];

  return (
    <div
      ref={boardRef}
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
    >
      {COLUMNS.map((col) => {
        const meta = COLUMN_META[col];
        const items = columnComplaints(col);

        return (
          <div
            key={col}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col)}
            className="min-h-[24rem] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow dark:border-slate-700 dark:bg-[#1a1a1a]"
            style={{ borderLeftWidth: 4, borderLeftColor: meta.borderColor }}
          >
            {/* Column header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${meta.dotColor}`}
                />
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {meta.title}
                </h2>
              </div>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {countByColumn(col)}
              </span>
            </div>

            {/* Cards list */}
            <div className="space-y-3">
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                    />
                  ))}
                </>
              ) : items.length === 0 ? (
                <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  No complaints
                </div>
              ) : (
                items.map((complaint) => (
                  <div
                    key={complaint.id}
                    data-kanban-card
                    draggable
                    onDragStart={(e) => onDragStart(e, complaint.id)}
                    onClick={() => onCardClick(complaint)}
                    className={`cursor-grab select-none rounded-lg border border-slate-200 bg-white p-3.5 transition-all hover:shadow-md active:cursor-grabbing dark:border-slate-700 dark:bg-[#222222] dark:hover:border-slate-600 ${
                      draggedItem === complaint.id
                        ? "scale-[0.97] opacity-60 shadow-lg"
                        : ""
                    }`}
                  >
                    {/* Top row: severity + ticket id */}
                    <div className="mb-2 flex items-start justify-between">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${getSeverityColor(
                          complaint.severity
                        )}`}
                      >
                        {getSeverityLabel(complaint.severity)}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {complaint.ticket_id}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
                      {complaint.title}
                    </p>

                    {/* Location */}
                    {(complaint.ward_name || complaint.address_text) && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin size={13} />
                        <span>{complaint.ward_name || complaint.address_text}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
