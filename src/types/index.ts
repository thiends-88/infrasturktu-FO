/** Kategori & item infrastruktur FO */
export type EquipmentCategory =
  | "perangkat_aktif"
  | "tiang"
  | "odp"
  | "odc"
  | "jb"
  | "kabel_adss";

export interface EquipmentItemDef {
  key: string;
  label: string;
  unit: string;
  category: EquipmentCategory;
}

/** Definisi master semua item yang bisa diinput */
export const EQUIPMENT_DEFS: EquipmentItemDef[] = [
  // Perangkat Aktif
  { key: "olt_c300", label: "OLT C300", unit: "UNIT", category: "perangkat_aktif" },
  { key: "olt_c320", label: "OLT C320", unit: "UNIT", category: "perangkat_aktif" },
  { key: "olt_hsgq_8", label: "OLT HSGQ GPON 8 PORT", unit: "UNIT", category: "perangkat_aktif" },
  { key: "olt_hsgq_4", label: "OLT HSGQ GPON 4 PORT", unit: "UNIT", category: "perangkat_aktif" },
  // Tiang
  { key: "tiang_7m", label: "Tiang 7 Meter", unit: "BATANG", category: "tiang" },
  { key: "tiang_9m", label: "Tiang 9 Meter", unit: "BATANG", category: "tiang" },
  // ODP
  { key: "odp_24", label: "ODP 24", unit: "UNIT", category: "odp" },
  { key: "odp_16", label: "ODP 16", unit: "UNIT", category: "odp" },
  { key: "odp_8", label: "ODP 8", unit: "UNIT", category: "odp" },
  // ODC
  { key: "odc_576", label: "ODC 576", unit: "UNIT", category: "odc" },
  { key: "odc_144", label: "ODC 144", unit: "UNIT", category: "odc" },
  { key: "odc_96", label: "ODC 96", unit: "UNIT", category: "odc" },
  { key: "odc_48", label: "ODC 48", unit: "UNIT", category: "odc" },
  // JB
  { key: "jb_48", label: "JB 48", unit: "UNIT", category: "jb" },
  { key: "jb_24", label: "JB 24", unit: "UNIT", category: "jb" },
  { key: "jb_12", label: "JB 12", unit: "UNIT", category: "jb" },
  // Kabel ADSS
  { key: "adss_96", label: "ADSS 96 CORE", unit: "METER", category: "kabel_adss" },
  { key: "adss_48", label: "ADSS 48 CORE", unit: "METER", category: "kabel_adss" },
  { key: "adss_24", label: "ADSS 24 CORE", unit: "METER", category: "kabel_adss" },
  { key: "adss_12", label: "ADSS 12 CORE", unit: "METER", category: "kabel_adss" },
  { key: "figure8_12", label: "FIGURE 8 12 CORE", unit: "METER", category: "kabel_adss" },
  { key: "figure8_6", label: "FIGURE 8 6 CORE", unit: "METER", category: "kabel_adss" },
];

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  perangkat_aktif: "Perangkat Aktif",
  tiang: "Tiang",
  odp: "ODP",
  odc: "ODC",
  jb: "JB (Joint Box)",
  kabel_adss: "Kabel ADSS / Figure-8",
};

export const CATEGORY_COLORS: Record<EquipmentCategory, string> = {
  perangkat_aktif: "#1a7bf5",
  tiang: "#f59e0b",
  odp: "#10b981",
  odc: "#8b5cf6",
  jb: "#ef4444",
  kabel_adss: "#06b6d4",
};

/** Quantity map: equipment key -> number */
export type QuantityMap = Record<string, number>;

export type TransactionType = "initial" | "penambahan" | "pengurangan" | "maintenance" | "koreksi";

export interface TransactionChange {
  key: string;
  label: string;
  unit: string;
  delta: number;
  before: number;
  after: number;
}

export interface Transaction {
  id: string;
  regionId: string;
  type: TransactionType;
  date: string; // ISO date YYYY-MM-DD
  createdAt: string; // ISO datetime
  note?: string;
  changes: TransactionChange[];
  operator?: string;
}

export interface Region {
  id: string;
  name: string;
  code?: string;
  description?: string;
  /** Total kumulatif saat ini per item */
  totals: QuantityMap;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  regions: Region[];
  transactions: Transaction[];
  users?: User[];
}

export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string; // scrypt hash
  salt: string;
  createdAt: string;
}

export type SafeUser = Omit<User, "passwordHash" | "salt">;


export interface DashboardStats {
  totalRegions: number;
  totalOlt: number;
  totalOdp: number;
  totalOdc: number;
  totalJb: number;
  totalTiang: number;
  totalKabelMeter: number;
  recentTransactions: Transaction[];
  byRegion: {
    id: string;
    name: string;
    olt: number;
    odp: number;
    odc: number;
    jb: number;
    tiang: number;
    kabel: number;
  }[];
  monthlyActivity: { month: string; count: number; additions: number }[];
}

export function emptyQuantities(): QuantityMap {
  const q: QuantityMap = {};
  for (const d of EQUIPMENT_DEFS) q[d.key] = 0;
  return q;
}

export function sumCategory(totals: QuantityMap, category: EquipmentCategory): number {
  return EQUIPMENT_DEFS.filter((d) => d.category === category).reduce(
    (s, d) => s + (totals[d.key] || 0),
    0
  );
}

export function getDef(key: string): EquipmentItemDef | undefined {
  return EQUIPMENT_DEFS.find((d) => d.key === key);
}
