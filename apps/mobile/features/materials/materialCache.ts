import type { MaterialReadStatus, MaterialReadViewState } from "./WorkOrderMaterialsReadOnly";
import type { WorkOrderMaterialLine } from "../../domain/mobileContract";

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

const MATERIAL_CACHE_LIMIT = 6;

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
  workOrderId: string,
  entry: MaterialCacheEntry,
): Readonly<Record<string, MaterialCacheEntry>> {
  const next: Record<string, MaterialCacheEntry> = { ...cache, [workOrderId]: entry };
  const keys = Object.keys(next);
  if (keys.length <= MATERIAL_CACHE_LIMIT) return next;
  const eviction = keys
    .filter((key) => key !== workOrderId)
    .sort((left, right) => next[left].touchedAt - next[right].touchedAt)[0];
  if (eviction) delete next[eviction];
  return next;
}
