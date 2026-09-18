import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Infra FO — Pendataan Infrastruktur Fiber Optik",
  description:
    "Aplikasi pendataan infrastruktur fiber optik per daerah: OLT, ODP, ODC, JB, tiang, dan kabel ADSS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <Sidebar />
        <main className="lg:pl-64 min-h-screen">
          <div className="pt-16 lg:pt-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
