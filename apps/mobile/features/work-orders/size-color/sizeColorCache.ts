import type { WorkOrderSizeColorBundle } from "@/domain/mobileContract";
import { promoteSizeColorBundleVersion } from "./sizeColorReconciliation.ts";
import { sizeColorRequestKey } from "./sizeColorQueryPolicy.ts";

export type SizeColorReadStatus = "not-loaded" | "loading" | "retrying" | "refreshing" | "empty" | "loaded" | "error";

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

export function promoteSizeColorCacheProjection(
  cache: Readonly<Record<string, SizeColorCacheEntry>>,
  input: {
    readonly workOrderId: string;
    readonly currentVersion: number;
    readonly nextVersion: number;
    readonly updater: (bundle: WorkOrderSizeColorBundle) => WorkOrderSizeColorBundle;
    readonly touchedAt: number;
  },
): Readonly<Record<string, SizeColorCacheEntry>> {
  const current = cache[sizeColorRequestKey(input.workOrderId, input.currentVersion)];
  if (!current?.bundle) return cache;
  const bundle = promoteSizeColorBundleVersion(input.updater(current.bundle), input.nextVersion);
  return putBoundedSizeColorEntry(cache, sizeColorRequestKey(input.workOrderId, input.nextVersion), {
    status: isSizeColorBundleEmpty(bundle) ? "empty" : "loaded",
    bundle,
    errorMessage: null,
    touchedAt: input.touchedAt,
  });
}
