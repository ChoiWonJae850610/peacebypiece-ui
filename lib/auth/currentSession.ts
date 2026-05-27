import "server-only";

import { cookies } from "next/headers";

import { verifyWaflSessionCookieValue, WAFL_AUTH_SESSION_COOKIE, type WaflSessionPayload } from "@/lib/auth/session";
import { applyDevTestContextOverlay } from "@/lib/dev/testContext/service";
import { WAFL_DEV_TEST_CONTEXT_COOKIE } from "@/lib/dev/testContext/session";

export async function getCurrentWaflAuthSession(): Promise<WaflSessionPayload | null> {
  const cookieStore = await cookies();
  return verifyWaflSessionCookieValue(cookieStore.get(WAFL_AUTH_SESSION_COOKIE)?.value);
}

export async function getCurrentWaflSession(): Promise<WaflSessionPayload | null> {
  const cookieStore = await cookies();
  const baseSession = verifyWaflSessionCookieValue(cookieStore.get(WAFL_AUTH_SESSION_COOKIE)?.value);
  if (!baseSession) return null;

  try {
    return await applyDevTestContextOverlay(baseSession, cookieStore.get(WAFL_DEV_TEST_CONTEXT_COOKIE)?.value);
  } catch {
    return baseSession;
  }
}
