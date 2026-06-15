"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Landmark,
  MapPin,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  Building2,
  X,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// Import modular components
import { KPIStatsRow } from "./_components/KPIStatsRow";
import { MapLayersPanel } from "./_components/MapLayersPanel";
import { MapSection } from "./_components/MapSection";
import { AIInsightsPanel } from "./_components/AIInsightsPanel";
import { DepartmentPerformanceTable } from "./_components/DepartmentPerformanceTable";
import { CouncillorInfoCard } from "./_components/CouncillorInfoCard";
import { ActiveInterventionsPanel } from "./_components/ActiveInterventionsPanel";
import { LocalityHealthTable } from "./_components/LocalityHealthTable";
import { ComplaintBreakdownGrid } from "./_components/ComplaintBreakdownGrid";
import { WorkforceStatusCard } from "./_components/WorkforceStatusCard";
import { WardPerformanceGrid } from "./_components/WardPerformanceGrid";
import { QuickActionsFooter } from "./_components/QuickActionsFooter";
import { PredictiveOutlookCard } from "./_components/PredictiveOutlookCard";

// Import types
import {
  DepartmentPerf,
  Intervention,
  LocalityHealth,
  AIInsightItem,
  KPICardData,
  CouncillorData,
} from "./_components/cm-types";

export default function CMCommandCenterPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState("10:42 AM");
  const [dateStr, setDateStr] = useState("June 16, 2026");

  // State for active map layer, search query, and intensity
  const [activeLayer, setActiveLayer] = useState("density");
  const [searchQuery, setSearchQuery] = useState("");
  const [intensity, setIntensity] = useState(70);

  // Department Table sorting states
  const [sortField, setSortField] = useState<keyof DepartmentPerf>("open");
  const [sortAsc, setSortAsc] = useState(false);

  // Intervention filter state
  const [interventionFilter, setInterventionFilter] = useState<"all" | "critical" | "high" | "medium">("all");

  // Selected items/Modals state
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Clock ticks
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show Toast helper
  const triggerToast = (message: string) => {
    setActionSuccessToast(message);
    setTimeout(() => {
      setActionSuccessToast(null);
    }, 4000);
  };

  // Mock data for Departments
  const [departments] = useState<DepartmentPerf[]>([
    { id: "mcd", name: "MCD", open: 68, slaMissed: 5, avgResponse: "5h 20m", color: "bg-emerald-500" },
    { id: "djb", name: "DJB", open: 32, slaMissed: 1, avgResponse: "2h 10m", color: "bg-blue-500" },
    { id: "pwd", name: "PWD", open: 18, slaMissed: 1, avgResponse: "1h 40m", color: "bg-slate-500" },
    { id: "electricity", name: "Electricity", open: 14, slaMissed: 0, avgResponse: "50m", color: "bg-amber-400" },
    { id: "police", name: "Delhi Police", open: 4, slaMissed: 0, avgResponse: "35m", color: "bg-red-600" },
  ]);

  // Sort department function
  const handleSort = (field: keyof DepartmentPerf) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
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
  }, [departments, sortField, sortAsc]);

  // Mock data for Interventions
  const [interventions] = useState<Intervention[]>([
    {
      id: "int-1",
      title: "Sewage Overflow",
      locality: "Near Panchsheel Park",
      severity: "critical",
      time: "2h 25m",
      departments: ["MCD", "DJB"],
      description: "Severe main sewer line leakage causing toxic flood and road blockage at Panchsheel road crossing. Residents complain of contamination threat.",
      status: "pending",
    },
    {
      id: "int-2",
      title: "Garbage Not Collected",
      locality: "Block B, Hanuman Enclave",
      severity: "high",
      time: "4h 10m",
      departments: ["MCD"],
      description: "Overflowing community waste dumpsters not cleared for over 4 days. Strong odor and feral animal accumulation reported by local RWAs.",
      status: "pending",
    },
    {
      id: "int-3",
      title: "Water Leakage",
      locality: "Near Najafgarh Metro Station",
      severity: "medium",
      time: "6h 35m",
      departments: ["DJB"],
      description: "Clean drinking water main pipe rupture near metro pillar 128. Thousands of liters of water wasted on the service lane daily.",
      status: "pending",
    },
    {
      id: "int-4",
      title: "Pothole Risk Zone",
      locality: "Najafgarh Road, Ward 11",
      severity: "critical",
      time: "1h 15m",
      departments: ["PWD"],
      description: "Two massive potholes detected by AI dashcams in high-speed traffic lane. Immediate danger to two-wheeler riders.",
      status: "monitoring",
    },
    {
      id: "int-5",
      title: "Streetlight Blackout",
      locality: "Gopal Nagar Lane 4",
      severity: "medium",
      time: "8h 40m",
      departments: ["Electricity"],
      description: "A continuous stretch of 8 streetlights are completely non-functional. Safety concerns raised by women commuters.",
      status: "monitoring",
    },
    {
      id: "int-6",
      title: "CCTV Blindspot Detected",
      locality: "Prem Nagar Main Crossing",
      severity: "high",
      time: "3h 05m",
      departments: ["Delhi Police"],
      description: "Important security surveillance camera offline due to fiber link failure. High-crime area vulnerable.",
      status: "pending",
    },
    {
      id: "int-7",
      title: "Drain Clogging Alert",
      locality: "Roshampura Market Area",
      severity: "critical",
      time: "30m",
      departments: ["MCD"],
      description: "Monsoon pre-drainage system blocked with plastic waste. Heavy rainfall warning suggests immediate threat of local flash flooding.",
      status: "pending",
    },
  ]);

  // KPI Data structure
  const kpis: KPICardData[] = [
    {
      id: "active",
      label: "Active Complaints",
      value: 142,
      change: "+18.7%",
      isPositive: true,
      comparison: "vs last 7d",
      sparklinePoints: "M0,15 L10,12 L20,18 L30,5 L40,10 L50,15 L60,8 L70,12 L80,5 L90,10 L100,2",
      color: "emerald",
    },
    {
      id: "critical",
      label: "Critical Issues",
      value: 8,
      change: "+33.3%",
      isPositive: false,
      comparison: "vs last 7d",
      sparklinePoints: "M0,18 L10,15 L20,16 L30,10 L40,12 L50,8 L60,10 L70,5 L80,8 L90,2 L100,5",
      color: "red",
      animatePulse: true,
    },
    {
      id: "sla",
      label: "SLA Breached",
      value: 7,
      change: "+16.7%",
      isPositive: false,
      comparison: "vs last 7d",
      sparklinePoints: "M0,15 L10,18 L20,12 L30,15 L40,8 L50,10 L60,5 L70,8 L80,12 L90,5 L100,8",
      color: "amber",
    },
    {
      id: "resolved",
      label: "Resolved Today",
      value: 41,
      change: "+21.1%",
      isPositive: true,
      comparison: "vs yesterday",
      sparklinePoints: "M0,18 L20,15 L40,18 L60,10 L80,12 L100,5",
      color: "teal",
    },
    {
      id: "satisfaction",
      label: "Satisfaction Rate",
      value: 76,
      change: "-2.1%",
      isPositive: false,
      comparison: "vs last 7d",
      sparklinePoints: "M0,5 L20,8 L40,5 L60,12 L80,10 L100,15",
      color: "emerald",
    },
    {
      id: "cctv",
      label: "CCTV AI Detected",
      value: 29,
      change: "+23.4%",
      isPositive: true,
      comparison: "vs last 7d",
      sparklinePoints: "M0,15 L20,12 L40,15 L60,8 L80,10 L100,5",
      color: "emerald",
    },
  ];

  // AI Insights mock list
  const insights: AIInsightItem[] = [
    { text: "42% of complaints originate from Roshampura area.", type: "warning", badge: "Density Alert" },
    { text: "Water related complaints increased by 18% in Najafgarh block.", type: "info", badge: "Trend Alert" },
    { text: "Garbage collection SLA response dropped below target in Hanumangiri.", type: "critical", badge: "SLA Threat" },
    { text: "SLA breaches are concentrated near Najafgarh road junction.", type: "critical", badge: "Delay Warning" },
    { text: "Monsoon clogging risk detected in 3 low-lying colonies.", type: "warning", badge: "Prep alert" },
  ];

  // Councillor Data structure
  const councillorData: CouncillorData = {
    name: "Shashi Yadav",
    role: "Ward Councillor",
    body: "Delhi Municipal Corporation",
    electionYear: "Election 2022",
    party: "BJP",
    partyColor: "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400",
    spouseName: "Om Prakash Yadav",
    profession: "Social Worker",
    age: 31,
    voterCard: "125-Chhawala (SW)",
    complaints: 142,
    resolutionTime: "3h 45m",
    satisfactionRate: "76%",
    wardHealth: 72,
  };

  // Localities breakdown
  const localities: LocalityHealth[] = [
    { name: "Roshampura", count: 28, sev: "High", color: "bg-red-600" },
    { name: "Najafgarh Metro", count: 32, sev: "High", color: "bg-red-600" },
    { name: "Jharoda Kalan", count: 21, sev: "High", color: "bg-red-600" },
    { name: "Dharampura", count: 19, sev: "Medium", color: "bg-amber-400" },
    { name: "Kakrola", count: 13, sev: "Medium", color: "bg-amber-400" },
    { name: "Prem Nagar", count: 14, sev: "Medium", color: "bg-amber-400" },
    { name: "Mitraon", count: 7, sev: "Low", color: "bg-emerald-500" },
    { name: "Gopal Nagar", count: 8, sev: "Low", color: "bg-emerald-500" },
  ];

  // Prediction Outlook chart data
  const predictionData = [
    { name: "06:00", value: 15 },
    { name: "12:00", value: 24 },
    { name: "18:00", value: 38 },
    { name: "24:00", value: 41 },
    { name: "+06h", value: 48 },
    { name: "+12h", value: 55 },
    { name: "+18h", value: 62 },
    { name: "+24h", value: 70 },
  ];

  // Actions submit handler
  const handleActionSubmit = (actionName: string) => {
    setActiveActionModal(null);
    triggerToast(`Success: ${actionName} triggered successfully.`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800 antialiased dark:bg-[#121212] dark:text-slate-100 font-sans">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed bottom-16 right-6 z-[9999] flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <CheckCircle2 size={18} />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              <Landmark size={20} className="text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight sm:text-lg">JanSamadhan</h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">CM Command Center</p>
            </div>
          </div>
          <div className="h-6 border-l border-slate-200 dark:border-zinc-800"></div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
              <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>DELHI OVERVIEW</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <nav aria-label="Breadcrumb" className="flex items-center text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <a className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" href="#">Delhi</a>
            <ChevronRight size={10} className="mx-2 text-slate-400" />
            <a className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" href="#">South West Zone</a>
            <ChevronRight size={10} className="mx-2 text-slate-400" />
            <span className="text-emerald-600 font-bold dark:text-emerald-400">Ward 11 - Najafgarh</span>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400 dark:text-zinc-500" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4 dark:border-zinc-800">
            <Clock size={14} className="text-slate-400 dark:text-zinc-500" />
            <span className="tabular-nums">{timeStr}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-zinc-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
              CM
            </div>
            <span className="hidden sm:inline">CM Delhi</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        {/* KPI Cards Row */}
        <KPIStatsRow kpis={kpis} onCardClick={(id) => triggerToast(`Navigating to details for KPI card: ${id}`)} />

        {/* Central Map & Controls Layout Area */}
        <section className="flex flex-col xl:flex-row gap-3 min-h-0 flex-1">
          {/* Left Sidebar: Map Controls */}
          <MapLayersPanel
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            intensity={intensity}
            onIntensityChange={setIntensity}
          />

          {/* Central Map Section */}
          <MapSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onShowIncidentsClick={() => triggerToast("Incident details refreshed")}
          />

          {/* Right Side Panels: AI Insights & Department Performance */}
          <div className="w-full xl:w-80 shrink-0 flex flex-col gap-3 min-h-0">
            <AIInsightsPanel insights={insights} />
            <DepartmentPerformanceTable
              departments={sortedDepartments}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
              onViewAllClick={() => triggerToast("Opening comprehensive department log...")}
            />
          </div>
        </section>

        {/* Middle Section: Councillor Info & Active Interventions */}
        <section className="flex flex-col lg:flex-row gap-3 min-h-0 shrink-0">
          <CouncillorInfoCard councillor={councillorData} />
          <ActiveInterventionsPanel
            interventions={interventions}
            activeFilter={interventionFilter}
            onFilterChange={setInterventionFilter}
            onReviewClick={setSelectedIntervention}
            onViewAllClick={() => triggerToast("Opening interventions portal...")}
          />
        </section>

        {/* Bottom Data Panels Grid: Health, Breakdown (NEW), Prediction, Workforce, Performance */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 shrink-0">
          <LocalityHealthTable
            localities={localities}
            onViewAnalyticsClick={() => triggerToast("Redirecting to detailed location breakdown...")}
          />
          <ComplaintBreakdownGrid />
          <PredictiveOutlookCard
            data={predictionData}
            expectedGrowth="+12%"
            estimatedSlaMisses={6}
            highRiskHotspots={["Roshampura", "Najafgarh Rd", "Jharoda Kalan"]}
            isDark={isDark}
          />
          <WorkforceStatusCard activePercentage="71%" />
          <WardPerformanceGrid />
        </section>
      </main>

      {/* Footer Controls & Live Ticker */}
      <QuickActionsFooter
        onCallCouncillor={() => setActiveActionModal("call_councillor")}
        onScheduleVisit={() => setActiveActionModal("schedule_visit")}
        onEscalateCommissioner={() => setActiveActionModal("escalate_commissioner")}
        onDeployStaff={() => setActiveActionModal("deploy_staff")}
        onGenerateReport={() => handleActionSubmit("Generate Ward Report")}
        onFiltersClick={() => triggerToast("Filters panel coming soon")}
      />

      {/* MODAL: Active Intervention Review */}
      {selectedIntervention && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <div>
                <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                  selectedIntervention.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-950/40" : "bg-orange-100 text-orange-700 dark:bg-orange-950/40"
                }`}>
                  {selectedIntervention.severity}
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">
                  {selectedIntervention.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{selectedIntervention.locality}</p>
              </div>
              <button
                onClick={() => setSelectedIntervention(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status Overview</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span>Pending Action</span>
                  </div>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs text-slate-500 font-semibold">Active for: {selectedIntervention.time}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Assigned Departments</h4>
                <div className="flex gap-2">
                  {selectedIntervention.departments.map((dept, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center gap-1">
                      <Building2 size={11} /> {dept}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Issue Details</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-semibold">
                  {selectedIntervention.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-3 dark:border-zinc-800 shrink-0">
              <button
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 transition-colors"
                onClick={() => setSelectedIntervention(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors animate-pulse"
                onClick={() => {
                  setSelectedIntervention(null);
                  triggerToast(`Intervention "${selectedIntervention.title}" marked as Reviewed.`);
                }}
              >
                Mark Reviewed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: Call Councillor */}
      {activeActionModal === "call_councillor" && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Call Councillor Shashi Yadav</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect directly to Ward 11 councillor Shashi Yadav for urgent ground support.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-zinc-800/40 text-xs font-bold space-y-1">
                <p className="text-slate-400 text-[9px] uppercase leading-none">Office Phone:</p>
                <p className="text-slate-800 dark:text-white text-sm">+91 9810X XXXXX</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 animate-pulse">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Call Councillor")} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                <Phone size={12} /> Call Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: Schedule Ward Visit */}
      {activeActionModal === "schedule_visit" && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Schedule CM Ward Visit</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Setup a field audit visit for Ward 11 - Najafgarh.
              </p>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-zinc-500">Select Date:</label>
                <input type="date" className="w-full p-2 border border-slate-200 rounded-md text-xs dark:bg-zinc-800 dark:border-zinc-700" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Schedule Visit")} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: Escalate to Commissioner */}
      {activeActionModal === "escalate_commissioner" && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Escalate to Commissioner</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Escalate all active Ward 11 SLA breaches directly to MCD and DJB commissioners for immediate intervention.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Escalate to Commissioner")} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                Escalate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: Deploy Additional Staff */}
      {activeActionModal === "deploy_staff" && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Deploy Additional Staff</h3>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Deploy quick response sanitation and engineering field teams to Ward 11 hotspots.
              </p>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-zinc-500">Select Team size:</label>
                <select className="w-full p-2 border border-slate-200 rounded-md text-xs dark:bg-zinc-800 dark:border-zinc-700">
                  <option>+1 Sanitation Crew (10 workers)</option>
                  <option>+3 Sanitation Crews (30 workers)</option>
                  <option>+1 Water/Sewerage Engineering Team</option>
                  <option>+1 PWD Road Repair Squad</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveActionModal(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                Cancel
              </button>
              <button onClick={() => handleActionSubmit("Staff Deployment")} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
