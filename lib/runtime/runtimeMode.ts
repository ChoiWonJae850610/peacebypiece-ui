export type AppRuntimeMode = "production" | "development";

function resolveAppRuntimeMode(value: string | undefined): AppRuntimeMode {
  return value === "development" ? "development" : "production";
}

export const APP_RUNTIME_MODE: AppRuntimeMode = resolveAppRuntimeMode(
  process.env.NEXT_PUBLIC_APP_RUNTIME_MODE,
);

const isDevelopmentMode = APP_RUNTIME_MODE === "development";
const isTldrawPocEnabled = process.env.NEXT_PUBLIC_ENABLE_TLDRAW_POC === "true";
export const RUNTIME_VISIBILITY = {
  showDiagnostics: isDevelopmentMode,
  showRepositoryBadges: isDevelopmentMode,
  showUserSwitchingTools: isDevelopmentMode,
  showAdvancedDrawingTools: isDevelopmentMode && isTldrawPocEnabled,
  showPersonalLanguageSwitcher: isDevelopmentMode,
} as const;

export const DEV_DEBUG_FLAGS = {
  orderInfoHubPanel: false,
  orderRequestDocumentDebug: false,
} as const;

export type DevDebugFlagKey = keyof typeof DEV_DEBUG_FLAGS;

export function isDebugFeatureEnabled(flag: DevDebugFlagKey) {
  return RUNTIME_VISIBILITY.showDiagnostics && DEV_DEBUG_FLAGS[flag];
}

export const WORKORDER_CATEGORY_RECOMMENDATION_ENABLED = false;
