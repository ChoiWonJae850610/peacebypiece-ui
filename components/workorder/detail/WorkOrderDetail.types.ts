import type { DisplayStage } from "@/types/workflow";
import type { RoleType, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export type WorkOrderDetailBaseModel = {
  workOrder: WorkOrder;
  currentInventoryQuantity: number;
  isEmpty?: boolean;
};

export type WorkOrderDetailPersistenceModel = {
  saveStatus: "saved" | "dirty" | "saving";
  lastSavedAt: string | null;
};

export type WorkOrderDetailIdentityModel = {
  currentUserName: string;
  currentUserRole: RoleType;
};

export type WorkOrderDetailPermissionModel = {
  canRenameTitle?: boolean;
  canEditInventory: boolean;
  canChangeManager: boolean;
  canSeeProductionSections: boolean;
  canSeeCostSections: boolean;
  isReviewRequestLocked: boolean;
};

export type WorkOrderDetailCostModel = {
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  totalCost: number;
  unitCost: number;
};

export type WorkOrderDetailDisclosureModel = {
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onToggleBasicInfo: () => void;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  onSetMaterialOpen: (next: boolean) => void;
  onSetOutsourcingOpen: (next: boolean) => void;
};

export type WorkOrderDetailWorkflowModel = {
  currentWorkflowState: WorkflowState;
  visibleStages: DisplayStage[];
  currentDisplayStage: DisplayStage;
  actions: WorkflowAction[];
};

export type WorkOrderDetailActionModel = {
  onSave: () => void;
  onOpenInventoryEditor: () => void;
  onOpenManagerAssignModal: () => void;
  onAction: (action: WorkflowAction) => void;
  onUpdateWorkOrder: (patch: Partial<WorkOrder>) => void;
  onRenameWorkOrderTitle: (nextTitle: string) => void;
  onCompleteInspection: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
};

export type WorkOrderDetailProps = WorkOrderDetailBaseModel &
  WorkOrderDetailPersistenceModel &
  WorkOrderDetailIdentityModel &
  WorkOrderDetailPermissionModel &
  WorkOrderDetailCostModel &
  WorkOrderDetailDisclosureModel &
  WorkOrderDetailWorkflowModel &
  WorkOrderDetailActionModel;
