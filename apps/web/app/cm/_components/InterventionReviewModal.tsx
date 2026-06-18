"use client";

import React from "react";
import { X, Building2 } from "lucide-react";
import { Intervention } from "./cm-types";

export interface InterventionReviewModalProps {
  intervention: Intervention | null;
  onClose: () => void;
  onMarkReviewed: (item: Intervention) => void;
}

export const InterventionReviewModal: React.FC<InterventionReviewModalProps> = ({
  intervention,
  onClose,
  onMarkReviewed,
}) => {
  if (!intervention) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-theme-card p-5 shadow-2xl border border-theme-border flex flex-col max-h-[90vh] transition-colors duration-300">
        <div className="flex items-start justify-between border-b border-theme-border pb-3">
          <div>
            <span
              className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                intervention.severity === "critical"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              }`}
            >
              {intervention.severity}
            </span>
            <h3 className="text-base font-bold text-theme-text mt-1.5 leading-snug">
              {intervention.title}
            </h3>
            <p className="text-xs text-theme-muted mt-0.5">
              {intervention.ward ? `${intervention.ward}` : intervention.locality}
              {intervention.zone ? ` • ${intervention.zone}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-theme-muted hover:bg-theme-bg/60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Status Overview</h4>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-semibold text-theme-text">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>Pending Action</span>
              </div>
              <span className="text-xs text-theme-muted">|</span>
              <span className="text-xs text-theme-muted font-semibold">Active for: {intervention.time}</span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Assigned Departments</h4>
            <div className="flex gap-2">
              {intervention.departments.map((dept, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-theme-bg rounded-md text-xs font-bold text-theme-text flex items-center gap-1"
                >
                  <Building2 size={11} /> {dept}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Issue Details</h4>
            <p className="text-xs text-theme-text leading-relaxed font-semibold">
              {intervention.description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-theme-border pt-3 shrink-0">
          <button
            className="flex-1 py-2 bg-theme-bg hover:bg-theme-bg/85 text-theme-text rounded-lg text-xs font-bold transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2 bg-theme-accent hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all animate-pulse"
            onClick={() => onMarkReviewed(intervention)}
          >
            Mark Reviewed
          </button>
        </div>
      </div>
    </div>
  );
};
