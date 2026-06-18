"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Phone } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

import { KPIStatsRow } from "../KPIStatsRow";
import { MapSection } from "../MapSection";
import { AIInsightsPanel } from "../AIInsightsPanel";
import { DepartmentPerformanceTable } from "../DepartmentPerformanceTable";
import { CouncillorInfoCard } from "../CouncillorInfoCard";
import { ActiveInterventionsPanel } from "../ActiveInterventionsPanel";
import { LocalityHealthTable } from "../LocalityHealthTable";
import { ComplaintBreakdownGrid } from "../ComplaintBreakdownGrid";
import { WorkforceStatusCard } from "../WorkforceStatusCard";
import { WardPerformanceGrid } from "../WardPerformanceGrid";
import { PredictiveOutlookCard } from "../PredictiveOutlookCard";
import { QuickActionsFooter } from "../QuickActionsFooter";
import { InterventionReviewModal } from "../InterventionReviewModal";

import { DepartmentPerf, Intervention } from "../cm-types";
import type { WardFeature } from "../cm-geo";
import {
  wardInsights,
  wardCouncillor,
  wardLocalities,
  wardPredictionData,
  wardQuickActions,
} from "../cm-mock";
import { ComplaintPoint, useLiveDashboardData, useLiveWardCouncillor } from "../cm-geo";

export interface WardViewProps {
  onBack: () => void;
  triggerToast: (message: string) => void;
  isDark: boolean;
  wardTitle: string;
  wardSubtitle: string;
  /** The selected ward's polygon, drawn as an outline + fit. */
  wardRegion?: WardFeature;
  activeLayer: string;
  onLayerChange: (layerId: string) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  activeSeverities: string[];
  onToggleSeverity: (severity: string) => void;
  liveWardHealthScore?: number;
  points: ComplaintPoint[];
  wardNo: number | null;
}

