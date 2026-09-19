import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

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
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
