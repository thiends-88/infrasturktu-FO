import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, readData } from "@/lib/store";
import { verifyPassword, createToken, toSafeUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Ensure initial admin exists
    await readData();

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const token = createToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: toSafeUser(user),
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
