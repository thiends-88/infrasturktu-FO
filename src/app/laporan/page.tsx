"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Printer,
  Download,
  FileBarChart2,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Loading from "@/components/Loading";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EquipmentCategory,
  METER_CATEGORY,
  Region,
} from "@/types";
import {
  formatNumber,
  formatMeter,
  formatDate,
  formatDateTime,
  TX_TYPE_LABELS,
  deltaLabel,
} from "@/lib/format";

interface ReportItem {
  key: string;
  label: string;
  unit: string;
  total: number;
}

interface ReportCategory {
  category: EquipmentCategory;
  items: ReportItem[];
  subtotal: number;
}

interface ReportRow {
  region: Region;
  categories: ReportCategory[];
  history: {
    id: string;
    type: string;
    date: string;
    createdAt: string;
    note?: string;
    operator?: string;
    changes: {
      key: string;
      label: string;
      unit: string;
      delta: number;
      before: number;
      after: number;
    }[];
  }[];
  summary: {
    olt: number;
    tiang: number;
    odp: number;
    odc: number;
    otb: number;
    jb: number;
    kabel: number;
  };
}

function LaporanInner() {
  const searchParams = useSearchParams();
  const preset = searchParams.get("regionId") || "";

  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState(preset);
  const [report, setReport] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => setRegions(d.regions || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = regionId
      ? `/api/reports?regionId=${regionId}`
      : "/api/reports";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setReport(d.report || []))
      .finally(() => setLoading(false));
  }, [regionId]);

  const handlePrint = () => window.print();

  const handleExportCsv = () => {
    const lines: string[] = [
      "Daerah,Kategori,Item,Total,Satuan",
    ];
    for (const row of report) {
      for (const cat of row.categories) {
        for (const item of cat.items) {
          lines.push(
            [
              `"${row.region.name}"`,
              `"${CATEGORY_LABELS[cat.category]}"`,
              `"${item.label}"`,
              item.total,
              item.unit,
            ].join(",")
          );
        }
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-infra-fo-${regionId || "semua"}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aggregate totals across all shown regions
  const grand = report.reduce(
    (acc, r) => ({
      olt: acc.olt + r.summary.olt,
      odp: acc.odp + r.summary.odp,
      odc: acc.odc + r.summary.odc,
      otb: acc.otb + (r.summary.otb || 0),
      jb: acc.jb + r.summary.jb,
      tiang: acc.tiang + r.summary.tiang,
      kabel: acc.kabel + r.summary.kabel,
    }),
    { olt: 0, odp: 0, odc: 0, otb: 0, jb: 0, tiang: 0, kabel: 0 }
  );

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Laporan Infrastruktur FO"
          description="Laporan lengkap inventaris per wilayah. Cetak atau unduh CSV untuk keperluan pelaporan."
          actions={
            <>
              <button onClick={handleExportCsv} className="btn-secondary" disabled={loading}>
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button onClick={handlePrint} className="btn-primary" disabled={loading}>
                <Printer className="h-4 w-4" />
                Cetak / PDF
              </button>
            </>
          }
        />

        <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="input pl-9"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              <option value="">Semua wilayah</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Tampilkan riwayat transaksi
          </label>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Laporan Data Infrastruktur Fiber Optik
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {regionId
            ? `Wilayah: ${report[0]?.region.name || "-"}`
            : `Semua wilayah (${report.length} daerah)`}{" "}
          · Dicetak {formatDateTime(new Date().toISOString())}
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : report.length === 0 ? (
        <div className="card p-12 text-center">
          <FileBarChart2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Tidak ada data laporan</p>
        </div>
      ) : (
        <>
          {/* Grand summary */}
          <div className="card p-5 mb-6">
            <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
              Ringkasan Total
              {!regionId && ` — ${report.length} Wilayah`}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "OLT", value: grand.olt, color: "#1a7bf5" },
                { label: "ODP", value: grand.odp, color: "#10b981" },
                { label: "ODC", value: grand.odc, color: "#8b5cf6" },
                { label: "OTB", value: grand.otb, color: "#ec4899" },
                { label: "JB", value: grand.jb, color: "#ef4444" },
                { label: "Tiang", value: grand.tiang, color: "#f59e0b" },
                {
                  label: "Kabel",
                  value: formatMeter(grand.kabel),
                  color: "#06b6d4",
                  raw: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                >
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-1 tabular-nums">
                    {s.raw ? s.value : formatNumber(s.value as number)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Per region */}
          {report.map((row, idx) => (
            <div
              key={row.region.id}
              className={`mb-8 ${idx > 0 ? "print-break" : ""}`}
            >
              <div className="card overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">
                        Laporan Wilayah
                        {row.region.code ? ` · ${row.region.code}` : ""}
                      </p>
                      <h2 className="text-xl font-bold mt-0.5">{row.region.name}</h2>
                      {row.region.description && (
                        <p className="text-sm text-brand-100 mt-1">
                          {row.region.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-brand-100">
                      <p>Update: {formatDateTime(row.region.updatedAt)}</p>
                      <p className="mt-0.5">
                        {row.history.length} transaksi tercatat
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary bar */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y lg:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/80">
                  {(
                    [
                      ["OLT", row.summary.olt],
                      ["ODP", row.summary.odp],
                      ["ODC", row.summary.odc],
                      ["OTB", row.summary.otb || 0],
                      ["JB", row.summary.jb],
                      ["Tiang", row.summary.tiang],
                      ["Kabel (m)", row.summary.kabel],
                    ] as [string, number][]
                  ).map(([label, val]) => (
                    <div key={label} className="px-3 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        {label}
                      </p>
                      <p className="text-base font-bold text-slate-800 tabular-nums">
                        {formatNumber(val)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Detail tables */}
                <div className="p-5 space-y-5">
                  {row.categories.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: CATEGORY_COLORS[cat.category] }}
                        />
                        <h3 className="text-sm font-bold text-slate-800">
                          {CATEGORY_LABELS[cat.category]}
                        </h3>
                        <span className="ml-auto text-xs font-semibold text-slate-500">
                          Subtotal:{" "}
                          {cat.category === METER_CATEGORY
                            ? formatMeter(cat.subtotal)
                            : formatNumber(cat.subtotal)}
                        </span>
                      </div>
                      <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-2 font-semibold">Item / Tipe</th>
                            <th className="px-4 py-2 font-semibold text-right">Jumlah</th>
                            <th className="px-4 py-2 font-semibold">Satuan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cat.items.map((item) => (
                            <tr key={item.key}>
                              <td className="px-4 py-2 text-slate-700">{item.label}</td>
                              <td
                                className={`px-4 py-2 text-right tabular-nums font-semibold ${
                                  item.total > 0 ? "text-slate-900" : "text-slate-300"
                                }`}
                              >
                                {formatNumber(item.total)}
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-500">
                                {item.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* History */}
                {showHistory && row.history.length > 0 && (
                  <div className="border-t border-slate-200 px-5 py-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">
                      Riwayat Perubahan
                    </h3>
                    <div className="space-y-3">
                      {row.history.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-xl border border-slate-100 p-3 bg-slate-50/50"
                        >
                          <div className="flex flex-wrap gap-2 items-center text-xs mb-2">
                            <span className="font-bold text-slate-800">
                              {formatDate(t.date)}
                            </span>
                            <span className="badge bg-white border border-slate-200 text-slate-600">
                              {TX_TYPE_LABELS[t.type as keyof typeof TX_TYPE_LABELS] ||
                                t.type}
                            </span>
                            {t.operator && (
                              <span className="text-slate-400">{t.operator}</span>
                            )}
                            {t.note && (
                              <span className="text-slate-600">— {t.note}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {t.changes.map((c) => (
                              <span
                                key={c.key}
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                  c.delta > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {c.label}: {deltaLabel(c.delta)} →{" "}
                                {formatNumber(c.after)} {c.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-slate-400 pb-4 print:block">
            Dokumen digenerate dari sistem Infra FO ·{" "}
            {formatDateTime(new Date().toISOString())}
          </p>
        </>
      )}
    </div>
  );
}

export default function LaporanPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LaporanInner />
    </Suspense>
  );
}
