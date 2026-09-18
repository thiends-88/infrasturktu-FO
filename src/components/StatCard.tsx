import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "#1a7bf5",
  trend,
}: StatCardProps) {
  return (
    <div className="card p-5 relative overflow-hidden group hover:shadow-soft transition-shadow">
      <div
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.08] group-hover:opacity-[0.14] transition-opacity"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tracking-tight truncate">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <p className="mt-2 text-xs font-medium text-accent-600">{trend}</p>
          )}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
