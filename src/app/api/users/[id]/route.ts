import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, toSafeUser } from "@/lib/auth";
import { updateUser, deleteUser } from "@/lib/store";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = getSessionFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "admin") {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya administrator yang dapat mengubah data user." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updated = await updateUser(
      params.id,
      {
        name: body.name,
        role: body.role,
        password: body.password || undefined,
      },
      payload.userId
    );

    return NextResponse.json({
      success: true,
      user: toSafeUser(updated),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Gagal mengupdate user" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = getSessionFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "admin") {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya administrator yang dapat menghapus user." },
      { status: 403 }
    );
  }

  try {
    await deleteUser(params.id, payload.userId);
    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Gagal menghapus user" },
      { status: 400 }
    );
  }
}
