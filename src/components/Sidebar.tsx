"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  FileBarChart2,
  History,
  Network,
  Menu,
  X,
  Users,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  // Jangan tampilkan sidebar di halaman login
  if (pathname === "/login") {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/daerah", label: "Data Daerah", icon: MapPin },
    { href: "/input", label: "Input / Update", icon: PlusCircle },
    { href: "/riwayat", label: "Riwayat", icon: History },
    { href: "/laporan", label: "Laporan", icon: FileBarChart2 },
  ];

  // Hanya tampilkan menu Pengguna jika Admin
  if (isAdmin) {
    navItems.push({ href: "/pengguna", label: "Manajemen User", icon: Users });
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
          <Network className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Infra FO
          </p>
          <h1 className="text-base font-bold text-white leading-tight">
            Fiber Optik
          </h1>
        </div>
      </div>

      {/* User profile card */}
      {user && (
        <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                isAdmin
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <Shield className="h-3 w-3 text-purple-400 flex-shrink-0" />
                ) : (
                  <UserIcon className="h-3 w-3 text-brand-400 flex-shrink-0" />
                )}
                <span className="text-[10px] text-slate-300 capitalize font-medium truncate">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition flex-shrink-0"
            title="Keluar / Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-brand-300" : ""}`} />
              <span>{item.label}</span>
              {item.href === "/pengguna" && (
                <span className="ml-auto text-[10px] bg-purple-500/30 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-semibold uppercase">
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <p className="text-[11px] text-slate-400 leading-relaxed px-1">
          Pendataan infrastruktur FO per wilayah.
          <br />
          Total otomatis sinkron setiap update.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="no-print lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-brand-950/95 backdrop-blur px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-brand-300" />
          <span className="font-bold text-white text-sm">Infra FO</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg text-white hover:bg-white/10"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="no-print lg:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-brand-950 p-5 pt-16 flex flex-col">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="no-print hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 p-5 z-20 border-r border-white/5">
        <NavContent />
      </aside>
    </>
  );
}
