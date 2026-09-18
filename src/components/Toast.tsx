"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
      <div
        className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg border max-w-sm ${
          type === "success"
            ? "bg-white border-emerald-200 text-emerald-800"
            : "bg-white border-rose-200 text-rose-800"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
        )}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
