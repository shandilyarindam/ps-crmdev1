"use client";

import React, { useState, useMemo } from "react";

import { KPIStatsRow } from "../KPIStatsRow";
import { MapSection } from "../MapSection";
import { AIInsightsPanel } from "../AIInsightsPanel";
import { DepartmentPerformanceTable } from "../DepartmentPerformanceTable";
import { CouncillorInfoCard } from "../CouncillorInfoCard";
import { ActiveInterventionsPanel } from "../ActiveInterventionsPanel";
import { LocalityHealthTable } from "../LocalityHealthTable";
import { PredictiveOutlookCard } from "../PredictiveOutlookCard";
import { QuickActionsFooter } from "../QuickActionsFooter";
import { InterventionReviewModal } from "../InterventionReviewModal";

import { DepartmentPerf, Intervention, InterventionTab } from "../cm-types";
import type { WardFeature } from "../cm-geo";
import {
  zoneKpis,
  zoneDepartments,
  zoneInterventions,
  zoneInsights,
  zoneCommissioner,
  wardHealthRows,
  zonePredictionData,
  zoneQuickActions,
} from "../cm-mock";

export interface ZoneViewProps {
  zoneName: string;
  onBack: () => void;
  /** Ward polygons belonging to this zone. */
  wardRegions: WardFeature[];
  /** ward_no -> complaint count, for choropleth fill. */
  wardCounts: Record<string, number>;
  /** Click a ward polygon to drill into it. */
  onRegionClick: (wardNo: string) => void;
  triggerToast: (message: string) => void;
  isDark: boolean;
  activeLayer: string;
  onLayerChange: (layerId: string) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  activeSeverities: string[];
  onToggleSeverity: (severity: string) => void;
  liveWardScores?: Record<number, { score: number; activeComplaints: number }>;
  zoneHealthScore?: number;
}

// All / Critical / Escalated tabs (zone + delhi level)
const escalationTabs: InterventionTab[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical", match: (i) => i.severity === "critical" },
  { id: "escalated", label: "Escalated", match: (i) => !!i.escalated },
];

export const ZoneView: React.FC<ZoneViewProps> = ({
  zoneName,
  onBack,
  wardRegions,
  wardCounts,
  onRegionClick,
  triggerToast,
  isDark,
  activeLayer,
  onLayerChange,
  intensity,
  onIntensityChange,
  activeSeverities,
  onToggleSeverity,
  liveWardScores,
  zoneHealthScore,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof DepartmentPerf>("open");
  const [sortAsc, setSortAsc] = useState(false);
  const [interventionFilter, setInterventionFilter] = useState("all");
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const liveWardHealthRows = useMemo(() => {
    return wardRegions.map((w) => {
      const wardNo = w.properties.ward_no;
      const wardName = w.properties.wardname;
      const stats = liveWardScores?.[wardNo] || { score: 100, activeComplaints: 0 };
      return {
        name: `Ward ${wardNo} - ${wardName}`,
        count: stats.activeComplaints,
        sev: `${stats.score}%`,
        color: stats.score >= 85 ? "bg-emerald-500" : stats.score >= 70 ? "bg-amber-400" : "bg-red-600",
      };
    });
  }, [wardRegions, liveWardScores]);

  // Search filter for map regions
  const filteredWardRegions = useMemo(() => {
    if (!searchQuery) return wardRegions;
    const query = searchQuery.toLowerCase();
    return wardRegions.filter((r) =>
      r.properties.wardname.toLowerCase().includes(query) ||
      String(r.properties.ward_no).includes(query)
    );
  }, [wardRegions, searchQuery]);

  // Search & tab filters for interventions
  const filteredInterventions = useMemo(() => {
    let list = zoneInterventions;
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
  }, [interventionFilter, searchQuery]);

  const handleSort = (field: keyof DepartmentPerf) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedDepartments = useMemo(() => {
    return [...zoneDepartments].sort((a, b) => {
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

  return (
    <>
      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        <KPIStatsRow kpis={zoneKpis} onCardClick={(id) => triggerToast(`Navigating to details for KPI card: ${id}`)} />

        <div className="flex flex-col xl:flex-row gap-3">
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col xl:flex-row gap-3 xl:h-[450px] shrink-0">
              <MapSection
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onShowIncidentsClick={() => triggerToast("Incident details refreshed")}
                wardTitle={`${zoneName} Zone`}
                wardSubtitle={`${wardRegions.length} Wards  •  Click a ward to drill in`}
                searchPlaceholder="Search Ward / Location..."
                onBack={onBack}
                regions={filteredWardRegions}
                regionCounts={wardCounts}
                onRegionClick={onRegionClick}
                choropleth
                showComplaints={false}
                className="xl:h-full"
                activeLayer={activeLayer}
                onLayerChange={onLayerChange}
                intensity={intensity}
                onIntensityChange={onIntensityChange}
                activeSeverities={activeSeverities}
                onToggleSeverity={onToggleSeverity}
              />
              <div className="w-full xl:w-80 shrink-0 flex flex-col gap-3 xl:h-full">
                <AIInsightsPanel insights={zoneInsights} />
                <DepartmentPerformanceTable
                  departments={sortedDepartments}
                  sortField={sortField}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                  onViewAllClick={() => triggerToast("Opening comprehensive department log...")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
              <LocalityHealthTable
                localities={liveWardHealthRows}
                title="WARD HEALTH SUMMARY"
                rowLabel="Ward"
                actionLabel="View Ward Analytics"
                onViewAnalyticsClick={() => triggerToast("Opening ward analytics breakdown...")}
                className="xl:h-full"
              />
              <PredictiveOutlookCard
                data={zonePredictionData}
                expectedGrowth="+14%"
                estimatedSlaMisses={11}
                highRiskHotspots={["Connaught Place", "Karol Bagh", "Paharganj"]}
                isDark={isDark}
              />
            </div>
          </div>

          <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-3 xl:h-[760px]">
            <CouncillorInfoCard
              councillor={zoneCommissioner}
              title={`${zoneName.toUpperCase()} ZONE COMMAND CENTER`}
              showAbout={false}
              showParty={false}
              onCall={() => triggerToast("Connecting to Zone Commissioner...")}
              metrics={[
                { label: "Zone Health", value: String(zoneHealthScore ?? 76), suffix: "/100", highlight: true },
                { label: "Budget Used", value: "68%" },
                { label: "Field Staff", value: "428" },
                { label: "Escalations", value: "5" },
              ]}
            />
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
        actions={zoneQuickActions}
        onAction={(id) => triggerToast(`Action triggered: ${id.replace(/_/g, " ")}`)}
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
    </>
  );
};
