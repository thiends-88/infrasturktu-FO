"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { History, Filter, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Loading from "@/components/Loading";
import { Region, Transaction, TransactionType } from "@/types";
import {
  formatNumber,
  formatDate,
  formatDateTime,
  TX_TYPE_LABELS,
  TX_TYPE_COLORS,
  deltaLabel,
} from "@/lib/format";

type TxRow = Transaction & { regionName: string };

function RiwayatInner() {
  const searchParams = useSearchParams();
  const presetRegion = searchParams.get("regionId") || "";

  const [regions, setRegions] = useState<Region[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionId, setRegionId] = useState(presetRegion);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => setRegions(d.regions || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = regionId
      ? `/api/transactions?regionId=${regionId}`
      : "/api/transactions";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .finally(() => setLoading(false));
  }, [regionId]);

  const filtered = transactions.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (q) {
      const hay = `${t.regionName} ${t.note || ""} ${t.operator || ""} ${t.changes
        .map((c) => c.label)
        .join(" ")}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Riwayat Transaksi"
        description="Semua input, penambahan, maintenance, dan koreksi data infrastruktur FO. Setiap perubahan mencatat tanggal dan total sebelum/sesudah."
      />

      <div className="card p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Cari catatan, item, operator..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                className="input pl-9 min-w-[160px]"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              >
                <option value="">Semua daerah</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              className="input min-w-[150px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | "")}
            >
              <option value="">Semua jenis</option>
              {(Object.keys(TX_TYPE_LABELS) as TransactionType[]).map((t) => (
                <option key={t} value={t}>
                  {TX_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Tidak ada riwayat ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="card overflow-hidden hover:shadow-soft transition">
              <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/40">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${TX_TYPE_COLORS[t.type]}`}>
                      {TX_TYPE_LABELS[t.type]}
                    </span>
                    <Link
                      href={`/daerah/${t.regionId}`}
                      className="text-sm font-bold text-brand-700 hover:underline"
                    >
                      {t.regionName}
                    </Link>
                    <span className="text-sm text-slate-500">· {formatDate(t.date)}</span>
                  </div>
                  {t.note && (
                    <p className="text-sm text-slate-600 mt-1.5">{t.note}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Diinput {formatDateTime(t.createdAt)}
                    {t.operator ? ` · ${t.operator}` : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {t.changes.length} item berubah
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-2 font-semibold">Item</th>
                      <th className="px-3 py-2 font-semibold text-right">Sebelum</th>
                      <th className="px-3 py-2 font-semibold text-right">Perubahan</th>
                      <th className="px-5 py-2 font-semibold text-right">Sesudah (Total)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {t.changes.map((c) => (
                      <tr key={c.key}>
                        <td className="px-5 py-2 font-medium text-slate-700">{c.label}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {formatNumber(c.before)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right tabular-nums font-bold ${
                            c.delta > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {deltaLabel(c.delta)}
                        </td>
                        <td className="px-5 py-2 text-right tabular-nums font-bold text-slate-900">
                          {formatNumber(c.after)}{" "}
                          <span className="text-xs font-medium text-slate-400">
                            {c.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RiwayatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RiwayatInner />
    </Suspense>
  );
}
