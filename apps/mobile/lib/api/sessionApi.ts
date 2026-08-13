import type { MobileCurrentUser } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { requestJson } from "../apiTransport";

export async function getCurrentMobileUser(): Promise<MobileCurrentUser> {
  const body = await requestJson<{ readonly authenticated: boolean; readonly user?: MobileCurrentUser }>("/api/auth/me", { method: "GET" });
  if (!body.authenticated || !body.user) throw new MobileApiError({ code: "AUTH_REQUIRED", message: "연결이 필요합니다.", status: 401 });
  return body.user;
}

export async function exchangeMobileConnectCode(code: string): Promise<void> {
  const body = await requestJson<{ readonly ok: boolean; readonly connected?: boolean }>("/api/dev/mobile-connect/exchange", { method: "POST", body: { code } });
  if (!body.ok || body.connected !== true) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "연결 응답을 확인할 수 없습니다." });
}

export async function connectTailscaleDeveloper(): Promise<void> {
  const body = await requestJson<{ readonly ok: boolean; readonly connected?: boolean; readonly mode?: string }>(
    "/api/dev/mobile-connect/auto",
    { method: "POST" },
  );
  if (!body.ok || body.connected !== true || body.mode !== "tailscale-developer") {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "자동 연결 응답을 확인할 수 없습니다." });
  }
}

export async function disconnectMobileSession(): Promise<void> {
  const body = await requestJson<{ readonly ok: boolean; readonly disconnected?: boolean }>("/api/dev/mobile-connect/disconnect", { method: "POST" });
  if (!body.ok || body.disconnected !== true) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "연결 해제 응답을 확인할 수 없습니다." });
}
