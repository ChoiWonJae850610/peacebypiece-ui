import "server-only";

import { cookies } from "next/headers";

import { verifyWaflSessionCookieValue, WAFL_AUTH_SESSION_COOKIE, type WaflSessionPayload } from "@/lib/auth/session";

export async function getCurrentWaflSession(): Promise<WaflSessionPayload | null> {
  const cookieStore = await cookies();
  return verifyWaflSessionCookieValue(cookieStore.get(WAFL_AUTH_SESSION_COOKIE)?.value);
}
