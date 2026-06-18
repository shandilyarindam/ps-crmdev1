export interface DepartmentPerf {
  id: string;
  name: string;
  open: number;
  slaMissed: number;
  avgResponse: string;
  color: string;
}

export interface Intervention {
  id: string;
  title: string;
  locality: string;
  severity: "critical" | "high" | "medium";
  time: string;
  departments: string[];
  description: string;
  status: "pending" | "resolved" | "monitoring";
  /** Optional thumbnail (Delhi "CM Intervention Required" cards). */
  imageUrl?: string;
  /** Optional ward label shown on the card meta line. */
  ward?: string;
  /** Optional zone label shown on the card meta line. */
  zone?: string;
  /** Optional escalation flag, used by the "Escalated" filter tab. */
  escalated?: boolean;
}

/** A filter tab for the interventions panel. */
export interface InterventionTab {
  id: string;
  label: string;
  /** Optional predicate; if omitted, "all" shows everything. */
  match?: (item: Intervention) => boolean;
}

/** Summary of a single Delhi administrative zone (Delhi overview). */
export interface ZoneSummary {
  id: string;
  code: string; // e.g. "04"
  name: string; // e.g. "Central"
  activeComplaints: number;
  criticalIssues: number;
  slaBreached: number;
  slaCompliance: number;
  healthScore: number; // 0-100
  severity: "high" | "medium" | "low";
  dotColor: string; // tailwind bg-* class
}

/** Summary of a single ward within a zone (Zone view). */
export interface WardSummary {
  id: string;
  number: number;
  name: string;
  zoneId: string;
  complaints: number;
  severity: "high" | "medium" | "low";
  color: string; // tailwind bg-* class
}

/** A configurable quick-action button shown in the footer. */
export interface QuickAction {
  id: string;
  label: string;
  icon: "phone" | "calendar" | "escalate" | "deploy" | "report" | "workforce" | "review";
  color: "emerald" | "red" | "blue";
}

/** Per-zone score chip used by the Delhi Health Score strip. */
export interface ZoneScore {
  name: string;
  score: number;
  dotColor: string; // tailwind bg-* class
}

export interface LocalityHealth {
  name: string;
  count: number;
  sev: string;
  color: string;
}

export interface AIInsightItem {
  text: string;
  type: "critical" | "warning" | "info";
  badge: string;
}

export interface KPICardData {
  id: string;
  label: string;
  value: number;
  change: string;
  isPositive: boolean;
  comparison: string;
  sparklinePoints: string;
  color: "emerald" | "red" | "amber" | "teal" | "blue";
  animatePulse?: boolean;
}

export interface ComplaintCategory {
  name: string;
  count: number;
  iconName: "garbage" | "water" | "roads" | "streetlights" | "sewage" | "others";
  colorClass: string;
}

export interface WorkforceTeam {
  title: string;
  count: number;
  iconName: "trash" | "check" | "droplet" | "zap";
}

export interface WorkforceStatusData {
  name: string;
  value: number;
  color: string;
}

export interface WardMetric {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  comparison?: string;
}

export interface CouncillorData {
  name: string;
  role: string;
  body: string;
  electionYear: string;
  party: string;
  partyColor: string;
  spouseName: string;
  profession?: string;
  age: number;
  voterCard: string;
  complaints: number;
  resolutionTime: string;
  satisfactionRate: string;
  wardHealth: number;
  voterSerial?: number;
  voterPart?: number;
  education?: string;
  criminalCases?: number;
  assets?: string;
  liabilities?: string;
  phone?: string;
}
