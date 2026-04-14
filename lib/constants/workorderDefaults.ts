import { DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";
import { PRIORITY_OPTIONS, SEASON_OPTIONS } from "@/lib/constants/workorderOptions";

export const LEGACY_UNSPECIFIED_TEXT = "미정" as const;
export const STORAGE_EMPTY_TEXT = "" as const;

export const DEFAULT_WORKORDER_CATEGORY1 = DEFAULT_CATEGORY1;
export const DEFAULT_WORKORDER_CATEGORY2 = DEFAULT_CATEGORY2;
export const DEFAULT_WORKORDER_CATEGORY3 = DEFAULT_CATEGORY3;
export const DEFAULT_WORKORDER_SEASON = SEASON_OPTIONS[3] ?? "ALL";
export const DEFAULT_WORKORDER_PRIORITY = PRIORITY_OPTIONS[1] ?? PRIORITY_OPTIONS[0] ?? "일반";
export const DEFAULT_WORKORDER_VENDOR = STORAGE_EMPTY_TEXT;
export const DEFAULT_WORKORDER_DUE_DATE = STORAGE_EMPTY_TEXT;

export function normalizeStoredOptionalText(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed === LEGACY_UNSPECIFIED_TEXT) return STORAGE_EMPTY_TEXT;
  return trimmed;
}

export function normalizeStoredSeason(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || DEFAULT_WORKORDER_SEASON;
}

export function normalizeStoredPriority(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed === "보통") return DEFAULT_WORKORDER_PRIORITY;
  return trimmed;
}

export function normalizeStoredCategory(value: string | null | undefined, fallback: string) {
  const trimmed = String(value ?? "").trim();
  return trimmed || fallback;
}
