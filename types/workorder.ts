export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory";
export type WorkflowState = "작성중" | "검토요청" | "발주요청" | "입고대기" | "검수중" | "생산중" | "완료";
export type DisplayStage = "작성" | "검토" | "발주" | "입고" | "생산" | "완료";
export type RoleType = "관리자" | "디자이너" | "입고/검수";

export type PermissionKey =
  | "viewProductionDetails"
  | "viewCost"
  | "inventoryEdit"
  | "viewInventoryHistory"
  | "viewAttachments"
  | "requestReview"
  | "requestOrder"
  | "markInboundReady"
  | "startInspection"
  | "startProduction"
  | "completeWork"
  | "rejectWork";

export type UserPermissions = Record<PermissionKey, boolean>;

export type UserProfile = {
  id: string;
  name: string;
  team: RoleType;
  permissions: UserPermissions;
};

export type Attachment = {
  id: string;
  type: "image" | "pdf";
  name: string;
  url: string;
  ownerId?: string;
  ownerName?: string;
};

export type Material = {
  type: "원단" | "부자재";
  name: string;
  vendor: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  status: string;
};

export type Outsourcing = {
  process: string;
  vendor: string;
  quantity: number;
  unitType: string;
  unitCost?: number;
  totalCost?: number;
  status: string;
};

export type WorkOrder = {
  id: string;
  internalCode: string;
  productName: string;
  title: string;
  category: string;
  stage: string;
  vendor: string;
  dueDate: string;
  inventoryStatus: string;
  filesCount: number;
  attachments?: Attachment[];
  status: WorkflowState;
  category1: string;
  category2: string;
  category3: string;
  season: string;
  manager: string;
  priority: string;
  quantity: number;
  inventoryQuantity: number;
  memo: string;
  historyItems: { time: string; user: string; action: string }[];
  materials?: Material[];
  outsourcing?: Outsourcing[];
};

export type WorkOrderListItem = Pick<
  WorkOrder,
  "id" | "title" | "vendor" | "dueDate" | "inventoryStatus" | "filesCount" | "category1" | "category2" | "category3"
>;

export type HistoryLog = {
  id: string;
  workOrderId: string;
  category: "work" | "inventory";
  action: string;
  message: string;
  user: string;
  time: string;
  tone: HistoryTone;
};

export type InventoryLog = {
  id: string;
  workOrderId: string;
  type: "입고" | "차감" | "보정";
  delta: number;
  memo: string;
  user: string;
  time: string;
};

export type WorkflowAction = {
  label: string;
  nextState: WorkflowState;
  permission: PermissionKey;
};
