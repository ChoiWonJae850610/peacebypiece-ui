export type AppRuntimeMode = "development" | "production";

// 개발/운영 전환은 이 값 1곳에서만 조정
export const APP_RUNTIME_MODE: AppRuntimeMode = "development";

// 디버그 패널 표시 여부는 이 값들만 수정
export const DEBUG_FLAGS = {
  orderInfoHubPanel: false,
  adminHistoryDebugPanel: true,
  orderRequestDocumentDebug: false,
} as const;

export type DebugFlagKey = keyof typeof DEBUG_FLAGS;

export function isDevelopmentRuntime(mode: AppRuntimeMode = APP_RUNTIME_MODE) {
  return mode === "development";
}

export function isDebugFeatureEnabled(flag: DebugFlagKey) {
  return isDevelopmentRuntime() && DEBUG_FLAGS[flag];
}

export const WORKORDER_CATEGORY_RECOMMENDATION_ENABLED = false;
