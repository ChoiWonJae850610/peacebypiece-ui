import "server-only";

export function isDevTestContextRuntimeAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function isDevTestContextFlagEnabled(): boolean {
  return process.env.WAFL_ENABLE_DEV_TEST_CONSOLE === "true";
}

export function isDevTestContextEnabled(): boolean {
  return isDevTestContextRuntimeAllowed() && isDevTestContextFlagEnabled();
}

export function getDevTestContextDisabledReason(): "production" | "flag_disabled" | null {
  if (!isDevTestContextRuntimeAllowed()) return "production";
  if (!isDevTestContextFlagEnabled()) return "flag_disabled";
  return null;
}
