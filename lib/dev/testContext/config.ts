import "server-only";

import { canSwitchTestAccount } from "@/lib/runtime/runtimePolicy";

export function isDevTestContextRuntimeAllowed(): boolean {
  return true;
}

export function isDevTestContextFlagEnabled(): boolean {
  return true;
}

export function isDevTestContextEnabled(): boolean {
  return canSwitchTestAccount({ isSystemAdmin: true });
}

export function getDevTestContextDisabledReason(): "production" | "flag_disabled" | null {
  return null;
}
