import crypto from "crypto";
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
