import type { WorkOrderMajorCategoryCode, WorkOrderTargetAudience } from "./workOrderCategoryPolicy";
import type { WaflSystemSpecItem } from "./systemSpecItemCatalog";

export const WAFL_ALPHA_SYSTEM_SIZE_LABELS: readonly ["XS", "S", "M", "L", "XL", "2XL", "FREE"];
export const WAFL_KOREAN_SYSTEM_SIZE_LABELS: readonly ["44", "55", "66", "77", "88"];
export const WAFL_WAIST_SYSTEM_SIZE_LABELS: readonly ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"];
export function listWaflAllSystemSizeLabels(): readonly string[];
export function resolveWaflRecommendedSizeLabels(targetAudience: WorkOrderTargetAudience, categoryCode: WorkOrderMajorCategoryCode | null): readonly string[];
export function resolveWaflSizeRecommendationSections(targetAudience: WorkOrderTargetAudience, categoryCode: WorkOrderMajorCategoryCode | null): Readonly<{ recommended: readonly string[]; additional: readonly string[] }>;
export function resolveWaflRecommendedSpecCodes(categoryCode: WorkOrderMajorCategoryCode | null, itemCode: string | null): readonly string[];
export function listWaflRecommendedSpecItems(categoryCode: WorkOrderMajorCategoryCode | null, itemCode: string | null, systemItems: readonly WaflSystemSpecItem[]): readonly WaflSystemSpecItem[];
export function resolveWaflSpecRecommendationSections(categoryCode: WorkOrderMajorCategoryCode | null, itemCode: string | null, systemItems: readonly WaflSystemSpecItem[]): Readonly<{ recommended: readonly WaflSystemSpecItem[]; additional: readonly WaflSystemSpecItem[] }>;
export function isKnownWaflRecommendationDetail(categoryCode: WorkOrderMajorCategoryCode | null, itemCode: string | null): boolean;
