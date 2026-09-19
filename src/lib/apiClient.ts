"use client";

const TOKEN_KEY = "auth_token_client";

// Token disimpan di memori sebagai sumber utama — selalu berfungsi
// walaupun browser memblokir localStorage/sessionStorage di dalam iframe.
let memoryToken: string | null = null;

export function saveToken(token: string) {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage diblokir — token tetap ada di memori
  }
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) {
      memoryToken = t;
      return t;
    }
  } catch {
    // ignore
  }
  try {
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (t) {
      memoryToken = t;
      return t;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * fetch wrapper yang otomatis menyertakan token lewat BANYAK jalur sekaligus:
 * - Authorization: Bearer <token>
 * - x-auth-token: <token>
 * - query param ?_t=<token>
 * Dengan begitu autentikasi tetap bekerja walaupun browser memblokir cookie
 * atau proxy menghapus salah satu header.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  let url = input;
  if (token) {
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("x-auth-token")) {
      headers.set("x-auth-token", token);
    }
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}_t=${encodeURIComponent(token)}`;
  }
  return fetch(url, { ...init, headers, credentials: "include" });
}
