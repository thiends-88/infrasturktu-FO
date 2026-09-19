import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  AppData,
  DashboardStats,
  EQUIPMENT_DEFS,
  QuantityMap,
  Region,
  Transaction,
  TransactionType,
  User,
  emptyQuantities,
  getDef,
  sumCategory,
} from "@/types";
import { hashPassword } from "./auth";

const DATA_PATH = path.join(process.cwd(), "data", "db.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    const seed = createSeedData();
    await fs.writeFile(DATA_PATH, JSON.stringify(seed, null, 2), "utf-8");
  }
}

function createSeedData(): AppData {
  const now = new Date().toISOString();
  const solokId = uuidv4();
  const padangId = uuidv4();
  const bukittinggiId = uuidv4();

  const solokTotals = emptyQuantities();
  solokTotals.olt_c300 = 2;
  solokTotals.olt_c320 = 1;
  solokTotals.tiang_7m = 120;
  solokTotals.tiang_9m = 85;
  solokTotals.odp_24 = 40;
  solokTotals.odp_16 = 35;
  solokTotals.odp_8 = 25;
  solokTotals.odc_144 = 3;
  solokTotals.odc_96 = 5;
  solokTotals.odc_48 = 8;
  solokTotals.jb_48 = 12;
  solokTotals.jb_24 = 18;
  solokTotals.adss_48 = 15000;
  solokTotals.adss_24 = 8000;
  solokTotals.adss_12 = 5000;
  solokTotals.figure8_12 = 2000;

  const padangTotals = emptyQuantities();
  padangTotals.olt_c300 = 5;
  padangTotals.olt_c320 = 3;
  padangTotals.olt_hsgq_8 = 2;
  padangTotals.tiang_7m = 300;
  padangTotals.tiang_9m = 250;
  padangTotals.odp_24 = 150;
  padangTotals.odp_16 = 120;
  padangTotals.odp_8 = 80;
  padangTotals.odc_576 = 2;
  padangTotals.odc_144 = 8;
  padangTotals.odc_96 = 12;
  padangTotals.jb_48 = 40;
  padangTotals.jb_24 = 55;
  padangTotals.jb_12 = 30;
  padangTotals.adss_96 = 25000;
  padangTotals.adss_48 = 40000;
  padangTotals.adss_24 = 20000;
  padangTotals.figure8_12 = 8000;
  padangTotals.figure8_6 = 3000;

  const btTotals = emptyQuantities();
  btTotals.olt_c320 = 2;
  btTotals.olt_hsgq_4 = 1;
  btTotals.tiang_7m = 90;
  btTotals.tiang_9m = 60;
  btTotals.odp_24 = 30;
  btTotals.odp_16 = 25;
  btTotals.odp_8 = 20;
  btTotals.odc_96 = 4;
  btTotals.odc_48 = 6;
  btTotals.jb_24 = 15;
  btTotals.jb_12 = 10;
  btTotals.adss_48 = 10000;
  btTotals.adss_24 = 6000;
  btTotals.adss_12 = 4000;

  const regions: Region[] = [
    {
      id: solokId,
      name: "Kota Solok",
      code: "SLK",
      description: "Wilayah Kota Solok dan sekitarnya",
      totals: solokTotals,
      createdAt: "2025-01-15T08:00:00.000Z",
      updatedAt: now,
    },
    {
      id: padangId,
      name: "Kota Padang",
      code: "PDG",
      description: "Wilayah Kota Padang",
      totals: padangTotals,
      createdAt: "2025-01-10T08:00:00.000Z",
      updatedAt: now,
    },
    {
      id: bukittinggiId,
      name: "Kota Bukittinggi",
      code: "BKT",
      description: "Wilayah Kota Bukittinggi",
      totals: btTotals,
      createdAt: "2025-02-01T08:00:00.000Z",
      updatedAt: now,
    },
  ];

  const mkTx = (
    regionId: string,
    type: TransactionType,
    date: string,
    note: string,
    deltas: Record<string, number>,
    base: QuantityMap
  ): Transaction => {
    const changes = Object.entries(deltas)
      .filter(([, d]) => d !== 0)
      .map(([key, delta]) => {
        const def = getDef(key)!;
        const before = (base[key] || 0) - delta;
        return {
          key,
          label: def.label,
          unit: def.unit,
          delta,
          before: Math.max(0, before),
          after: base[key] || 0,
        };
      });
    return {
      id: uuidv4(),
      regionId,
      type,
      date,
      createdAt: `${date}T10:00:00.000Z`,
      note,
      changes,
      operator: "Admin",
    };
  };

  const transactions: Transaction[] = [
    mkTx(solokId, "initial", "2025-01-15", "Data awal penggelaran Kota Solok", solokTotals, solokTotals),
    mkTx(padangId, "initial", "2025-01-10", "Data awal penggelaran Kota Padang", padangTotals, padangTotals),
    mkTx(bukittinggiId, "initial", "2025-02-01", "Data awal penggelaran Kota Bukittinggi", btTotals, btTotals),
    {
      id: uuidv4(),
      regionId: solokId,
      type: "penambahan",
      date: "2025-03-12",
      createdAt: "2025-03-12T14:30:00.000Z",
      note: "Penambahan ODP area Talang",
      operator: "Teknisi FO",
      changes: [
        { key: "odp_24", label: "ODP 24", unit: "UNIT", delta: 5, before: 35, after: 40 },
        { key: "adss_24", label: "ADSS 24 CORE", unit: "METER", delta: 1500, before: 6500, after: 8000 },
      ],
    },
    {
      id: uuidv4(),
      regionId: padangId,
      type: "maintenance",
      date: "2025-04-05",
      createdAt: "2025-04-05T09:15:00.000Z",
      note: "Maintenance ODC & penambahan JB",
      operator: "Tim Maintenance",
      changes: [
        { key: "jb_24", label: "JB 24", unit: "UNIT", delta: 5, before: 50, after: 55 },
      ],
    },
    {
      id: uuidv4(),
      regionId: padangId,
      type: "penambahan",
      date: "2025-06-20",
      createdAt: "2025-06-20T11:00:00.000Z",
      note: "Ekspansi FO Kuranji",
      operator: "Admin",
      changes: [
        { key: "odp_16", label: "ODP 16", unit: "UNIT", delta: 20, before: 100, after: 120 },
        { key: "tiang_9m", label: "Tiang 9 Meter", unit: "BATANG", delta: 30, before: 220, after: 250 },
        { key: "adss_48", label: "ADSS 48 CORE", unit: "METER", delta: 5000, before: 35000, after: 40000 },
      ],
    },
  ];

  return { regions, transactions };
}

