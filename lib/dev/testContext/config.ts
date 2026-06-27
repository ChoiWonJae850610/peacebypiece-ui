import "server-only";

import { canSwitchTestAccount } from "@/lib/runtime/runtimePolicy";
import { isServerDevTestRuntime, isServerProductionRuntime } from "@/lib/runtime/serverRuntime";

export function isDevTestContextRuntimeAllowed(): boolean {
  return isServerDevTestRuntime();
}

export function isDevTestContextFlagEnabled(): boolean {
  return process.env.WAFL_ENABLE_DEV_TEST_CONTEXT === "1";
}

export function isDevTestContextEnabled(): boolean {
  return (
    canSwitchTestAccount({ isSystemAdmin: true }) &&
    isDevTestContextRuntimeAllowed() &&
    isDevTestContextFlagEnabled()
  );
}

export function getDevTestContextDisabledReason(): "production" | "flag_disabled" | null {
  if (isServerProductionRuntime() || !isDevTestContextRuntimeAllowed()) {
    return "production";
  }
  if (!isDevTestContextFlagEnabled()) {
    return "flag_disabled";
  }
  return null;
}
