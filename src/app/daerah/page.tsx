"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Search,
  Server,
  Box,
  HardDrive,
  Activity,
  TowerControl,
  Cable,
  ChevronRight,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Loading from "@/components/Loading";
import Toast from "@/components/Toast";
import { Region, sumCategory } from "@/types";
import { formatNumber, formatMeter, formatDateTime } from "@/lib/format";

export default function DaerahPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );

  const load = () => {
    setLoading(true);
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => setRegions(d.regions || []))
      .catch(() => setToast({ message: "Gagal memuat data", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = regions.filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      (r.code || "").toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Hapus daerah "${name}" beserta seluruh riwayat transaksi? Tindakan ini tidak dapat dibatalkan.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/regions/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal hapus");
      setToast({ message: `Daerah ${name} berhasil dihapus`, type: "success" });
      load();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Gagal hapus",
        type: "error",
      });
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Data Daerah"
        description="Daftar wilayah yang sudah terdata. Klik daerah untuk melihat detail total dan riwayat penggelaran."
        actions={
          <Link href="/input?mode=new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Tambah Daerah
          </Link>
        }
      />

      <div className="card p-4 mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Cari nama atau kode daerah..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            {q ? "Tidak ada daerah yang cocok" : "Belum ada data daerah"}
          </p>
          <Link href="/input?mode=new" className="btn-primary mt-4 inline-flex">
            <Plus className="h-4 w-4" />
            Input Daerah Baru
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const olt = sumCategory(r.totals, "perangkat_aktif");
            const odp = sumCategory(r.totals, "odp");
            const odc = sumCategory(r.totals, "odc");
            const jb = sumCategory(r.totals, "jb");
            const tiang = sumCategory(r.totals, "tiang");
            const kabel = sumCategory(r.totals, "kabel_adss");

            return (
              <div
                key={r.id}
                className="card group hover:shadow-soft transition-all overflow-hidden"
              >
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/daerah/${r.id}`}
                          className="text-base font-bold text-slate-900 hover:text-brand-700 truncate block"
                        >
                          {r.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.code ? `${r.code} · ` : ""}
                          Update {formatDateTime(r.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id, r.name)}
                      className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                      title="Hapus daerah"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {r.description && (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                </div>

                <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                  <MiniStat icon={Server} label="OLT" value={olt} color="#1a7bf5" />
                  <MiniStat icon={Box} label="ODP" value={odp} color="#10b981" />
                  <MiniStat icon={HardDrive} label="ODC" value={odc} color="#8b5cf6" />
                  <MiniStat icon={Activity} label="JB" value={jb} color="#ef4444" />
                  <MiniStat icon={TowerControl} label="Tiang" value={tiang} color="#f59e0b" />
                  <MiniStat
                    icon={Cable}
                    label="Kabel"
                    value={formatMeter(kabel)}
                    color="#06b6d4"
                    raw
                  />
                </div>

                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
                  <Link
                    href={`/input?regionId=${r.id}`}
                    className="text-xs font-semibold text-accent-600 hover:text-accent-700"
                  >
                    + Update data
                  </Link>
                  <Link
                    href={`/daerah/${r.id}`}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    Detail <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  raw,
}: {
  icon: typeof Server;
  label: string;
  value: number | string;
  color: string;
  raw?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="h-3 w-3" style={{ color }} />
        <span className="text-[10px] font-semibold uppercase text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold text-slate-800 tabular-nums">
        {raw ? value : formatNumber(value as number)}
      </p>
    </div>
  );
}
