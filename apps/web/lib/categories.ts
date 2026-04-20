// app/web/lib/categories.ts

export interface ChildCategory {
  id: number;
  name: string;
  parent: number;
  authority: string;
}

export const CHILD_CATEGORIES: Record<number, ChildCategory> = {
  1: { id: 1, name: "Metro Station Issue", parent: 100, authority: "DMRC" },
  2: { id: 2, name: "Metro Track / Safety", parent: 100, authority: "DMRC" },
  3: { id: 3, name: "Escalator / Lift", parent: 100, authority: "DMRC" },
  4: { id: 4, name: "Metro Parking", parent: 100, authority: "DMRC" },
  5: { id: 5, name: "Metro Station Hygiene", parent: 100, authority: "DMRC" },
  6: { id: 6, name: "Metro Property Damage", parent: 100, authority: "DMRC" },
  7: { id: 7, name: "National Highway Damage", parent: 101, authority: "NHAI" },
  8: { id: 8, name: "Toll Plaza Issue", parent: 101, authority: "NHAI" },
  9: { id: 9, name: "Expressway Problem", parent: 101, authority: "NHAI" },
  10: { id: 10, name: "Highway Bridge Damage", parent: 101, authority: "NHAI" },
  11: { id: 11, name: "State Highway / City Road", parent: 101, authority: "PWD" },
  12: { id: 12, name: "Flyover / Overbridge", parent: 101, authority: "PWD" },
  13: { id: 13, name: "Government Building Issue", parent: 109, authority: "PWD" },
  14: { id: 14, name: "Large Drainage System", parent: 101, authority: "PWD" },
  15: { id: 15, name: "Colony Road / Lane", parent: 101, authority: "MCD" },
  16: { id: 16, name: "Garbage Collection", parent: 104, authority: "MCD" },
  17: { id: 17, name: "Street Sweeping", parent: 104, authority: "MCD" },
  18: { id: 18, name: "Park Maintenance", parent: 105, authority: "MCD" },
  19: { id: 19, name: "Public Toilet", parent: 104, authority: "MCD" },
  20: { id: 20, name: "Local Drain / Sewage", parent: 102, authority: "MCD" },
  21: { id: 21, name: "Stray Animals", parent: 104, authority: "MCD" },
  22: { id: 22, name: "Street Light (MCD zone)", parent: 108, authority: "MCD" },
  23: { id: 23, name: "Connaught Place / Lutyens Issue", parent: 110, authority: "NDMC" },
  24: { id: 24, name: "NDMC Road / Infrastructure", parent: 110, authority: "NDMC" },
  25: { id: 25, name: "NDMC Street Light", parent: 108, authority: "NDMC" },
  26: { id: 26, name: "Central Govt Residential Zone", parent: 109, authority: "NDMC" },
  27: { id: 27, name: "Water Supply Failure", parent: 102, authority: "DJB" },
  28: { id: 28, name: "Water Pipe Leakage", parent: 102, authority: "DJB" },
  29: { id: 29, name: "Sewer Line Blockage", parent: 102, authority: "DJB" },
  30: { id: 30, name: "Contaminated Water", parent: 102, authority: "DJB" },
  31: { id: 31, name: "Power Outage", parent: 103, authority: "DISCOM" },
  32: { id: 32, name: "Transformer Issue", parent: 103, authority: "DISCOM" },
  33: { id: 33, name: "Exposed / Fallen Wire", parent: 103, authority: "DISCOM" },
  34: { id: 34, name: "Electricity Pole Damage", parent: 103, authority: "DISCOM" },
  35: { id: 35, name: "Crime / Safety Issue", parent: 106, authority: "DELHI_POLICE" },
  36: { id: 36, name: "Traffic Signal Problem", parent: 106, authority: "TRAFFIC_POLICE" },
  37: { id: 37, name: "Illegal Parking", parent: 106, authority: "TRAFFIC_POLICE" },
  38: { id: 38, name: "Road Accident Black Spot", parent: 106, authority: "TRAFFIC_POLICE" },
  39: { id: 39, name: "Illegal Tree Cutting", parent: 107, authority: "FOREST_DEPT" },
  40: { id: 40, name: "Air Pollution / Burning", parent: 107, authority: "DPCC" },
  41: { id: 41, name: "Noise Pollution", parent: 107, authority: "DPCC" },
  42: { id: 42, name: "Industrial Waste Dumping", parent: 107, authority: "DPCC" },
};

export const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"] as const;
export type SeverityLevel = typeof SEVERITY_LEVELS[number];
