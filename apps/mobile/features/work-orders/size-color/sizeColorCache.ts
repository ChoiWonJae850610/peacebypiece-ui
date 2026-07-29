import type { WorkOrderSizeColorBundle } from "@/domain/mobileContract";

export type SizeColorReadStatus = "not-loaded" | "loading" | "retrying" | "empty" | "loaded" | "error";

export type SizeColorCacheEntry = {
  readonly status: SizeColorReadStatus;
  readonly bundle: WorkOrderSizeColorBundle | null;
  readonly errorMessage: string | null;
  readonly touchedAt: number;
};

export const EMPTY_SIZE_COLOR_STATE: SizeColorCacheEntry = {
  status: "not-loaded",
  bundle: null,
  errorMessage: null,
  touchedAt: 0,
};

export function putBoundedSizeColorEntry(
  cache: Readonly<Record<string, SizeColorCacheEntry>>,
  key: string,
  entry: SizeColorCacheEntry,
  maximumEntries = 6,
): Readonly<Record<string, SizeColorCacheEntry>> {
  const next = { ...cache, [key]: entry };
  const overflow = Object.entries(next)
    .filter(([candidate]) => candidate !== key)
    .sort((left, right) => left[1].touchedAt - right[1].touchedAt)
    .slice(0, Math.max(0, Object.keys(next).length - maximumEntries));
  for (const [candidate] of overflow) delete next[candidate];
  return next;
}

export function isSizeColorBundleEmpty(bundle: WorkOrderSizeColorBundle) {
  const { matrix, specifications } = bundle;
  return matrix.sizes.length === 0
    && matrix.colors.length === 0
    && matrix.quantityCells.length === 0
    && specifications.sizes.length === 0
    && specifications.pomColumns.length === 0
    && specifications.cells.length === 0;
}
