export default function Loading({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}
