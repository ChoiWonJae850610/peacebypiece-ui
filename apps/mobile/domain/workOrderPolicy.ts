import type { MaterialDraftFields, MobileCurrentUser, WorkOrderDetailCore, WorkOrderMaterialLine } from "@/domain/mobileContract";
import { resolveMaterialOrderPolicy, type MaterialOrderAction } from "./materialOrderPolicy.ts";

const UPDATE_PERMISSION = "workorder.update";
const ORDER_REQUEST_PERMISSION = "material.order.request";
const ORDER_COMPLETE_PERMISSION = "material.order.place";

export function hasWorkOrderUpdatePermission(user: MobileCurrentUser | null): boolean {
  return Boolean(user?.permissionCodes?.includes(UPDATE_PERMISSION));
}

export function canEditWorkOrder(
  detail: WorkOrderDetailCore | null,
  user: MobileCurrentUser | null,
): detail is WorkOrderDetailCore {
  return Boolean(
    detail
    && detail.header.status === "draft"
    && detail.revision.status === "draft"
    && hasWorkOrderUpdatePermission(user),
  );
}

export function canEditOverviewField(
  detail: WorkOrderDetailCore | null,
  user: MobileCurrentUser | null,
  field: "productName" | "dueDate" | "totalQuantity",
): boolean {
  return field.length > 0 && canEditWorkOrder(detail, user);
}

export function canEditMaterial(
  detail: WorkOrderDetailCore | null,
  user: MobileCurrentUser | null,
  line: WorkOrderMaterialLine | null,
): line is WorkOrderMaterialLine {
  return Boolean(line && materialOrderPolicyFor(detail, user, line).canEdit);
}

export function materialOrderPolicyFor(
  detail: WorkOrderDetailCore | null,
  user: MobileCurrentUser | null,
  line: WorkOrderMaterialLine,
) {
  return resolveMaterialOrderPolicy({
    status: line.status,
    lifecycle: line.lifecycle,
    currentDraft: Boolean(detail?.header.status === "draft" && detail.revision.status === "draft"),
    serverLocked: line.locked,
    canUpdate: hasWorkOrderUpdatePermission(user),
    canRequestOrder: Boolean(user?.permissionCodes?.includes(ORDER_REQUEST_PERMISSION)),
    canCompleteOrder: Boolean(user?.permissionCodes?.includes(ORDER_COMPLETE_PERMISSION)),
  });
}

export function canPerformMaterialOrderAction(
  detail: WorkOrderDetailCore | null,
  user: MobileCurrentUser | null,
  line: WorkOrderMaterialLine,
  action: MaterialOrderAction,
): boolean {
  const policy = materialOrderPolicyFor(detail, user, line);
  if (action === "request") return policy.canRequest;
  if (action === "cancel") return policy.canCancel;
  return policy.canComplete;
}

export function isMaterialFieldReadOnly(field: keyof MaterialDraftFields): boolean {
  return field === "orderQuantity";
}

export function canShowMaterialLifecycleActions(
  detail: WorkOrderDetailCore | null,
  user: MobileCurrentUser | null,
): boolean {
  return canEditWorkOrder(detail, user);
}
