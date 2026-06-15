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
  profession: string;
  age: number;
  voterCard: string;
  complaints: number;
  resolutionTime: string;
  satisfactionRate: string;
  wardHealth: number;
}
