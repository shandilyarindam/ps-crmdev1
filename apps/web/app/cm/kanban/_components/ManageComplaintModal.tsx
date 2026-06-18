"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Tag,
  Shield,
} from "lucide-react";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import type { Complaint } from "./kanban-types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function severityLabel(sev: string): string {
  switch (sev) {
    case "L4": return "URGENT";
    case "L3": return "HIGH";
    case "L2": return "ROUTINE";
    case "L1": return "LOW";
    default:   return sev;
  }
}

function severityBadgeClasses(sev: string): string {
  switch (sev) {
    case "L4": return "bg-red-500 text-white dark:bg-red-600";
    case "L3": return "bg-orange-500 text-white dark:bg-orange-600";
    case "L2": return "bg-blue-500 text-white dark:bg-blue-600";
    case "L1": return "bg-slate-400 text-white dark:bg-slate-500";
    default:   return "bg-slate-400 text-white dark:bg-slate-500";
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ManageComplaintModalProps {
  complaint: Complaint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplaintUpdate?: (updated: Complaint) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ManageComplaintModal({
  complaint,
  open,
  onOpenChange,
  onComplaintUpdate,
}: ManageComplaintModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState<
    "resolve" | "assign" | null
  >(null);

  // Reset local state whenever the modal opens with a new complaint
  useEffect(() => {
    if (open) {
      setNotes("");
      setError("");
      // Auto-select action based on complaint status
      if (complaint?.status === "submitted" || complaint?.status === "under_review") {
        setActiveAction("assign");
      } else if (complaint?.status === "assigned" || complaint?.status === "in_progress") {
        setActiveAction("resolve");
      } else {
        setActiveAction(null);
      }
    }
  }, [open, complaint]);

  // --- Animate in / out with GSAP ---
  useEffect(() => {
    if (!open) return;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) return;

    gsap.fromTo(
      backdrop,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" }
    );
    gsap.fromTo(
      panel,
      { opacity: 0, scale: 0.92, y: 24 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: "back.out(1.4)",
      }
    );
  }, [open]);

  const animateOut = useCallback(
    (cb: () => void) => {
      const backdrop = backdropRef.current;
      const panel = panelRef.current;
      if (!backdrop || !panel) {
        cb();
        return;
      }
      const tl = gsap.timeline({ onComplete: cb });
      tl.to(panel, {
        opacity: 0,
        scale: 0.92,
        y: 24,
        duration: 0.2,
        ease: "power2.in",
      }).to(backdrop, { opacity: 0, duration: 0.15 }, "-=0.1");
    },
    []
  );

  const handleClose = useCallback(() => {
    animateOut(() => onOpenChange(false));
  }, [animateOut, onOpenChange]);

  if (!open || !complaint) return null;

  /* ---- Actions ---- */

  async function handleResolve() {
    if (!complaint) return;
    if (!notes.trim()) {
      setError("Please enter notes before resolving");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      await supabase
        .from("complaints")
        .update({
          status: "resolved" as const,
          resolved_at: new Date().toISOString(),
          resolution_note: notes,
        })
        .eq("id", complaint.id);

      onComplaintUpdate?.({
        ...complaint,
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_note: notes,
      });
      animateOut(() => onOpenChange(false));
    } catch {
      setError("Failed to resolve complaint");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!complaint) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      await supabase
        .from("complaints")
        .update({
          status: "assigned" as const,
        })
        .eq("id", complaint.id);

      onComplaintUpdate?.({
        ...complaint,
        status: "assigned",
      });
      animateOut(() => onOpenChange(false));
    } catch {
      setError("Failed to assign complaint");
    } finally {
      setLoading(false);
    }
  }

  /* ---- Render ---- */

  const statusLabel = complaint.status.replace(/_/g, " ");

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed left-1/2 top-1/2 z-[61] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2"
      >
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#1e1e1e]">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Manage Complaint
              </h2>
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                {complaint.ticket_id}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-6">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoField
                icon={<Shield size={14} />}
                label="Severity"
                badge
                badgeClasses={severityBadgeClasses(complaint.severity)}
                value={severityLabel(complaint.severity)}
              />
              <InfoField
                icon={<Tag size={14} />}
                label="Status"
                value={statusLabel}
              />
              {(complaint.ward_name || complaint.address_text) && (
                <InfoField
                  icon={<MapPin size={14} />}
                  label="Location"
                  value={complaint.ward_name || complaint.address_text || "—"}
                />
              )}
              <InfoField
                icon={<Clock size={14} />}
                label="Reported"
                value={formatDate(complaint.created_at)}
              />
            </div>

            {/* Title & Description */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Summary
              </span>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                {complaint.title}
              </p>
              {complaint.description && complaint.description !== complaint.title && (
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {complaint.description}
                </p>
              )}
            </div>

            {/* Assigned department */}
            {complaint.assigned_department && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Department
                </span>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                  {complaint.assigned_department}
                </p>
              </div>
            )}

            {/* Action section */}
            <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
              {activeAction === "resolve" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 dark:bg-emerald-900/20">
                    <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                      Mark as Resolved
                    </span>
                    <span className="ml-auto rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">
                      Action Required
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Resolution Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe the action taken to resolve this complaint..."
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 dark:border-slate-600 dark:bg-[#161616] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
                    />
                  </div>
                  {error && <ErrorBanner message={error} />}
                  <button
                    onClick={handleResolve}
                    disabled={loading}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  >
                    {loading ? "Resolving…" : "Mark Resolved"}
                  </button>
                </div>
              ) : activeAction === "assign" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 dark:bg-blue-900/20">
                    <AlertCircle size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Assign Complaint
                    </span>
                  </div>
                  {error && <ErrorBanner message={error} />}
                  <button
                    onClick={handleAssign}
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    {loading ? "Assigning…" : "Assign Complaint"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaint.status !== "resolved" && complaint.status !== "rejected" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveAction("assign")}
                        className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => setActiveAction("resolve")}
                        className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-[#161616] dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Small sub-components                                               */
/* ------------------------------------------------------------------ */

function InfoField({
  icon,
  label,
  value,
  badge = false,
  badgeClasses = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: boolean;
  badgeClasses?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      {badge ? (
        <span
          className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold ${badgeClasses}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-1 text-sm capitalize text-slate-800 dark:text-slate-200">
          {value}
        </p>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
      <AlertCircle size={16} />
      {message}
    </div>
  );
}
