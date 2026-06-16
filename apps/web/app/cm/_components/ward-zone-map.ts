// Curated zone metadata configuration for the CM dashboard map.
// Sourced from official MCD 2022 zone administrative setup.

export type ZoneId =
  | "central"
  | "city-sp"
  | "civil-lines"
  | "najafgarh"
  | "karol-bagh"
  | "keshav-puram"
  | "narela"
  | "rohini"
  | "shahdara-north"
  | "shahdara-south"
  | "south"
  | "west"
  | "unzoned";

export interface ZoneDef {
  id: ZoneId;
  /** Display name shown in the header / breadcrumb. */
  name: string;
  /** Identity color (hex) for the zone outline / legend. */
  color: string;
}

export const ZONES: ZoneDef[] = [
  { id: "central", name: "Central", color: "#6366f1" },
  { id: "city-sp", name: "City-SP", color: "#ef4444" },
  { id: "civil-lines", name: "Civil Lines", color: "#f59e0b" },
  { id: "najafgarh", name: "Najafgarh", color: "#14b8a6" },
  { id: "karol-bagh", name: "Karol Bagh", color: "#f97316" },
  { id: "keshav-puram", name: "Keshav Puram", color: "#10b981" },
  { id: "narela", name: "Narela", color: "#84cc16" },
  { id: "rohini", name: "Rohini", color: "#22c55e" },
  { id: "shahdara-north", name: "North Shahdara", color: "#a855f7" },
  { id: "shahdara-south", name: "South Shahdara", color: "#ec4899" },
  { id: "south", name: "South", color: "#3b82f6" },
  { id: "west", name: "West", color: "#06b6d4" },
];

export const UNZONED: ZoneDef = { id: "unzoned", name: "Unzoned", color: "#94a3b8" };

export const ZONE_BY_ID: Record<string, ZoneDef> = Object.fromEntries(
  [...ZONES, UNZONED].map((z) => [z.id, z])
);
