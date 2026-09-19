import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, toSafeUser } from "@/lib/auth";
import { getUserById } from "@/lib/store";

export async function GET(req: NextRequest) {
  const payload = getSessionFromRequest(req);
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
