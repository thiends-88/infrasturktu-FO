import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memuat dashboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
