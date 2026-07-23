import type { MaterialDraftFields, MobileCurrentUser, WorkOrderDetailCore, WorkOrderMaterialLine } from "@/domain/mobileContract";

const UPDATE_PERMISSION = "workorder.update";

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
  return Boolean(
    canEditWorkOrder(detail, user)
    && line
    && line.lifecycle === "active"
    && line.status === "editing"
    && !line.locked,
  );
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
