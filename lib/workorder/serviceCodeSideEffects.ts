import { WORKORDER_SERVICE_CODE, type WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";

export const WORKORDER_SERVICE_DIRECTION = {
  immediate: "immediate",
  explicitSave: "explicit_save",
  forwardWorkflow: "forward_workflow",
  backwardWorkflow: "backward_workflow",
  memo: "memo",
  attachment: "attachment",
  storage: "storage",
  reorder: "reorder",
  query: "query",
} as const;

export type WorkOrderServiceDirectionValue =
  (typeof WORKORDER_SERVICE_DIRECTION)[keyof typeof WORKORDER_SERVICE_DIRECTION];

export const WORKORDER_SERVICE_RESOURCE = {
  workOrders: "spec_sheets",
  factoryOrders: "orders",
  materials: "spec_sheet_materials",
  outsourcing: "spec_sheet_outsourcing_lines",
  memos: "memos",
  attachments: "attachments",
  history: "workorder_history",
  r2Objects: "r2_objects",
  none: "none",
} as const;

export type WorkOrderServiceResourceValue =
  (typeof WORKORDER_SERVICE_RESOURCE)[keyof typeof WORKORDER_SERVICE_RESOURCE];

export const WORKORDER_SERVICE_OPERATION = {
  none: "none",
  select: "select",
  insert: "insert",
  update: "update",
  delete: "delete",
  replace: "replace",
  softDelete: "soft_delete",
  restore: "restore",
  r2Put: "r2_put",
  r2Delete: "r2_delete",
  r2Purge: "r2_purge",
} as const;

export type WorkOrderServiceOperationValue =
  (typeof WORKORDER_SERVICE_OPERATION)[keyof typeof WORKORDER_SERVICE_OPERATION];

export type WorkOrderServiceSideEffect = {
  code: WorkOrderServiceCodeValue;
  direction: WorkOrderServiceDirectionValue;
  resources: readonly WorkOrderServiceResourceValue[];
  operations: readonly WorkOrderServiceOperationValue[];
  allowsProductionCompositionReplace: boolean;
  allowsR2Delete: boolean;
};

const EMPTY_RESOURCES = [WORKORDER_SERVICE_RESOURCE.none] as const;
const EMPTY_OPERATIONS = [WORKORDER_SERVICE_OPERATION.none] as const;

function createSideEffect(input: WorkOrderServiceSideEffect): WorkOrderServiceSideEffect {
  return input;
}

export const WORKORDER_SERVICE_SIDE_EFFECTS = {
  [WORKORDER_SERVICE_CODE.titleImmediateSave]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.titleImmediateSave,
    direction: WORKORDER_SERVICE_DIRECTION.immediate,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.assigneeImmediateSave]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.assigneeImmediateSave,
    direction: WORKORDER_SERVICE_DIRECTION.immediate,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.basicInfoImmediateSave]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.basicInfoImmediateSave,
    direction: WORKORDER_SERVICE_DIRECTION.immediate,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.inventoryImmediateSave]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.inventoryImmediateSave,
    direction: WORKORDER_SERVICE_DIRECTION.immediate,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.orderInfoSave]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.orderInfoSave,
    direction: WORKORDER_SERVICE_DIRECTION.explicitSave,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.factoryOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.replace, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: true,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.productionCompositionSave]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.productionCompositionSave,
    direction: WORKORDER_SERVICE_DIRECTION.explicitSave,
    resources: [
      WORKORDER_SERVICE_RESOURCE.workOrders,
      WORKORDER_SERVICE_RESOURCE.factoryOrders,
      WORKORDER_SERVICE_RESOURCE.materials,
      WORKORDER_SERVICE_RESOURCE.outsourcing,
      WORKORDER_SERVICE_RESOURCE.history,
    ],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.replace, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: true,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.requestReview]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.requestReview,
    direction: WORKORDER_SERVICE_DIRECTION.forwardWorkflow,
    resources: [
      WORKORDER_SERVICE_RESOURCE.workOrders,
      WORKORDER_SERVICE_RESOURCE.factoryOrders,
      WORKORDER_SERVICE_RESOURCE.materials,
      WORKORDER_SERVICE_RESOURCE.outsourcing,
      WORKORDER_SERVICE_RESOURCE.history,
    ],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.replace, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: true,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.approveReview]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.approveReview,
    direction: WORKORDER_SERVICE_DIRECTION.forwardWorkflow,
    resources: [
      WORKORDER_SERVICE_RESOURCE.workOrders,
      WORKORDER_SERVICE_RESOURCE.factoryOrders,
      WORKORDER_SERVICE_RESOURCE.materials,
      WORKORDER_SERVICE_RESOURCE.outsourcing,
      WORKORDER_SERVICE_RESOURCE.history,
    ],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.replace, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: true,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.requestOrder]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.requestOrder,
    direction: WORKORDER_SERVICE_DIRECTION.forwardWorkflow,
    resources: [
      WORKORDER_SERVICE_RESOURCE.workOrders,
      WORKORDER_SERVICE_RESOURCE.factoryOrders,
      WORKORDER_SERVICE_RESOURCE.materials,
      WORKORDER_SERVICE_RESOURCE.outsourcing,
      WORKORDER_SERVICE_RESOURCE.history,
    ],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.replace, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: true,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.completeInspection]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.completeInspection,
    direction: WORKORDER_SERVICE_DIRECTION.forwardWorkflow,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: true,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.completeWorkOrder]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.completeWorkOrder,
    direction: WORKORDER_SERVICE_DIRECTION.forwardWorkflow,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: true,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.rejectReview]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.rejectReview,
    direction: WORKORDER_SERVICE_DIRECTION.backwardWorkflow,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.cancelOrder]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.cancelOrder,
    direction: WORKORDER_SERVICE_DIRECTION.backwardWorkflow,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.revertWorkflow]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.revertWorkflow,
    direction: WORKORDER_SERVICE_DIRECTION.backwardWorkflow,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.memoCreate]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.memoCreate,
    direction: WORKORDER_SERVICE_DIRECTION.memo,
    resources: [WORKORDER_SERVICE_RESOURCE.memos, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.memoUpdate]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.memoUpdate,
    direction: WORKORDER_SERVICE_DIRECTION.memo,
    resources: [WORKORDER_SERVICE_RESOURCE.memos, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.memoDelete]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.memoDelete,
    direction: WORKORDER_SERVICE_DIRECTION.memo,
    resources: [WORKORDER_SERVICE_RESOURCE.memos, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.softDelete, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.designAttachmentPrepare]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.designAttachmentPrepare,
    direction: WORKORDER_SERVICE_DIRECTION.attachment,
    resources: [WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.r2Objects],
    operations: [WORKORDER_SERVICE_OPERATION.insert, WORKORDER_SERVICE_OPERATION.r2Put],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.fileAttachmentPrepare]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.fileAttachmentPrepare,
    direction: WORKORDER_SERVICE_DIRECTION.attachment,
    resources: [WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.r2Objects],
    operations: [WORKORDER_SERVICE_OPERATION.insert, WORKORDER_SERVICE_OPERATION.r2Put],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.attachmentUploadComplete]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.attachmentUploadComplete,
    direction: WORKORDER_SERVICE_DIRECTION.attachment,
    resources: [WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.attachmentDeleteRequest]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.attachmentDeleteRequest,
    direction: WORKORDER_SERVICE_DIRECTION.attachment,
    resources: [WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.softDelete, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.primaryDesignSet]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.primaryDesignSet,
    direction: WORKORDER_SERVICE_DIRECTION.attachment,
    resources: [WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.update, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.workOrderDelete]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.workOrderDelete,
    direction: WORKORDER_SERVICE_DIRECTION.storage,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.memos, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.softDelete, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.workOrderRestore]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.workOrderRestore,
    direction: WORKORDER_SERVICE_DIRECTION.storage,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.memos, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.restore, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.attachmentMemoRestore]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.attachmentMemoRestore,
    direction: WORKORDER_SERVICE_DIRECTION.storage,
    resources: [WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.memos, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.restore, WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.trashPurge]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.trashPurge,
    direction: WORKORDER_SERVICE_DIRECTION.storage,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.attachments, WORKORDER_SERVICE_RESOURCE.memos, WORKORDER_SERVICE_RESOURCE.r2Objects],
    operations: [WORKORDER_SERVICE_OPERATION.delete, WORKORDER_SERVICE_OPERATION.r2Purge],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: true,
  }),
  [WORKORDER_SERVICE_CODE.reorderCreate]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.reorderCreate,
    direction: WORKORDER_SERVICE_DIRECTION.reorder,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders, WORKORDER_SERVICE_RESOURCE.history],
    operations: [WORKORDER_SERVICE_OPERATION.insert],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.listQuery]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.listQuery,
    direction: WORKORDER_SERVICE_DIRECTION.query,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders],
    operations: [WORKORDER_SERVICE_OPERATION.select],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.detailQuery]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.detailQuery,
    direction: WORKORDER_SERVICE_DIRECTION.query,
    resources: [
      WORKORDER_SERVICE_RESOURCE.workOrders,
      WORKORDER_SERVICE_RESOURCE.factoryOrders,
      WORKORDER_SERVICE_RESOURCE.materials,
      WORKORDER_SERVICE_RESOURCE.outsourcing,
      WORKORDER_SERVICE_RESOURCE.attachments,
      WORKORDER_SERVICE_RESOURCE.memos,
      WORKORDER_SERVICE_RESOURCE.history,
    ],
    operations: [WORKORDER_SERVICE_OPERATION.select],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
  [WORKORDER_SERVICE_CODE.summaryQuery]: createSideEffect({
    code: WORKORDER_SERVICE_CODE.summaryQuery,
    direction: WORKORDER_SERVICE_DIRECTION.query,
    resources: [WORKORDER_SERVICE_RESOURCE.workOrders],
    operations: [WORKORDER_SERVICE_OPERATION.select],
    allowsProductionCompositionReplace: false,
    allowsR2Delete: false,
  }),
} as const satisfies Record<WorkOrderServiceCodeValue, WorkOrderServiceSideEffect>;

