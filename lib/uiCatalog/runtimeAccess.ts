import "server-only";

import { canViewUICatalog } from "@/lib/runtime/runtimePolicy";

export const WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES = [
  "system_admin",
] as const;

export type WaflUiCatalogRuntimeMode =
  | (typeof WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES)[number];

export function getWaflUiCatalogRuntimeMode(): WaflUiCatalogRuntimeMode {
  return "system_admin";
}

export function isWaflUiCatalogRuntimeAllowed(): boolean {
  return canViewUICatalog({ isSystemAdmin: true });
}
