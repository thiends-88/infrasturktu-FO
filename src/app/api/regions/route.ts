import { NextRequest, NextResponse } from "next/server";
import { createRegion, getRegions } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const regions = await getRegions();
    return NextResponse.json({ regions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memuat data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createRegion(body);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal menyimpan";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
