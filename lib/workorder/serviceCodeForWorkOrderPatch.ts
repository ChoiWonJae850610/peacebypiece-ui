import { WORKORDER_SERVICE_CODE, type WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import type { WorkOrder } from "@/types/workorder";

const TITLE_FIELDS = ["title", "baseTitle", "displayTitle"] as const satisfies readonly (keyof WorkOrder)[];
const ASSIGNEE_FIELDS = ["manager", "managerId"] as const satisfies readonly (keyof WorkOrder)[];
const BASIC_INFO_FIELDS = [
  "category1",
  "category2",
  "category3",
  "category1Id",
  "category2Id",
  "category3Id",
  "season",
  "workOrderKind",
  "dueDate",
] as const satisfies readonly (keyof WorkOrder)[];
const INVENTORY_FIELDS = ["inventoryQuantity", "inventoryStatus"] as const satisfies readonly (keyof WorkOrder)[];

function hasAnyPatchField(patch: Partial<WorkOrder>, fields: readonly (keyof WorkOrder)[]): boolean {
  return fields.some((field) => Object.prototype.hasOwnProperty.call(patch, field));
}

export function getWorkOrderImmediatePatchServiceCode(
  patch: Partial<WorkOrder>,
): WorkOrderServiceCodeValue | null {
  if (hasAnyPatchField(patch, INVENTORY_FIELDS)) return WORKORDER_SERVICE_CODE.inventoryImmediateSave;
  if (hasAnyPatchField(patch, ASSIGNEE_FIELDS)) return WORKORDER_SERVICE_CODE.assigneeImmediateSave;
  if (hasAnyPatchField(patch, TITLE_FIELDS)) return WORKORDER_SERVICE_CODE.titleImmediateSave;
  if (hasAnyPatchField(patch, BASIC_INFO_FIELDS)) return WORKORDER_SERVICE_CODE.basicInfoImmediateSave;
  return null;
}
