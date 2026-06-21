import "server-only";

import { canViewFunctionsCatalog } from "@/lib/runtime/runtimePolicy";

export const WAFL_FUNCTIONS_ALLOWED_RUNTIME_MODES = ["system_admin"] as const;

export type WaflFunctionsRuntimeMode = "system_admin";

export function getWaflFunctionsRuntimeMode(): WaflFunctionsRuntimeMode {
  return "system_admin";
}

export function isWaflFunctionsRuntimeAllowed(): boolean {
  return canViewFunctionsCatalog({ isSystemAdmin: true });
}
