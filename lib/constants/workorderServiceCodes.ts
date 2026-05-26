import { WORKFLOW_ACTION_TYPE, type WorkflowActionTypeValue } from "@/lib/constants/workflowActions";
import { WORKFLOW_STATE, type WorkflowStateValue } from "@/lib/constants/workorderStates";

export const WORKORDER_SERVICE_CODE = {
  titleImmediateSave: "WO-I001",
  assigneeImmediateSave: "WO-I002",
  basicInfoImmediateSave: "WO-I003",
  inventoryImmediateSave: "WO-I004",

  orderInfoSave: "WO-P001",
  productionCompositionSave: "WO-P002",

  requestReview: "WO-F001",
  approveReview: "WO-F002",
  requestOrder: "WO-F003",
  completeInspection: "WO-F004",
  completeWorkOrder: "WO-F005",

  rejectReview: "WO-B001",
  cancelOrder: "WO-B002",
  revertWorkflow: "WO-B003",

  memoCreate: "WO-M001",
  memoUpdate: "WO-M002",
  memoDelete: "WO-M003",

  designAttachmentPrepare: "WO-A001",
  fileAttachmentPrepare: "WO-A002",
  attachmentUploadComplete: "WO-A003",
  attachmentDeleteRequest: "WO-A004",
  primaryDesignSet: "WO-A005",

  workOrderDelete: "WO-S001",
  workOrderRestore: "WO-S002",
  attachmentMemoRestore: "WO-S003",
  trashPurge: "WO-S004",

  reorderCreate: "WO-R001",

  listQuery: "WO-Q001",
  detailQuery: "WO-Q002",
  summaryQuery: "WO-Q003",
} as const;

export const WORKORDER_SERVICE_CODES = [
  WORKORDER_SERVICE_CODE.titleImmediateSave,
  WORKORDER_SERVICE_CODE.assigneeImmediateSave,
  WORKORDER_SERVICE_CODE.basicInfoImmediateSave,
  WORKORDER_SERVICE_CODE.inventoryImmediateSave,
  WORKORDER_SERVICE_CODE.orderInfoSave,
  WORKORDER_SERVICE_CODE.productionCompositionSave,
  WORKORDER_SERVICE_CODE.requestReview,
  WORKORDER_SERVICE_CODE.approveReview,
  WORKORDER_SERVICE_CODE.requestOrder,
  WORKORDER_SERVICE_CODE.completeInspection,
  WORKORDER_SERVICE_CODE.completeWorkOrder,
  WORKORDER_SERVICE_CODE.rejectReview,
  WORKORDER_SERVICE_CODE.cancelOrder,
  WORKORDER_SERVICE_CODE.revertWorkflow,
  WORKORDER_SERVICE_CODE.memoCreate,
  WORKORDER_SERVICE_CODE.memoUpdate,
  WORKORDER_SERVICE_CODE.memoDelete,
  WORKORDER_SERVICE_CODE.designAttachmentPrepare,
  WORKORDER_SERVICE_CODE.fileAttachmentPrepare,
  WORKORDER_SERVICE_CODE.attachmentUploadComplete,
  WORKORDER_SERVICE_CODE.attachmentDeleteRequest,
  WORKORDER_SERVICE_CODE.primaryDesignSet,
  WORKORDER_SERVICE_CODE.workOrderDelete,
  WORKORDER_SERVICE_CODE.workOrderRestore,
  WORKORDER_SERVICE_CODE.attachmentMemoRestore,
  WORKORDER_SERVICE_CODE.trashPurge,
  WORKORDER_SERVICE_CODE.reorderCreate,
  WORKORDER_SERVICE_CODE.listQuery,
  WORKORDER_SERVICE_CODE.detailQuery,
  WORKORDER_SERVICE_CODE.summaryQuery,
] as const;
export type WorkOrderServiceCodeValue = (typeof WORKORDER_SERVICE_CODES)[number];

export function isWorkOrderServiceCode(value: unknown): value is WorkOrderServiceCodeValue {
  return typeof value === "string" && WORKORDER_SERVICE_CODES.includes(value as WorkOrderServiceCodeValue);
}

export const WORKORDER_EXPLICIT_SAVE_SCOPE = {
  orderInfo: "order_info",
  productionComposition: "production_composition",
} as const;

export type WorkOrderExplicitSaveScopeValue =
  (typeof WORKORDER_EXPLICIT_SAVE_SCOPE)[keyof typeof WORKORDER_EXPLICIT_SAVE_SCOPE];

export const WORKORDER_EXPLICIT_SAVE_SERVICE_CODE_BY_SCOPE = {
  [WORKORDER_EXPLICIT_SAVE_SCOPE.orderInfo]: WORKORDER_SERVICE_CODE.orderInfoSave,
  [WORKORDER_EXPLICIT_SAVE_SCOPE.productionComposition]: WORKORDER_SERVICE_CODE.productionCompositionSave,
} as const satisfies Record<WorkOrderExplicitSaveScopeValue, WorkOrderServiceCodeValue>;

export function getWorkOrderExplicitSaveServiceCode(
  scope: WorkOrderExplicitSaveScopeValue,
): WorkOrderServiceCodeValue {
  return WORKORDER_EXPLICIT_SAVE_SERVICE_CODE_BY_SCOPE[scope];
}

export const WORKORDER_WORKFLOW_ACTION_SERVICE_CODE_MAP = {
  [WORKFLOW_ACTION_TYPE.requestReview]: WORKORDER_SERVICE_CODE.requestReview,
  [WORKFLOW_ACTION_TYPE.cancelReviewRequest]: WORKORDER_SERVICE_CODE.revertWorkflow,
  [WORKFLOW_ACTION_TYPE.rejectReview]: WORKORDER_SERVICE_CODE.rejectReview,
  [WORKFLOW_ACTION_TYPE.cancelReviewApproval]: WORKORDER_SERVICE_CODE.revertWorkflow,
  [WORKFLOW_ACTION_TYPE.approveReview]: WORKORDER_SERVICE_CODE.approveReview,
  [WORKFLOW_ACTION_TYPE.requestOrder]: WORKORDER_SERVICE_CODE.requestOrder,
  [WORKFLOW_ACTION_TYPE.completeInspection]: WORKORDER_SERVICE_CODE.completeInspection,
  [WORKFLOW_ACTION_TYPE.requestReinspection]: WORKORDER_SERVICE_CODE.revertWorkflow,
} as const satisfies Record<WorkflowActionTypeValue, WorkOrderServiceCodeValue>;

export function getWorkOrderWorkflowServiceCode(payload: {
  actionType?: WorkflowActionTypeValue;
  nextState: WorkflowStateValue;
}): WorkOrderServiceCodeValue {
  if (payload.actionType) {
    return WORKORDER_WORKFLOW_ACTION_SERVICE_CODE_MAP[payload.actionType];
  }

  switch (payload.nextState) {
    case WORKFLOW_STATE.reviewRequested:
      return WORKORDER_SERVICE_CODE.requestReview;
    case WORKFLOW_STATE.reviewCompleted:
      return WORKORDER_SERVICE_CODE.approveReview;
    case WORKFLOW_STATE.materialOrderPending:
    case WORKFLOW_STATE.inspection:
      return WORKORDER_SERVICE_CODE.requestOrder;
    case WORKFLOW_STATE.completed:
      return WORKORDER_SERVICE_CODE.completeWorkOrder;
    case WORKFLOW_STATE.draft:
    case WORKFLOW_STATE.rejected:
    default:
      return WORKORDER_SERVICE_CODE.revertWorkflow;
  }
}
