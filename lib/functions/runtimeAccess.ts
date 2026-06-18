import "server-only";

export const WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES = ["development", "dev", "local", "test", "demo"] as const;

export type WaflFunctionsRuntimeMode =
  | (typeof WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES)[number]
  | "production"
  | "unknown";

export function getWaflFunctionsRuntimeMode(): WaflFunctionsRuntimeMode {
  const rawMode = process.env.NEXT_PUBLIC_APP_RUNTIME_MODE?.trim().toLowerCase();
  if (!rawMode || rawMode === "production") return "production";
  if (WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES.includes(rawMode as (typeof WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES)[number])) {
    return rawMode as (typeof WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES)[number];
  }
  return "unknown";
}

export function isWaflFunctionsRuntimeAllowed(): boolean {
  return WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES.includes(
    getWaflFunctionsRuntimeMode() as (typeof WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES)[number],
  );
}
