import type { WorkOrderMajorCategoryCode } from "./workOrderCategoryPolicy";
export type WaflSystemSpecItem = { readonly key: string; readonly categoryCode: WorkOrderMajorCategoryCode; readonly code: string; readonly displayName: string };
export const WAFL_SYSTEM_SPEC_ITEM_CATALOG: Readonly<Record<WorkOrderMajorCategoryCode, readonly WaflSystemSpecItem[]>>;
export function listWaflSystemSpecItems(categoryCode: WorkOrderMajorCategoryCode | null): readonly WaflSystemSpecItem[];
export function findWaflSystemSpecItem(categoryCode: WorkOrderMajorCategoryCode, key: string): WaflSystemSpecItem | null;
