import type { MaterialReadStatus, MaterialReadViewState } from "./WorkOrderMaterialsReadOnly";
import type { MaterialType, WorkOrderMaterialLine } from "../../domain/mobileContract";

export type MaterialCacheEntry = MaterialReadViewState & {
  readonly nextCursor: string | null;
  readonly failedCursor: string | null;
  readonly entityVersion: number | null;
  readonly touchedAt: number;
  readonly archivedStatus?: MaterialReadStatus;
  readonly archivedItems?: readonly WorkOrderMaterialLine[];
  readonly archivedNextCursor?: string | null;
  readonly archivedHasMore?: boolean;
  readonly archivedTotalCount?: number;
  readonly archivedErrorMessage?: string | null;
};

export const EMPTY_MATERIAL_STATE: MaterialReadViewState = {
  status: "not-loaded",
  items: [],
  hasMore: false,
  errorMessage: null,
};

const MATERIAL_CACHE_LIMIT = 12;

export function materialCacheKey(workOrderId: string, materialType: MaterialType) {
  return `${workOrderId}:${materialType}`;
}

export function archivedMaterialState(entry: MaterialCacheEntry | undefined): MaterialReadViewState {
  return {
    status: entry?.archivedStatus ?? "not-loaded",
    items: entry?.archivedItems ?? [],
    hasMore: entry?.archivedHasMore ?? false,
    errorMessage: entry?.archivedErrorMessage ?? null,
  };
}

export function putBoundedMaterialEntry(
  cache: Readonly<Record<string, MaterialCacheEntry>>,
  key: string,
  entry: MaterialCacheEntry,
): Readonly<Record<string, MaterialCacheEntry>> {
  const next: Record<string, MaterialCacheEntry> = { ...cache, [key]: entry };
  const keys = Object.keys(next);
  if (keys.length <= MATERIAL_CACHE_LIMIT) return next;
  const eviction = keys
    .filter((candidate) => candidate !== key)
    .sort((left, right) => next[left].touchedAt - next[right].touchedAt)[0];
  if (eviction) delete next[eviction];
  return next;
}
