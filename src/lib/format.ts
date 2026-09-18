import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TransactionType } from "@/types";

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n || 0);
}

export function formatDate(dateStr: string): string {
  try {
    const d = dateStr.includes("T") ? parseISO(dateStr) : parseISO(dateStr + "T00:00:00");
    return format(d, "d MMMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMM yyyy, HH:mm", { locale: localeId });
  } catch {
    return dateStr;
  }
}

export function formatMeter(n: number): string {
  if (n >= 1000) {
    return `${formatNumber(Math.round(n / 100) / 10)} km`;
  }
  return `${formatNumber(n)} m`;
}

export const TX_TYPE_LABELS: Record<TransactionType, string> = {
  initial: "Data Awal",
  penambahan: "Penambahan",
  pengurangan: "Pengurangan",
  maintenance: "Maintenance",
  koreksi: "Koreksi",
};

export const TX_TYPE_COLORS: Record<TransactionType, string> = {
  initial: "bg-slate-100 text-slate-700",
  penambahan: "bg-emerald-100 text-emerald-700",
  pengurangan: "bg-rose-100 text-rose-700",
  maintenance: "bg-amber-100 text-amber-700",
  koreksi: "bg-violet-100 text-violet-700",
};

export function deltaLabel(delta: number): string {
  if (delta > 0) return `+${formatNumber(delta)}`;
  return formatNumber(delta);
}
