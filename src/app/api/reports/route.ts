import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get("regionId") || undefined;
    const report = await getReport(regionId);
    return NextResponse.json({ report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memuat laporan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
