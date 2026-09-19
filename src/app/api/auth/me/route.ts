import { NextRequest, NextResponse } from "next/server";
import { verifyToken, toSafeUser } from "@/lib/auth";
import { getUserById } from "@/lib/store";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: toSafeUser(user),
  });
}
