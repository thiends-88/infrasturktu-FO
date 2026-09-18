"use client";

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EQUIPMENT_DEFS,
  EquipmentCategory,
  QuantityMap,
  emptyQuantities,
} from "@/types";
import { formatNumber } from "@/lib/format";

interface EquipmentFormProps {
  values: QuantityMap;
  onChange: (values: QuantityMap) => void;
  /** Jika true, tampilkan current total di samping input (mode update) */
  currentTotals?: QuantityMap;
  mode?: "absolute" | "delta";
  disabled?: boolean;
}

const CATEGORIES: EquipmentCategory[] = [
  "perangkat_aktif",
  "tiang",
  "odp",
  "odc",
  "jb",
  "kabel_adss",
];

export default function EquipmentForm({
  values,
  onChange,
  currentTotals,
  mode = "absolute",
  disabled,
}: EquipmentFormProps) {
  const setVal = (key: string, raw: string) => {
    const num = raw === "" ? 0 : Math.max(0, Math.floor(Number(raw) || 0));
    onChange({ ...values, [key]: num });
  };

  return (
    <div className="space-y-5">
      {CATEGORIES.map((cat) => {
        const items = EQUIPMENT_DEFS.filter((d) => d.category === cat);
        const color = CATEGORY_COLORS[cat];
        return (
          <div key={cat} className="card overflow-hidden">
            <div
              className="px-5 py-3 border-b border-slate-100 flex items-center gap-2"
              style={{ background: `${color}10` }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: color }}
              />
              <h3 className="text-sm font-bold text-slate-800">
                {CATEGORY_LABELS[cat]}
              </h3>
              {mode === "delta" && (
                <span className="ml-auto text-[11px] text-slate-500 font-medium">
                  Isi jumlah penambahan / perubahan
                </span>
              )}
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => {
                const current = currentTotals?.[item.key] ?? 0;
                const val = values[item.key] ?? 0;
                const preview =
                  mode === "delta" && val > 0
                    ? current + val
                    : mode === "absolute"
                      ? val
                      : null;

                return (
                  <div
                    key={item.key}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-slate-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <label className="text-sm font-semibold text-slate-700 leading-tight">
                        {item.label}
                      </label>
                      <span className="badge bg-white text-slate-500 border border-slate-200 shrink-0">
                        {item.unit}
                      </span>
                    </div>

                    {currentTotals && (
                      <p className="text-[11px] text-slate-500 mb-1.5">
                        Total saat ini:{" "}
                        <span className="font-semibold text-slate-700">
                          {formatNumber(current)}
                        </span>
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {mode === "delta" && (
                        <span className="text-accent-600 font-bold text-sm">+</span>
                      )}
                      <input
                        type="number"
                        min={0}
                        step={1}
                        disabled={disabled}
                        className="input"
                        value={val || ""}
                        placeholder="0"
                        onChange={(e) => setVal(item.key, e.target.value)}
                      />
                    </div>

                    {preview !== null && mode === "delta" && val > 0 && (
                      <p className="mt-1.5 text-[11px] text-brand-600 font-medium">
                        → Total baru: {formatNumber(preview)} {item.unit}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { emptyQuantities };