export const WardView: React.FC<WardViewProps> = ({
  onBack,
  triggerToast,
  isDark,
  wardTitle,
  wardSubtitle,
  wardRegion,
  activeLayer,
  onLayerChange,
  intensity,
  onIntensityChange,
  activeSeverities,
  onToggleSeverity,
  liveWardHealthScore,
  points,
  wardNo,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof DepartmentPerf>("open");
  const [sortAsc, setSortAsc] = useState(false);
  const [interventionFilter, setInterventionFilter] = useState("all");
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null);

  const { kpis, interventions, departments } = useLiveDashboardData(points);

  const { councillor: dbCouncillor, loading: dbCouncillorLoading } = useLiveWardCouncillor(wardNo, points, liveWardHealthScore);

  const liveWardCouncillor = useMemo(() => {
    return dbCouncillor;
  }, [dbCouncillor]);

  const escalationTabs = useMemo(() => [
    { id: "all", label: "All" },
    { id: "critical", label: "Critical", match: (i: Intervention) => i.severity === "critical" },
    { id: "escalated", label: "Escalated", match: (i: Intervention) => !!i.escalated },
  ], []);

  // Search & tab filters for interventions
  const filteredInterventions = useMemo(() => {
    let list = interventions;
    if (interventionFilter !== "all") {
      const tab = escalationTabs.find((t) => t.id === interventionFilter);
      if (tab?.match) list = list.filter(tab.match);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          (i.zone?.toLowerCase().includes(query) ?? false) ||
          (i.ward?.toLowerCase().includes(query) ?? false)
      );
    }
    return list;
  }, [interventions, interventionFilter, searchQuery, escalationTabs]);

  const handleSort = (field: keyof DepartmentPerf) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [sortField, sortAsc]);

  const handleActionSubmit = (actionName: string) => {
    setActiveActionModal(null);
    triggerToast(`Success: ${actionName} triggered successfully.`);
  };

  const onAction = (id: string) => {
    if (id === "generate_report") {
      handleActionSubmit("Generate Ward Report");
    } else {
      setActiveActionModal(id);
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        <KPIStatsRow kpis={kpis} onCardClick={(id) => triggerToast(`Navigating to details for KPI card: ${id}`)} />

        <div className="flex flex-col xl:flex-row gap-3">
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col xl:flex-row gap-3 xl:h-[650px] shrink-0">
              <MapSection
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onShowIncidentsClick={() => triggerToast("Incident details refreshed")}
                wardTitle={wardTitle}
                wardSubtitle={wardSubtitle}
                searchPlaceholder="Search location in Ward..."
                onBack={onBack}
                regions={wardRegion ? [wardRegion] : undefined}
                className="xl:h-full"
                activeLayer={activeLayer}
                onLayerChange={onLayerChange}
                intensity={intensity}
                onIntensityChange={onIntensityChange}
                activeSeverities={activeSeverities}
                onToggleSeverity={onToggleSeverity}
              />
              <div className="w-full xl:w-80 shrink-0 flex flex-col gap-3 xl:h-full">
                <AIInsightsPanel insights={wardInsights} />
                <DepartmentPerformanceTable
                  departments={sortedDepartments}
                  sortField={sortField}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                  onViewAllClick={() => triggerToast("Opening comprehensive department log...")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
              <LocalityHealthTable
                localities={wardLocalities}
                onViewAnalyticsClick={() => triggerToast("Redirecting to detailed location breakdown...")}
                className="xl:h-full"
              />
              <div className="flex flex-col gap-3">
                <ComplaintBreakdownGrid />
                <WorkforceStatusCard activePercentage="71%" />
              </div>
              <div className="flex flex-col gap-3">
                <PredictiveOutlookCard
                  data={wardPredictionData}
                  expectedGrowth="+12%"
                  estimatedSlaMisses={6}
                  highRiskHotspots={["Roshampura", "Najafgarh Rd", "Jharoda Kalan"]}
                  isDark={isDark}
                />
                <WardPerformanceGrid />
              </div>
            </div>
          </div>

          <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-3 xl:h-[1154px]">
            <CouncillorInfoCard councillor={liveWardCouncillor} loading={dbCouncillorLoading} />
            <ActiveInterventionsPanel
              interventions={filteredInterventions}
              activeFilter={interventionFilter}
              onFilterChange={setInterventionFilter}
              onReviewClick={setSelectedIntervention}
              tabs={escalationTabs}
              onViewAllClick={() => triggerToast("Opening interventions portal...")}
            />
          </div>
        </div>
      </main>

      <QuickActionsFooter
        actions={wardQuickActions}
        onAction={onAction}
        onFiltersClick={() => triggerToast("Filters panel coming soon")}
      />

      <InterventionReviewModal
        intervention={selectedIntervention}
        onClose={() => setSelectedIntervention(null)}
        onMarkReviewed={(item) => {
          setSelectedIntervention(null);
          triggerToast(`Intervention "${item.title}" marked as Reviewed.`);
        }}
      />

      {/* ACTION MODAL: Call Councillor */}
      {activeActionModal === "call_councillor" && liveWardCouncillor && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-theme-card p-5 shadow-2xl border border-theme-border transition-colors duration-300">
            <div className="flex items-start justify-between border-b border-theme-border pb-3">
              <h3 className="text-base font-bold text-theme-text">Call Councillor {liveWardCouncillor.name.replace(/^(SH\.|MS\.|MR\.|MRS\.)\s+/i, "")}</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-theme-muted hover:bg-theme-bg/60 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-theme-muted leading-relaxed">
                Connect directly to {liveWardCouncillor.voterCard ? `Ward ${liveWardCouncillor.voterCard.split("-")[0]}` : "Ward"} councillor {liveWardCouncillor.name.replace(/^(SH\.|MS\.|MR\.|MRS\.)\s+/i, "")} for urgent ground support.
              </p>
              <div className="p-3 bg-theme-bg rounded-lg text-xs font-bold space-y-1">
                <p className="text-theme-muted text-[9px] uppercase leading-none">Office Phone:</p>
                <p className="text-theme-text text-sm">{liveWardCouncillor.phone || "+91 9810X XXXXX"}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-theme-bg hover:bg-theme-bg/85 text-theme-text rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Call Councillor")} className="flex-1 py-2 bg-theme-accent hover:opacity-90 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                <Phone size={12} /> Call Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: Schedule Ward Visit */}
      {activeActionModal === "schedule_visit" && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-theme-card p-5 shadow-2xl border border-theme-border transition-colors duration-300">
            <div className="flex items-start justify-between border-b border-theme-border pb-3">
              <h3 className="text-base font-bold text-theme-text">Schedule CM Ward Visit</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-theme-muted hover:bg-theme-bg/60 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-theme-muted">Setup a field audit visit for Ward 11 - Najafgarh.</p>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-theme-muted">Select Date:</label>
                <input type="date" className="w-full p-2 border border-theme-border rounded-md text-xs bg-theme-bg text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-theme-bg hover:bg-theme-bg/85 text-theme-text rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Schedule Visit")} className="flex-1 py-2 bg-theme-accent hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: Escalate to Commissioner */}
      {activeActionModal === "escalate_commissioner" && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-theme-card p-5 shadow-2xl border border-theme-border transition-colors duration-300">
            <div className="flex items-start justify-between border-b border-theme-border pb-3">
              <h3 className="text-base font-bold text-theme-text">Escalate to Commissioner</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-theme-muted hover:bg-theme-bg/60 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-theme-muted">
                Escalate all active Ward 11 SLA breaches directly to MCD and DJB commissioners for immediate intervention.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-theme-bg hover:bg-theme-bg/85 text-theme-text rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Escalate to Commissioner")} className="flex-1 py-2 bg-theme-accent hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all">
                Escalate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: Deploy Additional Staff */}
      {activeActionModal === "deploy_staff" && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-theme-card p-5 shadow-2xl border border-theme-border transition-colors duration-300">
            <div className="flex items-start justify-between border-b border-theme-border pb-3">
              <h3 className="text-base font-bold text-theme-text">Deploy Additional Staff</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-theme-muted hover:bg-theme-bg/60 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-theme-muted">
                Deploy quick response sanitation and engineering field teams to Ward 11 hotspots.
              </p>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-theme-muted">Select Team size:</label>
                <select className="w-full p-2 border border-theme-border rounded-md text-xs bg-theme-bg text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent">
                  <option>+1 Sanitation Crew (10 workers)</option>
                  <option>+3 Sanitation Crews (30 workers)</option>
                  <option>+1 Water/Sewerage Engineering Team</option>
                  <option>+1 PWD Road Repair Squad</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-theme-bg hover:bg-theme-bg/85 text-theme-text rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Staff Deployment")} className="flex-1 py-2 bg-theme-accent hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all">
                Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
