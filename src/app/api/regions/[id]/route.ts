import { NextRequest, NextResponse } from "next/server";
import { deleteRegion, getRegion, updateRegionMeta } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const region = await getRegion(params.id);
    if (!region) {
      return NextResponse.json({ error: "Daerah tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ region });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memuat data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const region = await updateRegionMeta(params.id, body);
    return NextResponse.json({ region });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal update";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteRegion(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal hapus";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
