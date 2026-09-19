"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isLoginPage = pathname === "/login";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loading label="Memeriksa sesi pengguna..." />
      </div>
    );
  }

  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Sidebar />
      <main className="lg:pl-64 min-h-screen">
        <div className="pt-16 lg:pt-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
