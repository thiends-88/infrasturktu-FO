import crypto from "crypto";
import type { NextRequest } from "next/server";
import { User, SafeUser } from "@/types";

const SECRET_KEY = process.env.SESSION_SECRET || "infra-fo-super-secret-key-salt-982138";

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, s, 32).toString("hex");
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const calc = crypto.scryptSync(password, salt, 32).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(calc, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export function toSafeUser(user: User): SafeUser {
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: "admin" | "staff";
  exp: number; // timestamp ms
}

export function createToken(payload: Omit<SessionPayload, "exp">, expiresInDays = 7): string {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const data: SessionPayload = { ...payload, exp };
  const json = JSON.stringify(data);
  const b64 = Buffer.from(json, "utf-8").toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET_KEY).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    const expected = crypto.createHmac("sha256", SECRET_KEY).update(b64).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Ambil sesi dari request: coba cookie dulu, lalu fallback ke
 * Authorization: Bearer <token>, header x-auth-token, atau query param _t
 * (dipakai saat cookie/header diblokir browser atau proxy,
 * misalnya ketika aplikasi berjalan di dalam iframe preview).
 */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const cookieToken = req.cookies.get("auth_token")?.value;
  if (cookieToken) {
    const p = verifyToken(cookieToken);
    if (p) return p;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const p = verifyToken(authHeader.slice(7).trim());
    if (p) return p;
  }
  const xToken = req.headers.get("x-auth-token");
  if (xToken) {
    const p = verifyToken(xToken.trim());
    if (p) return p;
  }
  try {
    const qToken = req.nextUrl.searchParams.get("_t");
    if (qToken) {
      const p = verifyToken(qToken.trim());
      if (p) return p;
    }
  } catch {
    // ignore
  }
  return null;
}
