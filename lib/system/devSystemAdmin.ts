import "server-only";

import type { WaflSessionPayload } from "@/lib/auth/session";
import type { SystemAdminScope } from "@/lib/system/sessionScope";

export const DEV_SYSTEM_ADMIN_USER_ID = "dev-system-admin";
export const DEV_SYSTEM_ADMIN_EMAIL = "system-dev@wafl.local";
export const DEV_SYSTEM_ADMIN_NAME = "개발용 시스템관리자";

function isExplicitlyEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

function isExplicitlyDisabled(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

export function isDevSystemAdminEntryEnabled(): boolean {
  if (isExplicitlyDisabled(process.env.WAFL_DISABLE_SYSTEM_DEV_ENTRY)) return false;
  if (isExplicitlyEnabled(process.env.WAFL_ENABLE_SYSTEM_DEV_ENTRY)) return true;
  if (process.env.NEXT_PUBLIC_APP_RUNTIME_MODE === "development") return true;

  return process.env.NODE_ENV !== "production";
}

export function createDevSystemAdminSession(): WaflSessionPayload {
  return {
    userId: DEV_SYSTEM_ADMIN_USER_ID,
    companyId: null,
    companyMemberId: null,
    companyName: null,
    role: "system_admin",
    email: DEV_SYSTEM_ADMIN_EMAIL,
    name: DEV_SYSTEM_ADMIN_NAME,
    issuedAt: new Date(0).toISOString(),
  };
}

export function createDevSystemAdminScope(): SystemAdminScope {
  return {
    userId: DEV_SYSTEM_ADMIN_USER_ID,
    email: DEV_SYSTEM_ADMIN_EMAIL,
    name: DEV_SYSTEM_ADMIN_NAME,
    isDevEntry: true,
  };
}
