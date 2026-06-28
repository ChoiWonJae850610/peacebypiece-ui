import "server-only";

import { canSwitchTestAccount } from "@/lib/runtime/runtimePolicy";

export type DevTestContextDisabledReason = "system_admin_required" | null;

export function isDevTestContextEnabledForSystemAdmin(isSystemAdmin: boolean): boolean {
  return canSwitchTestAccount({ isSystemAdmin });
}

export function isDevTestContextEnabled(): boolean {
  return isDevTestContextEnabledForSystemAdmin(true);
}

export function getDevTestContextDisabledReasonForSystemAdmin(isSystemAdmin: boolean): DevTestContextDisabledReason {
  return canSwitchTestAccount({ isSystemAdmin }) ? null : "system_admin_required";
}

export function getDevTestContextDisabledReason(): DevTestContextDisabledReason {
  return getDevTestContextDisabledReasonForSystemAdmin(true);
}

export function isDevTestContextActionAllowedForSystemAdmin(isSystemAdmin: boolean): boolean {
  return isDevTestContextEnabledForSystemAdmin(isSystemAdmin);
}

export function isDevTestContextActionAllowed(): boolean {
  return isDevTestContextActionAllowedForSystemAdmin(true);
}
