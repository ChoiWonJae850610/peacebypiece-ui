export const WORK_ORDER_MAJOR_CATEGORY_CODES: readonly ["T", "B", "O", "D", "S", "X"];
export type WorkOrderMajorCategoryCode = (typeof WORK_ORDER_MAJOR_CATEGORY_CODES)[number];
export function decodeWorkOrderMajorCategoryCode(productTypeCode: string | null): WorkOrderMajorCategoryCode | null;
