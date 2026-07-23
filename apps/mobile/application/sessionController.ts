import {
  assertMobileApiOrigin,
  connectTailscaleDeveloper,
  disconnectMobileSession,
  exchangeMobileConnectCode,
  getCurrentMobileUser,
} from "../lib/apiClient";
import { MobileApiError, type MobileCurrentUser } from "../domain/mobileContract";

function requireCompanyContext(user: MobileCurrentUser): MobileCurrentUser {
  if (!user.companyId || !user.companyName) {
    throw new MobileApiError({ code: "FORBIDDEN", message: "회사 연결이 필요합니다.", status: 403 });
  }
  return user;
}

export const mobileSessionController = {
  async current(): Promise<MobileCurrentUser> {
    assertMobileApiOrigin();
    return requireCompanyContext(await getCurrentMobileUser());
  },
  async autoConnect(): Promise<MobileCurrentUser> {
    assertMobileApiOrigin();
    await connectTailscaleDeveloper();
    return requireCompanyContext(await getCurrentMobileUser());
  },
  async connectWithCode(code: string): Promise<MobileCurrentUser> {
    assertMobileApiOrigin();
    await exchangeMobileConnectCode(code);
    return requireCompanyContext(await getCurrentMobileUser());
  },
  async disconnect(): Promise<void> {
    await disconnectMobileSession();
  },
} as const;
