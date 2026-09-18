"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Save,
  MapPin,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Loading from "@/components/Loading";
import Toast from "@/components/Toast";
import EquipmentForm, { emptyQuantities } from "@/components/EquipmentForm";
import {
  QuantityMap,
  Region,
  TransactionType,
  sumCategory,
  EQUIPMENT_DEFS,
} from "@/types";
import { formatNumber, TX_TYPE_LABELS } from "@/lib/format";

function InputFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetRegionId = searchParams.get("regionId") || "";
  const modeParam = searchParams.get("mode"); // "new" | null

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );

  // Mode: new region or update existing
  const [isNew, setIsNew] = useState(modeParam === "new" || !presetRegionId);
  const [regionId, setRegionId] = useState(presetRegionId);

  // New region fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  // Common fields
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [operator, setOperator] = useState("Admin");
  const [txType, setTxType] = useState<TransactionType>("penambahan");
  const [quantities, setQuantities] = useState<QuantityMap>(emptyQuantities());

  // Success state
  const [success, setSuccess] = useState<{
    regionId: string;
    regionName: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => {
        setRegions(d.regions || []);
        if (presetRegionId) {
          setIsNew(false);
          setRegionId(presetRegionId);
        }
      })
      .finally(() => setLoading(false));
  }, [presetRegionId]);

  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === regionId) || null,
    [regions, regionId]
  );

  const filledCount = useMemo(
    () => Object.values(quantities).filter((v) => v > 0).length,
    [quantities]
  );

  const resetForm = () => {
    setQuantities(emptyQuantities());
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      if (isNew) {
        if (!name.trim()) throw new Error("Nama daerah wajib diisi");
        const res = await fetch("/api/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            code,
            description,
            quantities,
            date,
            note: note || "Data awal penggelaran",
            operator,
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Gagal menyimpan");

        setSuccess({
          regionId: d.region.id,
          regionName: d.region.name,
          message: `Daerah "${d.region.name}" berhasil ditambahkan dengan total inventaris tersimpan.`,
        });
        setToast({ message: "Data daerah baru berhasil disimpan!", type: "success" });
        // refresh regions
        const rr = await fetch("/api/regions").then((r) => r.json());
        setRegions(rr.regions || []);
      } else {
        if (!regionId) throw new Error("Pilih daerah terlebih dahulu");
        // For pengurangan, negate deltas
        let deltas = { ...quantities };
        if (txType === "pengurangan") {
          const neg: QuantityMap = emptyQuantities();
          for (const k of Object.keys(deltas)) {
            neg[k] = -(Math.abs(deltas[k] || 0));
          }
          deltas = neg;
        }

        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regionId,
            type: txType,
            date,
            note,
            operator,
            deltas,
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Gagal menyimpan");

        setSuccess({
          regionId: d.region.id,
          regionName: d.region.name,
          message: `Update berhasil. Total inventaris "${d.region.name}" sudah tersinkron.`,
        });
        setToast({ message: "Update data berhasil disimpan!", type: "success" });
        // refresh selected region totals
        const rr = await fetch("/api/regions").then((r) => r.json());
        setRegions(rr.regions || []);
        setQuantities(emptyQuantities());
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  if (success) {
    return (
      <div>
        <PageHeader title="Berhasil Disimpan" />
        <div className="card p-8 max-w-xl mx-auto text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {success.regionName}
          </h2>
          <p className="text-sm text-slate-600 mb-6">{success.message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/daerah/${success.regionId}`} className="btn-primary">
              Lihat Detail Daerah
            </Link>
            <button
              className="btn-secondary"
              onClick={() => {
                resetForm();
                if (!isNew) {
                  /* stay on update */
                } else {
                  setIsNew(false);
                  setRegionId(success.regionId);
                  setName("");
                  setCode("");
                  setDescription("");
                }
              }}
            >
              Input Lagi
            </button>
            <Link href="/" className="btn-ghost">
              Ke Dashboard
            </Link>
          </div>
        </div>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "Input Daerah Baru" : "Update Data Infrastruktur"}
        description={
          isNew
            ? "Daftarkan daerah baru beserta inventaris FO yang sudah tergelar. Total akan tersimpan sebagai data awal."
            : "Tambah, kurangi, atau catat maintenance. Setiap perubahan tersimpan dengan tanggal, dan total daerah otomatis sinkron."
        }
      />

      {/* Mode toggle */}
      <div className="card p-2 mb-5 inline-flex gap-1">
        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setRegionId("");
            setQuantities(emptyQuantities());
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            isNew
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Daerah Baru
        </button>
        <button
          type="button"
          onClick={() => {
            setIsNew(false);
            setQuantities(emptyQuantities());
            if (!regionId && regions[0]) setRegionId(regions[0].id);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            !isNew
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Update Daerah Existing
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Meta form */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600" />
            Informasi Lokasi & Transaksi
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isNew ? (
              <>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="label">Lokasi / Daerah *</label>
                  <input
                    className="input"
                    required
                    placeholder="Contoh: Kota Solok"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Kode Daerah</label>
                  <input
                    className="input"
                    placeholder="Contoh: SLK"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Tanggal Penggelaran *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="label">Keterangan / Deskripsi</label>
                  <input
                    className="input"
                    placeholder="Wilayah cakupan, catatan awal, dll."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="label">Pilih Daerah *</label>
                  <select
                    className="input"
                    required
                    value={regionId}
                    onChange={(e) => {
                      setRegionId(e.target.value);
                      setQuantities(emptyQuantities());
                    }}
                  >
                    <option value="">— Pilih daerah —</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                        {r.code ? ` (${r.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Jenis Transaksi *</label>
                  <select
                    className="input"
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as TransactionType)}
                  >
                    {(
                      ["penambahan", "maintenance", "pengurangan", "koreksi"] as TransactionType[]
                    ).map((t) => (
                      <option key={t} value={t}>
                        {TX_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Tanggal *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="label">Operator / Petugas</label>
              <input
                className="input"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama petugas"
              />
            </div>
            <div className={isNew ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-2"}>
              <label className="label">Catatan</label>
              <input
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isNew
                    ? "Contoh: Data awal penggelaran Januari 2025"
                    : "Contoh: Penambahan ODP area Talang, maintenance JB..."
                }
              />
            </div>
          </div>

          {/* Current totals preview when updating */}
          {selectedRegion && !isNew && (
            <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-brand-600 mt-0.5 shrink-0" />
                <div className="text-sm text-brand-900 w-full">
                  <p className="font-semibold mb-2">
                    Total saat ini — {selectedRegion.name}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                    <span>
                      OLT:{" "}
                      <b>
                        {formatNumber(
                          sumCategory(selectedRegion.totals, "perangkat_aktif")
                        )}
                      </b>
                    </span>
                    <span>
                      ODP:{" "}
                      <b className="text-emerald-700">
                        {formatNumber(sumCategory(selectedRegion.totals, "odp"))}
                      </b>
                    </span>
                    <span>
                      ODC:{" "}
                      <b>{formatNumber(sumCategory(selectedRegion.totals, "odc"))}</b>
                    </span>
                    <span>
                      JB: <b>{formatNumber(sumCategory(selectedRegion.totals, "jb"))}</b>
                    </span>
                    <span>
                      Tiang:{" "}
                      <b>{formatNumber(sumCategory(selectedRegion.totals, "tiang"))}</b>
                    </span>
                    <span>
                      Kabel:{" "}
                      <b>
                        {formatNumber(
                          sumCategory(selectedRegion.totals, "kabel_adss")
                        )}{" "}
                        m
                      </b>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Equipment quantities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">
              {isNew ? "Inventaris yang Tergelar" : "Jumlah Perubahan per Item"}
            </h3>
            <span className="text-xs text-slate-500">
              {filledCount} item terisi · {EQUIPMENT_DEFS.length} total item
            </span>
          </div>
          <EquipmentForm
            values={quantities}
            onChange={setQuantities}
            currentTotals={!isNew ? selectedRegion?.totals : undefined}
            mode={isNew ? "absolute" : "delta"}
            disabled={saving}
          />
        </div>

        {/* Actions */}
        <div className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-4 shadow-soft border-brand-100">
          <p className="text-xs text-slate-500 px-1">
            {isNew
              ? "Data awal akan tersimpan dan menjadi total daerah."
              : txType === "pengurangan"
                ? "Nilai yang diisi akan dikurangi dari total saat ini."
                : "Nilai yang diisi akan ditambahkan ke total saat ini. Riwayat & tanggal tersimpan otomatis."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setQuantities(emptyQuantities())}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button type="submit" className="btn-primary min-w-[140px]" disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Data
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function InputPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InputFormInner />
    </Suspense>
  );
}
