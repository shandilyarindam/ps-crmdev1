"use client";

import React, { useState, useMemo } from "react";

import { KPIStatsRow } from "../KPIStatsRow";
import { MapSection } from "../MapSection";
import { ActiveInterventionsPanel } from "../ActiveInterventionsPanel";
import { DelhiHealthScoreBar } from "../DelhiHealthScoreBar";
import { QuickActionsFooter } from "../QuickActionsFooter";
import { InterventionReviewModal } from "../InterventionReviewModal";

import { Intervention, InterventionTab, ZoneScore } from "../cm-types";
import { delhiKpis, cmInterventions, delhiZoneScores } from "../cm-mock";
import type { ZoneFeature } from "../cm-geo";

export interface DelhiOverviewViewProps {
  /** 12 MCD zone polygons (unioned ward geometries). */
  zoneRegions: ZoneFeature[];
  /** zoneId -> complaint count, for choropleth fill. */
  zoneCounts: Record<string, number>;
  /** Click a zone polygon to drill into it. */
  onRegionClick: (zoneId: string) => void;
  triggerToast: (message: string) => void;
  activeLayer: string;
  onLayerChange: (layerId: string) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  activeSeverities: string[];
  onToggleSeverity: (severity: string) => void;
  overallScore?: number;
  trendStr?: string;
  liveZoneScores?: ZoneScore[];
  isLoading?: boolean;
}

// All / Critical / Escalated tabs
const escalationTabs: InterventionTab[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical", match: (i) => i.severity === "critical" },
  { id: "escalated", label: "Escalated", match: (i) => !!i.escalated },
];

export const DelhiOverviewView: React.FC<DelhiOverviewViewProps> = ({
  zoneRegions,
  zoneCounts,
  onRegionClick,
  triggerToast,
  activeLayer,
  onLayerChange,
  intensity,
  onIntensityChange,
  activeSeverities,
  onToggleSeverity,
  overallScore = 84,
  trendStr = "+3 pts",
  liveZoneScores,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [interventionFilter, setInterventionFilter] = useState("all");
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  // Search filter for map regions
  const filteredZoneRegions = useMemo(() => {
    if (!searchQuery) return zoneRegions;
    return zoneRegions.filter((r) =>
      r.properties.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [zoneRegions, searchQuery]);

  // Search & tab filters for interventions
  const filteredInterventions = useMemo(() => {
    let list = cmInterventions;
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

  return (
    <>
      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        <KPIStatsRow kpis={delhiKpis} onCardClick={(id) => triggerToast(`Navigating to details for KPI card: ${id}`)} />

        <div className="flex flex-col xl:flex-row gap-3">
          <div className="flex-1 flex flex-col min-h-[450px] xl:h-[560px]">
            <MapSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onShowIncidentsClick={() => triggerToast("Zone incident details refreshed")}
              wardTitle="Delhi Overview"
              wardSubtitle="12 Zones  •  250 Wards  •  Population: 2.1 Cr"
              searchPlaceholder="Search Zone / Ward..."
              regions={filteredZoneRegions}
              regionCounts={zoneCounts}
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
          </div>

          <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-3 xl:h-[560px]">
            <ActiveInterventionsPanel
              interventions={filteredInterventions}
              activeFilter={interventionFilter}
              onFilterChange={setInterventionFilter}
              onReviewClick={setSelectedIntervention}
              title="CM INTERVENTION REQUIRED"
              tabs={escalationTabs}
              showThumbnails
              onViewAllClick={() => triggerToast("Opening full interventions queue...")}
            />
          </div>
        </div>

        <DelhiHealthScoreBar 
          overall={overallScore} 
          trend={trendStr} 
          zones={liveZoneScores && liveZoneScores.length > 0 ? liveZoneScores : delhiZoneScores} 
          isLoading={isLoading}
        />
      </main>

      <QuickActionsFooter onFiltersClick={() => triggerToast("Filters panel coming soon")} />

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