export function getWorkOrderServiceSideEffect(
  serviceCode: WorkOrderServiceCodeValue,
): WorkOrderServiceSideEffect {
  return WORKORDER_SERVICE_SIDE_EFFECTS[serviceCode];
}

export function getWorkOrderServiceResources(
  serviceCode: WorkOrderServiceCodeValue | null | undefined,
): readonly WorkOrderServiceResourceValue[] {
  if (!serviceCode) return EMPTY_RESOURCES;
  return WORKORDER_SERVICE_SIDE_EFFECTS[serviceCode]?.resources ?? EMPTY_RESOURCES;
}

export function getWorkOrderServiceOperations(
  serviceCode: WorkOrderServiceCodeValue | null | undefined,
): readonly WorkOrderServiceOperationValue[] {
  if (!serviceCode) return EMPTY_OPERATIONS;
  return WORKORDER_SERVICE_SIDE_EFFECTS[serviceCode]?.operations ?? EMPTY_OPERATIONS;
}

export function canWorkOrderServiceTouchResource(input: {
  serviceCode: WorkOrderServiceCodeValue | null | undefined;
  resource: WorkOrderServiceResourceValue;
}): boolean {
  return getWorkOrderServiceResources(input.serviceCode).includes(input.resource);
}

export function canWorkOrderServiceUseOperation(input: {
  serviceCode: WorkOrderServiceCodeValue | null | undefined;
  operation: WorkOrderServiceOperationValue;
}): boolean {
  return getWorkOrderServiceOperations(input.serviceCode).includes(input.operation);
}

export function canWorkOrderServiceDeleteR2Object(
  serviceCode: WorkOrderServiceCodeValue | null | undefined,
): boolean {
  if (!serviceCode) return false;
  return WORKORDER_SERVICE_SIDE_EFFECTS[serviceCode]?.allowsR2Delete ?? false;
}
