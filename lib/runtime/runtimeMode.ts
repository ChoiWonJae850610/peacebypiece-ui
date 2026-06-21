import { canViewDiagnostics } from "@/lib/runtime/runtimePolicy";

export type AppRuntimeMode = "permission-gated";

export const APP_RUNTIME_MODE: AppRuntimeMode = "permission-gated";

export const RUNTIME_VISIBILITY = {
  showDiagnostics: false,
  showRepositoryBadges: false,
  showUserSwitchingTools: false,
  showPersonalLanguageSwitcher: false,
} as const;

export const DEV_DEBUG_FLAGS = {
  orderInfoHubPanel: false,
  orderRequestDocumentDebug: false,
} as const;

export type DevDebugFlagKey = keyof typeof DEV_DEBUG_FLAGS;

export function isDebugFeatureEnabled(flag: DevDebugFlagKey) {
  return canViewDiagnostics({ isSystemAdmin: false }) && DEV_DEBUG_FLAGS[flag];
}

export const WORKORDER_CATEGORY_RECOMMENDATION_ENABLED = false;