export async function readData(): Promise<AppData> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const data = JSON.parse(raw) as AppData;
  if (!data.users || data.users.length === 0) {
    const adminPass = hashPassword("admin123");
    const defaultAdmin: User = {
      id: uuidv4(),
      username: "admin",
      name: "Administrator",
      role: "admin",
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      createdAt: new Date().toISOString(),
    };
    data.users = [defaultAdmin];
    await writeData(data);
  }
  return data;
}

async function writeData(data: AppData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function getRegions(): Promise<Region[]> {
  const data = await readData();
  return data.regions.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRegion(id: string): Promise<Region | null> {
  const data = await readData();
  return data.regions.find((r) => r.id === id) || null;
}

export async function createRegion(input: {
  name: string;
  code?: string;
  description?: string;
  quantities?: QuantityMap;
  date?: string;
  note?: string;
  operator?: string;
}): Promise<{ region: Region; transaction?: Transaction }> {
  const data = await readData();
  const name = input.name.trim();
  if (!name) throw new Error("Nama daerah wajib diisi");
  if (data.regions.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Daerah dengan nama tersebut sudah ada");
  }

  const now = new Date().toISOString();
  const totals = emptyQuantities();
  const qty = input.quantities || {};
  for (const d of EQUIPMENT_DEFS) {
    totals[d.key] = Math.max(0, Number(qty[d.key]) || 0);
  }

  const region: Region = {
    id: uuidv4(),
    name,
    code: input.code?.trim() || undefined,
    description: input.description?.trim() || undefined,
    totals,
    createdAt: now,
    updatedAt: now,
  };

  data.regions.push(region);

  let transaction: Transaction | undefined;
  const hasAny = Object.values(totals).some((v) => v > 0);
  if (hasAny) {
    const date = input.date || now.slice(0, 10);
    transaction = {
      id: uuidv4(),
      regionId: region.id,
      type: "initial",
      date,
      createdAt: now,
      note: input.note || "Data awal penggelaran",
      operator: input.operator || "Admin",
      changes: EQUIPMENT_DEFS.filter((d) => totals[d.key] > 0).map((d) => ({
        key: d.key,
        label: d.label,
        unit: d.unit,
        delta: totals[d.key],
        before: 0,
        after: totals[d.key],
      })),
    };
    data.transactions.push(transaction);
  }

  await writeData(data);
  return { region, transaction };
}

export async function updateRegionMeta(
  id: string,
  input: { name?: string; code?: string; description?: string }
): Promise<Region> {
  const data = await readData();
  const idx = data.regions.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Daerah tidak ditemukan");

  if (input.name) {
    const name = input.name.trim();
    if (
      data.regions.some(
        (r) => r.id !== id && r.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new Error("Daerah dengan nama tersebut sudah ada");
    }
    data.regions[idx].name = name;
  }
  if (input.code !== undefined) data.regions[idx].code = input.code.trim() || undefined;
  if (input.description !== undefined)
    data.regions[idx].description = input.description.trim() || undefined;
  data.regions[idx].updatedAt = new Date().toISOString();

  await writeData(data);
  return data.regions[idx];
}

export async function deleteRegion(id: string): Promise<void> {
  const data = await readData();
  data.regions = data.regions.filter((r) => r.id !== id);
  data.transactions = data.transactions.filter((t) => t.regionId !== id);
  await writeData(data);
}

export async function addTransaction(input: {
  regionId: string;
  type: TransactionType;
  date: string;
  note?: string;
  operator?: string;
  /** Delta per item (bisa negatif untuk pengurangan) */
  deltas: QuantityMap;
}): Promise<{ region: Region; transaction: Transaction }> {
  const data = await readData();
  const idx = data.regions.findIndex((r) => r.id === input.regionId);
  if (idx < 0) throw new Error("Daerah tidak ditemukan");

  const region = data.regions[idx];
  const changes: Transaction["changes"] = [];
  const now = new Date().toISOString();

  for (const d of EQUIPMENT_DEFS) {
    const delta = Number(input.deltas[d.key]) || 0;
    if (delta === 0) continue;
    const before = region.totals[d.key] || 0;
    const after = before + delta;
    if (after < 0) {
      throw new Error(
        `Jumlah ${d.label} tidak boleh negatif (saat ini ${before}, delta ${delta})`
      );
    }
    region.totals[d.key] = after;
    changes.push({
      key: d.key,
      label: d.label,
      unit: d.unit,
      delta,
      before,
      after,
    });
  }

  if (changes.length === 0) {
    throw new Error("Tidak ada perubahan data. Isi minimal satu item.");
  }

  const transaction: Transaction = {
    id: uuidv4(),
    regionId: region.id,
    type: input.type,
    date: input.date || now.slice(0, 10),
    createdAt: now,
    note: input.note?.trim() || undefined,
    operator: input.operator?.trim() || "Admin",
    changes,
  };

  region.updatedAt = now;
  data.transactions.push(transaction);
  await writeData(data);
  return { region, transaction };
}

export async function getTransactions(filters?: {
  regionId?: string;
  limit?: number;
}): Promise<(Transaction & { regionName: string })[]> {
  const data = await readData();
  const regionMap = new Map(data.regions.map((r) => [r.id, r.name]));
  let list = data.transactions
    .map((t) => ({
      ...t,
      regionName: regionMap.get(t.regionId) || "—",
    }))
    .sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return b.createdAt.localeCompare(a.createdAt);
    });

  if (filters?.regionId) {
    list = list.filter((t) => t.regionId === filters.regionId);
  }
  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }
  return list;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const data = await readData();
  const regions = data.regions;

  const sumKey = (keys: string[]) =>
    regions.reduce(
      (s, r) => s + keys.reduce((a, k) => a + (r.totals[k] || 0), 0),
      0
    );

  const oltKeys = EQUIPMENT_DEFS.filter((d) => d.category === "perangkat_aktif").map(
    (d) => d.key
  );
  const odpKeys = EQUIPMENT_DEFS.filter((d) => d.category === "odp").map((d) => d.key);
  const odcKeys = EQUIPMENT_DEFS.filter((d) => d.category === "odc").map((d) => d.key);
  const jbKeys = EQUIPMENT_DEFS.filter((d) => d.category === "jb").map((d) => d.key);
  const tiangKeys = EQUIPMENT_DEFS.filter((d) => d.category === "tiang").map((d) => d.key);
  const kabelKeys = EQUIPMENT_DEFS.filter((d) => d.category === "kabel_adss").map(
    (d) => d.key
  );

  const byRegion = regions
    .map((r) => ({
      id: r.id,
      name: r.name,
      olt: sumCategory(r.totals, "perangkat_aktif"),
      odp: sumCategory(r.totals, "odp"),
      odc: sumCategory(r.totals, "odc"),
      jb: sumCategory(r.totals, "jb"),
      tiang: sumCategory(r.totals, "tiang"),
      kabel: sumCategory(r.totals, "kabel_adss"),
    }))
    .sort((a, b) => b.odp - a.odp);

  // Monthly activity last 12 months
  const months: { month: string; count: number; additions: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    const txs = data.transactions.filter((t) => t.date.startsWith(key));
    const additions = txs.reduce(
      (s, t) => s + t.changes.filter((c) => c.delta > 0).reduce((a, c) => a + c.delta, 0),
      0
    );
    months.push({ month: label, count: txs.length, additions });
  }

  const recent = [...data.transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  return {
    totalRegions: regions.length,
    totalOlt: sumKey(oltKeys),
    totalOdp: sumKey(odpKeys),
    totalOdc: sumKey(odcKeys),
    totalJb: sumKey(jbKeys),
    totalTiang: sumKey(tiangKeys),
    totalKabelMeter: sumKey(kabelKeys),
    recentTransactions: recent,
    byRegion,
    monthlyActivity: months,
  };
}

export async function getReport(regionId?: string) {
  const data = await readData();
  const regions = regionId
    ? data.regions.filter((r) => r.id === regionId)
    : data.regions;

  return regions.map((r) => {
    const categories = (
      ["perangkat_aktif", "tiang", "odp", "odc", "jb", "kabel_adss"] as const
    ).map((cat) => ({
      category: cat,
      items: EQUIPMENT_DEFS.filter((d) => d.category === cat).map((d) => ({
        key: d.key,
        label: d.label,
        unit: d.unit,
        total: r.totals[d.key] || 0,
      })),
      subtotal: sumCategory(r.totals, cat),
    }));

    const history = data.transactions
      .filter((t) => t.regionId === r.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      region: r,
      categories,
      history,
      summary: {
        olt: sumCategory(r.totals, "perangkat_aktif"),
        tiang: sumCategory(r.totals, "tiang"),
        odp: sumCategory(r.totals, "odp"),
        odc: sumCategory(r.totals, "odc"),
        jb: sumCategory(r.totals, "jb"),
        kabel: sumCategory(r.totals, "kabel_adss"),
      },
    };
  });
}

export async function getUsers(): Promise<User[]> {
  const data = await readData();
  return data.users || [];
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const data = await readData();
  const u = (data.users || []).find(
    (user) => user.username.toLowerCase() === username.trim().toLowerCase()
  );
  return u || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const data = await readData();
  const u = (data.users || []).find((user) => user.id === id);
  return u || null;
}

export async function createUser(input: {
  username: string;
  name: string;
  password: string;
  role: "admin" | "staff";
}): Promise<User> {
  const data = await readData();
  data.users = data.users || [];

  const username = input.username.trim();
  if (!username) throw new Error("Username wajib diisi");
  if (!input.name.trim()) throw new Error("Nama lengkap wajib diisi");
  if (!input.password) {
    throw new Error("Password wajib diisi");
  }

  if (data.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username sudah digunakan");
  }

  const { hash, salt } = hashPassword(input.password);
  const newUser: User = {
    id: uuidv4(),
    username,
    name: input.name.trim(),
    role: input.role === "admin" ? "admin" : "staff",
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  await writeData(data);
  return newUser;
}

export async function deleteUser(id: string, currentUserId: string): Promise<void> {
  const data = await readData();
  data.users = data.users || [];

  if (id === currentUserId) {
    throw new Error("Tidak dapat menghapus akun sendiri yang sedang aktif");
  }

  const target = data.users.find((u) => u.id === id);
  if (!target) throw new Error("User tidak ditemukan");

  const adminCount = data.users.filter((u) => u.role === "admin").length;
  if (target.role === "admin" && adminCount <= 1) {
    throw new Error("Tidak dapat menghapus admin terakhir pada sistem");
  }

  data.users = data.users.filter((u) => u.id !== id);
  await writeData(data);
}

export async function updateUser(
  id: string,
  input: {
    name?: string;
    role?: "admin" | "staff";
    password?: string;
  },
  currentUserId?: string
): Promise<User> {
  const data = await readData();
  data.users = data.users || [];
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("User tidak ditemukan");

  if (input.name && input.name.trim()) {
    data.users[idx].name = input.name.trim();
  }

  if (input.role) {
    // If demoting an admin, ensure not the last admin
    if (data.users[idx].role === "admin" && input.role !== "admin") {
      const adminCount = data.users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) {
        throw new Error("Sistem harus memiliki setidaknya satu admin");
      }
    }
    data.users[idx].role = input.role;
  }

  if (input.password) {
    const { hash, salt } = hashPassword(input.password);
    data.users[idx].passwordHash = hash;
    data.users[idx].salt = salt;
  }

  await writeData(data);
  return data.users[idx];
}
