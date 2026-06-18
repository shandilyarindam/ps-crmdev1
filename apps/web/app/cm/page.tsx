"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "@/components/ThemeProvider";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

import { CMHeader, ViewLevel } from "./_components/CMHeader";
import { DelhiOverviewView } from "./_components/views/DelhiOverviewView";
import { ZoneView } from "./_components/views/ZoneView";
import { WardView } from "./_components/views/WardView";
import {
  usePrecomputedZoneRegions,
  useWardGeoJSON,
  useComplaintPoints,
  useDelhiHealthScores,
  wardRegionsForZone,
  wardByNo,
  countPointsInRegions,
  type ComplaintPoint,
} from "./_components/cm-geo";
import { ZONE_BY_ID, type ZoneId } from "./_components/ward-zone-map";

gsap.registerPlugin(useGSAP);

/** "FATEH NAGAR" -> "Fateh Nagar" */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CMCommandCenterPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [timeStr, setTimeStr] = useState("10:42 AM");
  const [dateStr, setDateStr] = useState("June 16, 2026");

  // Navigation state machine: Delhi -> Zone -> Ward
  const [view, setView] = useState<ViewLevel>("delhi");
  const [selectedZoneId, setSelectedZoneId] = useState<ZoneId | null>(null);
  const [selectedWardNo, setSelectedWardNo] = useState<number | null>(null);

  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  const viewRef = useRef<HTMLDivElement>(null);

  // Lifted Map Filter & Control States
  const [activeLayer, setActiveLayer] = useState("density");
  const [intensity, setIntensity] = useState(70);
  const [activeSeverities, setActiveSeverities] = useState<string[]>([
    "Very High",
    "High",
    "Medium",
    "Low",
    "Very Low",
  ]);

  // Real geographic data (precomputed zones, lazy loaded wards + complaint points)
  const { zoneRegions } = usePrecomputedZoneRegions();
  const { wards } = useWardGeoJSON(view !== "delhi");
  const { points } = useComplaintPoints();

  // Live health scores calculated from DB
  const { overall: liveOverallScore, trend: liveTrendStr, zones: liveZoneScores, wards: liveWardScores, loaded } = useDelhiHealthScores();

  const selectedZoneHealthScore = useMemo(() => {
    if (!selectedZoneId) return undefined;
    const zoneData = liveZoneScores.find(z => z.id === selectedZoneId);
    return zoneData?.score;
  }, [selectedZoneId, liveZoneScores]);

  const selectedWardHealthScore = useMemo(() => {
    if (selectedWardNo == null) return undefined;
    return liveWardScores[selectedWardNo]?.score;
  }, [selectedWardNo, liveWardScores]);

  // Dynamic filter function for points used in choropleth & markers
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      // 1. Filter by Severity Legend selection
      const sev = (p.severity ?? "").toLowerCase().trim();
      let label = "Low";
      if (sev === "l4" || sev === "critical" || sev === "crit") label = "Very High";
      else if (sev === "l3" || sev === "high") label = "High";
      else if (sev === "l2" || sev === "medium" || sev === "med") label = "Medium";
      else if (sev === "l1" || sev === "low") label = "Low";
      else if (sev === "very low" || sev === "very_low" || sev === "l0") label = "Very Low";

      if (!activeSeverities.includes(label)) return false;

      // 2. Filter by Active Layer selection
      if (!activeLayer || activeLayer === "density") return true;

      const title = p.title.toLowerCase();
      const desc = p.description.toLowerCase();
      const dept = (p.assigned_department ?? "").toLowerCase();

      if (activeLayer === "critical") {
        return label === "Very High";
      }
      if (activeLayer === "sla") {
        return p.sla_breached;
      }
      if (activeLayer === "garbage") {
        return title.includes("garbage") || title.includes("dump") || desc.includes("garbage") || desc.includes("dump") || dept === "mcd";
      }
      if (activeLayer === "roads") {
        return title.includes("road") || title.includes("pothole") || desc.includes("road") || desc.includes("pothole") || dept === "pwd";
      }
      if (activeLayer === "water") {
        return title.includes("water") || title.includes("sewage") || title.includes("leak") || title.includes("drain") || desc.includes("water") || desc.includes("sewage") || desc.includes("leak") || desc.includes("drain") || dept === "djb";
      }
      if (activeLayer === "streetlights") {
        return title.includes("light") || title.includes("electricity") || desc.includes("light") || desc.includes("electricity");
      }
      if (activeLayer === "cctv") {
        return title.includes("cctv") || title.includes("camera") || title.includes("detect") || desc.includes("cctv") || desc.includes("camera") || desc.includes("detect");
      }

      return true;
    });
  }, [points, activeLayer, activeSeverities]);

  const handleToggleSeverity = (severity: string) => {
    setActiveSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const zoneCounts = useMemo(
    () => countPointsInRegions(zoneRegions, filteredPoints),
    [zoneRegions, filteredPoints]
  );

  const zoneWardRegions = useMemo(
    () => (selectedZoneId ? wardRegionsForZone(wards, selectedZoneId) : []),
    [wards, selectedZoneId]
  );
  const wardCounts = useMemo(
    () => countPointsInRegions(zoneWardRegions, filteredPoints),
    [zoneWardRegions, filteredPoints]
  );

  const pointsByZone = useMemo(() => {
    const map = new Map<string, ComplaintPoint[]>();
    for (const r of zoneRegions) {
      const id = String(r.id ?? "");
      const pts = filteredPoints.filter((p) => booleanPointInPolygon([p.lng, p.lat], r));
      map.set(id, pts);
    }
    return map;
  }, [zoneRegions, filteredPoints]);

  const pointsByWard = useMemo(() => {
    const map = new Map<number, ComplaintPoint[]>();
    for (const r of wards) {
      const id = Number(r.id);
      const pts = filteredPoints.filter((p) => booleanPointInPolygon([p.lng, p.lat], r));
      map.set(id, pts);
    }
    return map;
  }, [wards, filteredPoints]);

  const wardRegion = useMemo(
    () => (selectedWardNo != null ? wardByNo(wards, selectedWardNo) : undefined),
    [wards, selectedWardNo]
  );

  // Animate the active view on every level change
  useGSAP(
    () => {
      gsap.fromTo(
        viewRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );
    },
    { dependencies: [view], scope: viewRef }
  );

  // Clock ticks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setDateStr(now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerToast = (message: string) => {
    setActionSuccessToast(message);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  // Drill-down handlers — driven by the clicked map region's id
  const drillToZone = (zoneId: string) => {
    setSelectedZoneId(zoneId as ZoneId);
    setView("zone");
  };

  const drillToWard = (wardNo: string) => {
    setSelectedWardNo(Number(wardNo));
    setView("ward");
  };

  // Breadcrumb / location-button navigation
  const goToLevel = (target: ViewLevel) => {
    if (target === "delhi") {
      setSelectedZoneId(null);
      setSelectedWardNo(null);
    } else if (target === "zone") {
      setSelectedWardNo(null);
    }
    setView(target);
  };

  const zoneName = selectedZoneId ? ZONE_BY_ID[selectedZoneId]?.name ?? "Zone" : "Central";
  const wardNameRaw = wardRegion?.properties.wardname;
  const wardLabel =
    selectedWardNo != null
      ? `Ward ${selectedWardNo}${wardNameRaw ? ` - ${titleCase(wardNameRaw)}` : ""}`
      : "Ward";
  const wardPop = wardRegion?.properties.totalpop;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-theme-bg text-theme-text antialiased transition-colors duration-300 font-sans">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed bottom-16 right-6 z-[9999] flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <CheckCircle2 size={18} />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      <CMHeader
        level={view}
        zoneName={zoneName}
        wardName={wardLabel}
        dateStr={dateStr}
        timeStr={timeStr}
        onCrumb={goToLevel}
      />

      <div ref={viewRef} className="flex flex-1 flex-col min-h-0">
        {view === "delhi" && (
          <DelhiOverviewView
            zoneRegions={zoneRegions}
            zoneCounts={zoneCounts}
            onRegionClick={drillToZone}
            triggerToast={triggerToast}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            intensity={intensity}
            onIntensityChange={setIntensity}
            activeSeverities={activeSeverities}
            onToggleSeverity={handleToggleSeverity}
            overallScore={liveOverallScore}
            trendStr={liveTrendStr}
            liveZoneScores={liveZoneScores}
            isLoading={!loaded}
            points={points}
          />
        )}
        {view === "zone" && (
          <ZoneView
            zoneName={zoneName}
            onBack={() => goToLevel("delhi")}
            wardRegions={zoneWardRegions}
            wardCounts={wardCounts}
            onRegionClick={drillToWard}
            triggerToast={triggerToast}
            isDark={isDark}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            intensity={intensity}
            onIntensityChange={setIntensity}
            activeSeverities={activeSeverities}
            onToggleSeverity={handleToggleSeverity}
            liveWardScores={liveWardScores}
            zoneHealthScore={selectedZoneHealthScore}
            points={selectedZoneId ? pointsByZone.get(selectedZoneId) || [] : []}
          />
        )}
        {view === "ward" && (
          <WardView
            onBack={() => goToLevel("zone")}
            triggerToast={triggerToast}
            isDark={isDark}
            wardTitle={`${wardLabel} (Delhi)`}
            wardSubtitle={`${zoneName} Zone${wardPop ? `  |  Population: ${wardPop.toLocaleString("en-IN")}` : ""}`}
            wardRegion={wardRegion}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            intensity={intensity}
            onIntensityChange={setIntensity}
            activeSeverities={activeSeverities}
            onToggleSeverity={handleToggleSeverity}
            liveWardHealthScore={selectedWardHealthScore}
            points={selectedWardNo != null ? pointsByWard.get(selectedWardNo) || [] : []}
            wardNo={selectedWardNo}
          />
        )}
      </div>
    </div>
  );
}
