import { NextRequest, NextResponse } from "next/server";
import { verifyToken, toSafeUser } from "@/lib/auth";
import { getUsers, createUser } from "@/lib/store";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hanya admin yang bisa melihat dan mengelola user
  if (payload.role !== "admin") {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya administrator yang dapat melihat daftar user." },
      { status: 403 }
    );
  }

  const users = await getUsers();
  return NextResponse.json({
    users: users.map(toSafeUser),
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validasi: hanya admin yang bisa menambah user!
  if (payload.role !== "admin") {
    return NextResponse.json(
      { error: "Akses ditolak. Penambahan user hanya dapat dilakukan oleh administrator." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { username, name, password, role } = body;

    if (!username || !name || !password) {
      return NextResponse.json(
        { error: "Username, Nama, dan Password wajib diisi" },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      username,
      name,
      password,
      role: role === "admin" ? "admin" : "staff",
    });

    return NextResponse.json({
      success: true,
      user: toSafeUser(newUser),
      message: "User berhasil dibuat",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Gagal membuat user" },
      { status: 400 }
    );
  }
}
