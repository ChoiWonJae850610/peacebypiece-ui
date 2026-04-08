import type { Material } from "@/types/material";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";
import type { DisplayStage, HistoryCategory, HistoryFilter, HistoryTone, WorkflowAction, WorkflowState } from "@/types/workflow";

export type AttachmentScope = "official" | "memo";

export type MemoAttachmentPayload = {
  selectedAttachmentIds?: string[];
  files?: File[];
};

export type AttachmentType = "image" | "pdf";

export type Attachment = {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  scope?: AttachmentScope;
  ownerId?: string | null;
  ownerName?: string | null;
  linkedThreadId?: string | null;
  linkedReplyId?: string | null;
};

export type MemoReply = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: RoleType;
  content: string;
  createdAt: string;
  attachmentIds?: string[];
};

export type MemoThread = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: RoleType;
  content: string;
  createdAt: string;
  attachmentIds?: string[];
  replies: MemoReply[];
};

export type Outsourcing = {
  id: string;
  process: string;
  vendor: string;
  quantity: number;
  unitType: string;
  unitCost: number;
  totalCost: number;
  status: string;
};

export type OrderEntry = {
  id: string;
  type: string;
  factory: string;
  dueDate: string;
  quantity: number;
  laborCost: number;
  lossCost: number;
  priority: string;
};


export type WorkOrder = {
  id: string;
  title: string;
  category1: string;
  category2: string;
  category3: string;
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
  inventoryStatus: string;
  memo: string;
  materials: Material[];
  outsourcing: Outsourcing[];
  attachments: Attachment[];
  memoThreads: MemoThread[];
  workflowState: WorkflowState;
  lastSavedAt: string;
};

export type WorkOrderListItem = Pick<
  WorkOrder,
  | "id"
  | "title"
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
  type: "입고" | "차감" | "보정";
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
