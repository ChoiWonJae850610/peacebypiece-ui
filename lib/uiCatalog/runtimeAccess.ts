import "server-only";

export const WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES = [
  "development",
  "dev",
  "local",
  "test",
  "demo",
] as const;

export type WaflUiCatalogRuntimeMode =
  | (typeof WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES)[number]
  | "production"
  | "unknown";

export function getWaflUiCatalogRuntimeMode(): WaflUiCatalogRuntimeMode {
  const rawMode = process.env.NEXT_PUBLIC_APP_RUNTIME_MODE?.trim().toLowerCase();

  if (!rawMode) return "production";
  if (rawMode === "production") return "production";
  if (WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES.includes(rawMode as (typeof WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES)[number])) {
    return rawMode as (typeof WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES)[number];
  }

  return "unknown";
}

export function isWaflUiCatalogRuntimeAllowed(): boolean {
  return WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES.includes(
    getWaflUiCatalogRuntimeMode() as (typeof WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES)[number],
  );
}
