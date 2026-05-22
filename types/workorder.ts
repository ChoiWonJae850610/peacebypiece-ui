import type { Material } from "@/types/material";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";
import type { InventoryChangeTypeValue, InventoryStatusValue, OrderEntryTargetTypeValue } from "@/lib/constants/workorderDomain";
import type { AttachmentScopeValue, WorkOrderKindValue } from "@/lib/constants/workorderIdentity";
import type { OrderInspectionStatusValue } from "@/lib/constants/workorderStates";
import type { WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import type { DisplayStage, HistoryCategory, HistoryFilter, HistoryTone, WorkflowAction, WorkflowState } from "@/types/workflow";

export type AttachmentScope = AttachmentScopeValue;

export type AttachmentType = "image" | "pdf" | "file";

export type Attachment = {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  storageKey?: string | null;
  thumbnailKey?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  scope?: AttachmentScope;
  ownerId?: string | null;
  ownerName?: string | null;
  linkedThreadId?: string | null;
  linkedReplyId?: string | null;
  isPrimary?: boolean | null;
};

export type MemoReply = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: RoleType;
  content: string;
  createdAt: string;
  attachmentIds?: string[];
  deletedAt?: string | null;
  isVisible?: boolean | null;
};

export type MemoThread = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: RoleType;
  content: string;
  createdAt: string;
  attachmentIds?: string[];
  deletedAt?: string | null;
  isVisible?: boolean | null;
  replies: MemoReply[];
};

export type Outsourcing = {
  id: string;
  process: string;
  vendor: string;
  vendorPartnerId?: string | null;
  quantity: number;
  unitType: string;
  unitCost: number;
  totalCost: number;
  status: string;
};

export type OrderInspectionStatus = OrderInspectionStatusValue;

export type FactoryOrderRequest = {
  factoryId: string;
  factoryName: string;
  quantity: number;
  requestedAt: string;
  requestedBy: string;
  requestedById?: string | null;
};

export type OrderEntry = {
  id: string;
  type: string;
  targetType: OrderEntryTargetTypeValue;
  factory: string;
  dueDate: string;
  quantity: number;
  laborCost: number;
  lossCost: number;
  priority: string;
  inspectionStatus?: OrderInspectionStatus;
};


export type WorkOrder = {
  reorderedFromId?: string | null;
  reorderedFromTitle?: string | null;
  id: string;
  title: string;
  displayTitle?: string;
  baseTitle?: string;
  workOrderKind?: WorkOrderKindValue;
  isDefectOrder?: boolean;
  reorderGroupId?: string;
  reorderRound?: number;
  parentSpecSheetId?: string | null;
  revision?: number;
  reorderRootId?: string;
  category1: string;
  category2: string;
  category3: string;
  category1Id?: string | null;
  category2Id?: string | null;
  category3Id?: string | null;
  season: string;
  priority: string;
  vendor: string;
  manager: string;
  managerId?: string | null;
  createdById: string;
  createdByRole: RoleType;
  dueDate: string;
  quantity: number;
  laborCost?: number;
  lossCost?: number;
  orderEntries?: OrderEntry[];
  inventoryQuantity: number;
  inventoryStatus: InventoryStatusValue;
  memo: string;
  materials: Material[];
  outsourcing: Outsourcing[];
  attachments: Attachment[];
  memoThreads: MemoThread[];
  workflowState: WorkflowState;
  lastSavedAt: string;
  factoryOrderRequest?: FactoryOrderRequest | null;
  hasDetailSnapshot?: boolean;
  summaryAttachmentCount?: number;
  summaryMemoThreadCount?: number;
};

export type WorkOrderListItem = Pick<
  WorkOrder,
  | "id"
  | "title"
  | "displayTitle"
  | "baseTitle"
  | "reorderRound"
  | "revision"
  | "workOrderKind"
  | "isDefectOrder"
  | "category1"
  | "category2"
  | "category3"
  | "vendor"
  | "dueDate"
  | "inventoryStatus"
  | "attachments"
> & {
  filesCount: number;
};

export type WorkOrderSummary = Pick<
  WorkOrder,
  | "id"
  | "title"
  | "displayTitle"
  | "baseTitle"
  | "workOrderKind"
  | "isDefectOrder"
  | "reorderGroupId"
  | "reorderRound"
  | "parentSpecSheetId"
  | "category1"
  | "category2"
  | "category3"
  | "category1Id"
  | "category2Id"
  | "category3Id"
  | "season"
  | "priority"
  | "vendor"
  | "manager"
  | "managerId"
  | "createdById"
  | "createdByRole"
  | "dueDate"
  | "quantity"
  | "inventoryQuantity"
  | "inventoryStatus"
  | "workflowState"
  | "lastSavedAt"
> & {
  orderEntryCount: number;
  materialCount: number;
  outsourcingCount: number;
  attachmentCount: number;
  memoThreadCount: number;
  hasDetailSnapshot: boolean;
  createdAt?: string;
  updatedAt?: string;
};


export type WorkOrderAuditActor = {
  id: string;
  name: string;
  role: RoleType;
};

export type WorkOrderStatePatch = Pick<WorkOrder, "id" | "workflowState" | "lastSavedAt"> &
  Partial<Pick<WorkOrder, "inventoryQuantity" | "inventoryStatus" | "factoryOrderRequest" | "orderEntries" | "materials" | "outsourcing">> & {
    auditActor?: WorkOrderAuditActor | null;
    serviceCode?: WorkOrderServiceCodeValue | null;
  };

export type WorkOrderStatePatchResult = WorkOrderStatePatch &
  Partial<Pick<WorkOrder, "hasDetailSnapshot">>;

export type HistoryDetailLine = {
  label?: string;
  value: string;
};

export type HistoryTransition = {
  from: string;
  to: string;
};

export type HistoryLog = {
  id: string;
  workOrderId: string;
  category: HistoryCategory;
  action: string;
  message: string;
  user: string;
  time: string;
  tone: HistoryTone;
  summary: string;
  detailLines?: HistoryDetailLine[];
  transition?: HistoryTransition | null;
};

export type InventoryChange = {
  type: InventoryChangeTypeValue;
  quantity: number;
};

export type InventoryLog = {
  id: string;
  summary: string;
  delta: number;
  memo: string;
  user: string;
  time: string;
  changes: InventoryChange[];
};

export type { Material, UserProfile, WorkflowAction, WorkflowState, DisplayStage, HistoryFilter, HistoryTone, RoleType };
