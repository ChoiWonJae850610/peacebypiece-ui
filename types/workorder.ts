export type RoleType = "관리자" | "디자이너" | "입고/검수";

export type PermissionKey =
  | "viewProductionDetails"
  | "viewCost"
  | "viewAttachments"
  | "editAttachments"
  | "permissionManage"
  | "inventoryEdit"
  | "viewInventoryHistory";

export type WorkflowState =
  | "요청전"
  | "작성중"
  | "진행중"
  | "발주요청"
  | "발주완료"
  | "생산중"
  | "입고완료"
  | "완료";

export type DisplayStage = "작성" | "검토" | "발주" | "생산" | "입고" | "완료";

export type HistoryCategory = "work" | "inventory";
export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory";

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: "image" | "pdf";
  uploadedBy?: string;
  uploadedByUserId?: string;
  uploadedAt?: string;
  [key: string]: unknown;
};

export type Material = {
  id: string;
  type?: string;
  name?: string;
  code?: string;
  vendor?: string;
  color?: string;
  unit?: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  note?: string;
  [key: string]: unknown;
};

export type Outsourcing = {
  id: string;
  process?: string;
  name?: string;
  vendor?: string;
  unit?: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  note?: string;
  [key: string]: unknown;
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
  [key: string]: unknown;
};

export type InventoryLog = {
  id: string;
  workOrderId: string;
  type: "입고" | "차감" | "보정";
  delta: number;
  memo: string;
  user: string;
  time: string;
  [key: string]: unknown;
};

export type WorkflowAction = {
  id: string;
  label: string;
  nextState: WorkflowState;
  permission: PermissionKey;
};

export type PermissionMap = Record<PermissionKey, boolean>;

export type UserProfile = {
  id: string;
  name: string;
  team: RoleType;
  permissions: PermissionMap;
  [key: string]: unknown;
};

export type WorkOrderBase = {
  id: string;
  title: string;
  status: WorkflowState;
  vendor?: string;
  dueDate?: string;
  inventoryStatus?: string;
  filesCount?: number;
  category?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  inventoryQuantity?: number;
  attachments?: Attachment[];
  materials?: Material[];
  outsourcing?: Outsourcing[];
  historyItems?: Array<{ time: string; user: string; action: string }>;
  [key: string]: unknown;
};

export type WorkOrder = WorkOrderBase;
export type WorkOrderListItem = WorkOrderBase;
