import "server-only";

import { canSwitchTestAccount } from "@/lib/runtime/runtimePolicy";
import { isServerDevTestRuntime, isServerProductionRuntime } from "@/lib/runtime/serverRuntime";

export type DevTestContextDisabledReason =
  | "production"
  | "flag_disabled"
  | "production_impersonation_flag_disabled"
  | null;

export function isDevTestContextRuntimeAllowed(): boolean {
  return isServerDevTestRuntime();
}

export function isDevTestContextFlagEnabled(): boolean {
  return process.env.WAFL_ENABLE_DEV_TEST_CONTEXT === "1";
}

export function isProductionDevTestContextFlagEnabled(): boolean {
  return process.env.WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT === "1";
}

export function isDevTestContextEnabledForSystemAdmin(isSystemAdmin: boolean): boolean {
  if (!canSwitchTestAccount({ isSystemAdmin })) return false;
  if (!isDevTestContextFlagEnabled()) return false;
  if (isDevTestContextRuntimeAllowed()) return true;
  if (isServerProductionRuntime()) return isProductionDevTestContextFlagEnabled();
  return false;
}

export function isDevTestContextEnabled(): boolean {
  return isDevTestContextEnabledForSystemAdmin(true);
}

export function getDevTestContextDisabledReasonForSystemAdmin(isSystemAdmin: boolean): DevTestContextDisabledReason {
  if (!canSwitchTestAccount({ isSystemAdmin })) return "production";
  if (!isDevTestContextFlagEnabled()) {
    return "flag_disabled";
  }
  if (isDevTestContextRuntimeAllowed()) return null;
  if (isServerProductionRuntime()) {
    return isProductionDevTestContextFlagEnabled() ? null : "production_impersonation_flag_disabled";
  }
  return "production";
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
