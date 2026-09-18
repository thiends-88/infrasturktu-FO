"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PlusCircle,
  FileBarChart2,
  MapPin,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Loading from "@/components/Loading";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EQUIPMENT_DEFS,
  EquipmentCategory,
  Region,
  Transaction,
  sumCategory,
} from "@/types";
import {
  formatNumber,
  formatMeter,
  formatDate,
  formatDateTime,
  TX_TYPE_LABELS,
  TX_TYPE_COLORS,
  deltaLabel,
} from "@/lib/format";

const CATS: EquipmentCategory[] = [
  "perangkat_aktif",
  "tiang",
  "odp",
  "odc",
  "jb",
  "kabel_adss",
];

export default function DaerahDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [region, setRegion] = useState<Region | null>(null);
  const [transactions, setTransactions] = useState<
    (Transaction & { regionName: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/regions/${id}`).then((r) => r.json()),
      fetch(`/api/transactions?regionId=${id}`).then((r) => r.json()),
    ])
      .then(([rd, td]) => {
        if (rd.error) throw new Error(rd.error);
        setRegion(rd.region);
        setTransactions(td.transactions || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error || !region)
    return (
      <div className="card p-8 text-center">
        <p className="text-rose-600 mb-4">{error || "Daerah tidak ditemukan"}</p>
        <Link href="/daerah" className="btn-secondary">
          Kembali
        </Link>
      </div>
    );

  return (
    <div>
      <Link
        href="/daerah"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 mb-4 font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Data Daerah
      </Link>

      <PageHeader
        title={region.name}
        description={
          [
            region.code && `Kode: ${region.code}`,
            region.description,
            `Dibuat ${formatDateTime(region.createdAt)} · Update terakhir ${formatDateTime(region.updatedAt)}`,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        actions={
          <>
            <Link href={`/input?regionId=${region.id}`} className="btn-primary">
              <PlusCircle className="h-4 w-4" />
              Update / Tambah
            </Link>
            <Link href={`/laporan?regionId=${region.id}`} className="btn-secondary">
              <FileBarChart2 className="h-4 w-4" />
              Laporan
            </Link>
          </>
        }
      />

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {CATS.map((cat) => {
          const total = sumCategory(region.totals, cat);
          const isKabel = cat === "kabel_adss";
          return (
            <div key={cat} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_COLORS[cat] }}
                />
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {CATEGORY_LABELS[cat]}
                </p>
              </div>
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                {isKabel ? formatMeter(total) : formatNumber(total)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Detail per kategori */}
      <div className="space-y-4 mb-8">
        {CATS.map((cat) => {
          const items = EQUIPMENT_DEFS.filter((d) => d.category === cat);
          const color = CATEGORY_COLORS[cat];
          return (
            <div key={cat} className="card overflow-hidden">
              <div
                className="px-5 py-3 border-b border-slate-100 flex items-center gap-2"
                style={{ background: `${color}10` }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <h3 className="text-sm font-bold text-slate-800">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <span className="ml-auto text-xs font-semibold text-slate-500">
                  Subtotal:{" "}
                  {cat === "kabel_adss"
                    ? formatMeter(sumCategory(region.totals, cat))
                    : formatNumber(sumCategory(region.totals, cat))}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50/80">
                      <th className="px-5 py-2.5 font-semibold">Item</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Total</th>
                      <th className="px-5 py-2.5 font-semibold">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const val = region.totals[item.key] || 0;
                      return (
                        <tr key={item.key} className="hover:bg-slate-50/50">
                          <td className="px-5 py-2.5 font-medium text-slate-700">
                            {item.label}
                          </td>
                          <td
                            className={`px-5 py-2.5 text-right tabular-nums font-bold ${
                              val > 0 ? "text-slate-900" : "text-slate-300"
                            }`}
                          >
                            {formatNumber(val)}
                          </td>
                          <td className="px-5 py-2.5 text-slate-500 text-xs">
                            {item.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-600" />
          <h2 className="text-base font-bold text-slate-800">
            Riwayat Input & Update
          </h2>
          <span className="ml-auto text-xs text-slate-500">
            {transactions.length} transaksi
          </span>
        </div>
        {transactions.length === 0 ? (
          <p className="p-8 text-center text-slate-400 text-sm">
            Belum ada riwayat transaksi
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <li key={t.id} className="px-5 py-4 hover:bg-slate-50/50">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${TX_TYPE_COLORS[t.type]}`}>
                        {TX_TYPE_LABELS[t.type]}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {formatDate(t.date)}
                      </span>
                    </div>
                    {t.note && (
                      <p className="text-sm text-slate-600 mt-1">{t.note}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      Diinput {formatDateTime(t.createdAt)}
                      {t.operator ? ` oleh ${t.operator}` : ""}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs mt-1">
                    <thead>
                      <tr className="text-slate-400 text-left">
                        <th className="pr-4 py-1 font-medium">Item</th>
                        <th className="pr-4 py-1 font-medium text-right">Sebelum</th>
                        <th className="pr-4 py-1 font-medium text-right">Delta</th>
                        <th className="py-1 font-medium text-right">Sesudah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.changes.map((c) => (
                        <tr key={c.key} className="border-t border-slate-50">
                          <td className="pr-4 py-1.5 font-medium text-slate-700">
                            {c.label}
                          </td>
                          <td className="pr-4 py-1.5 text-right tabular-nums text-slate-500">
                            {formatNumber(c.before)}
                          </td>
                          <td
                            className={`pr-4 py-1.5 text-right tabular-nums font-bold ${
                              c.delta > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {deltaLabel(c.delta)}
                          </td>
                          <td className="py-1.5 text-right tabular-nums font-bold text-slate-800">
                            {formatNumber(c.after)} {c.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
