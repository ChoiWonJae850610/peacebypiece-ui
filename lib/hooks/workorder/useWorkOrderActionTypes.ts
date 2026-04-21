import type { Dispatch, SetStateAction } from "react";
import type { RoleType } from "@/types/permission";
import type { HistoryLog, UserProfile, WorkOrder, WorkflowAction } from "@/types/workorder";
import type { WorkOrderAsyncActionFailure, WorkOrderAsyncActionKey } from "@/lib/workorder/actionFlow";

export type SaveStatus = "saved" | "dirty" | "saving";
export type AsyncOperationStatus = "idle" | "loading" | "ready" | "error";

export type InventoryChangeInput = {
  inboundQuantity: number;
  adjustmentQuantity: number;
  deductionQuantity: number;
  memo: string;
};

export type InspectionCompleteInput = {
  orderEntryId: string;
  inboundQuantity: number;
  nextInventoryQuantity: number;
  memo: string;
};

export type CreateWorkOrderInput = {
  nextIndex: number;
  title?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  season?: string;
};

export type ChangeManagerInput = {
  workOrder: WorkOrder;
  managerId: string;
  users: UserProfile[];
  canChangeManager: boolean;
  isReviewRequestLocked: boolean;
  currentWorkflowState?: WorkOrder["workflowState"];
};

export type DeleteWorkOrderInput = {
  workOrderId: string;
  workOrders: WorkOrder[];
  selectedId: string;
};

export type RenameWorkOrderTitleInput = {
  workOrders: WorkOrder[];
  workOrder: WorkOrder;
  nextTitle: string;
};

export type UpdateSelectedWorkOrderInput = {
  workOrderId: string;
  patch: Partial<WorkOrder>;
  isReviewRequestLocked: boolean;
};

export type WorkOrderActionRuntimeSetters = {
  setActionStatus: (actionKey: WorkOrderAsyncActionKey, status: AsyncOperationStatus) => void;
  setActionError: (actionKey: WorkOrderAsyncActionKey, message: string | null) => void;
  setActionFailure?: (actionKey: WorkOrderAsyncActionKey, failure: WorkOrderAsyncActionFailure | null) => void;
};

export type WorkOrderActionStateSetters = {
  setUsers: Dispatch<SetStateAction<UserProfile[]>>;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setHistoryLogs: Dispatch<SetStateAction<HistoryLog[]>>;
  setSelectedId: Dispatch<SetStateAction<string>>;
  setLastSavedAt: Dispatch<SetStateAction<string | null>>;
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>;
  setToastMessage: Dispatch<SetStateAction<string | null>>;
  setCreateWorkOrderModalOpen: Dispatch<SetStateAction<boolean>>;
  setInventoryEditorOpen: Dispatch<SetStateAction<boolean>>;
  setManagerAssignModalOpen: Dispatch<SetStateAction<boolean>>;
  setPendingWorkflowAction: Dispatch<SetStateAction<WorkflowAction | null>>;
  setOrderRequestConfirmOpen: Dispatch<SetStateAction<boolean>>;
};

export type UseWorkOrderActionsParams = {
  currentUser: UserProfile;
  canCreateWorkOrder: boolean;
  canReorderWorkOrder: boolean;
  pendingWorkflowAction: WorkflowAction | null;
  workOrders: WorkOrder[];
} & WorkOrderActionStateSetters & WorkOrderActionRuntimeSetters;

export type WorkflowStateActionHandlers = {
  applyWorkflowAction: (workOrder: WorkOrder, action: WorkflowAction) => void;
  setPendingWorkflowAction: Dispatch<SetStateAction<WorkflowAction | null>>;
  setOrderRequestConfirmOpen: Dispatch<SetStateAction<boolean>>;
};

export type AdminActionBaseParams = Pick<
  UseWorkOrderActionsParams,
  "currentUser" | "setUsers" | "setWorkOrders" | "setHistoryLogs" | "setSaveStatus" | "setToastMessage" | "setManagerAssignModalOpen"
>;
