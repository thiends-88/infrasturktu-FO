"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Server,
  Box,
  Cable,
  TowerControl,
  HardDrive,
  Network,
  Activity,
  ArrowRight,
  PlusCircle,
  FileBarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Loading from "@/components/Loading";
import { DashboardStats } from "@/types";
import {
  formatNumber,
  formatMeter,
  formatDate,
  TX_TYPE_LABELS,
  TX_TYPE_COLORS,
} from "@/lib/format";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStats(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error || !stats)
    return (
      <div className="card p-8 text-center text-rose-600">
        {error || "Gagal memuat dashboard"}
      </div>
    );

  const regionMap = new Map(stats.byRegion.map((r) => [r.id, r.name]));

  return (
    <div>
      <PageHeader
        title="Dashboard Infra FO"
        description="Ringkasan total infrastruktur fiber optik di semua wilayah. Data sinkron otomatis setiap kali ada input atau update."
        actions={
          <>
            <Link href="/input" className="btn-primary">
              <PlusCircle className="h-4 w-4" />
              Input Data
            </Link>
            <Link href="/laporan" className="btn-secondary">
              <FileBarChart2 className="h-4 w-4" />
              Laporan
            </Link>
          </>
        }
      />

      {/* KPI cards — 9 kartu, 3 kolom di layar sedang ke atas agar baris penuh */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Wilayah"
          value={formatNumber(stats.totalRegions)}
          subtitle="Daerah terdata"
          icon={MapPin}
          color="#1a7bf5"
        />
        <StatCard
          title="Total OLT"
          value={formatNumber(stats.totalOlt)}
          subtitle="Perangkat aktif"
          icon={Server}
          color="#8b5cf6"
        />
        <StatCard
          title="Total ODP"
          value={formatNumber(stats.totalOdp)}
          subtitle="Semua tipe ODP"
          icon={Box}
          color="#10b981"
        />
        <StatCard
          title="Total ODC"
          value={formatNumber(stats.totalOdc)}
          subtitle="Semua tipe ODC"
          icon={HardDrive}
          color="#f59e0b"
        />
        <StatCard
          title="Total OTB"
          value={formatNumber(stats.totalOtb ?? 0)}
          subtitle="Optical Termination Box"
          icon={Network}
          color="#ec4899"
        />
        <StatCard
          title="Total JB"
          value={formatNumber(stats.totalJb)}
          subtitle="Joint Box"
          icon={Activity}
          color="#ef4444"
        />
        <StatCard
          title="Total Tiang"
          value={formatNumber(stats.totalTiang)}
          subtitle="7m & 9m"
          icon={TowerControl}
          color="#06b6d4"
        />
        <StatCard
          title="Total Kabel"
          value={formatMeter(stats.totalKabelMeter)}
          subtitle={`${formatNumber(stats.totalKabelMeter)} meter`}
          icon={Cable}
          color="#ec4899"
        />
        <StatCard
          title="Update Terbaru"
          value={stats.recentTransactions.length}
          subtitle="Aktivitas terakhir"
          icon={Activity}
          color="#64748b"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        {/* Chart per wilayah */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Inventaris per Wilayah
              </h2>
              <p className="text-xs text-slate-500">Perbandingan ODP, ODC, OTB, JB, OLT</p>
            </div>
            <Link
              href="/daerah"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byRegion} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="odp" name="ODP" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="odc" name="ODC" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="otb" name="OTB" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="jb" name="JB" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="olt" name="OLT" fill="#1a7bf5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly activity */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-800 mb-1">
            Aktivitas 12 Bulan
          </h2>
          <p className="text-xs text-slate-500 mb-4">Jumlah transaksi input / update</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyActivity}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a7bf5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1a7bf5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Transaksi"
                  stroke="#1a7bf5"
                  fill="url(#actGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Region table + recent */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="card lg:col-span-3 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Ringkasan Wilayah</h2>
            <Link href="/daerah" className="text-xs font-semibold text-brand-600">
              Detail →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Daerah</th>
                  <th className="px-3 py-3 font-semibold text-right">OLT</th>
                  <th className="px-3 py-3 font-semibold text-right">ODP</th>
                  <th className="px-3 py-3 font-semibold text-right">ODC</th>
                  <th className="px-3 py-3 font-semibold text-right">OTB</th>
                  <th className="px-3 py-3 font-semibold text-right">JB</th>
                  <th className="px-3 py-3 font-semibold text-right">Tiang</th>
                  <th className="px-5 py-3 font-semibold text-right">Kabel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.byRegion.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3">
                      <Link
                        href={`/daerah/${r.id}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(r.olt)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-emerald-700">
                      {formatNumber(r.odp)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(r.odc)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-pink-700">
                      {formatNumber(r.otb ?? 0)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(r.jb)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(r.tiang)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                      {formatMeter(r.kabel)}
                    </td>
                  </tr>
                ))}
                {stats.byRegion.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                      Belum ada data daerah. Mulai dengan input data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Aktivitas Terbaru</h2>
            <Link href="/riwayat" className="text-xs font-semibold text-brand-600">
              Semua →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {stats.recentTransactions.map((t) => (
              <li key={t.id} className="px-5 py-3.5 hover:bg-slate-50/80 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {regionMap.get(t.regionId) || "Wilayah"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {t.note || TX_TYPE_LABELS[t.type]}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatDate(t.date)}
                      {t.operator ? ` · ${t.operator}` : ""}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${TX_TYPE_COLORS[t.type]}`}>
                    {TX_TYPE_LABELS[t.type]}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.changes.slice(0, 3).map((c) => (
                    <span
                      key={c.key}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        c.delta > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {c.label} {c.delta > 0 ? "+" : ""}
                      {formatNumber(c.delta)}
                    </span>
                  ))}
                  {t.changes.length > 3 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      +{t.changes.length - 3} item
                    </span>
                  )}
                </div>
              </li>
            ))}
            {stats.recentTransactions.length === 0 && (
              <li className="px-5 py-8 text-center text-slate-400 text-sm">
                Belum ada aktivitas
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
