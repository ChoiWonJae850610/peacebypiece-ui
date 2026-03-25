export type RoleType = "디자이너" | "관리자" | "입고/검수";
export type TeamType = RoleType;

export type PermissionSet = {
  viewAttachments: boolean;
  editAttachments: boolean;
  viewCost: boolean;
  viewInventoryHistory: boolean;
  viewProductionDetails: boolean;
  inventoryEdit: boolean;
  permissionManage: boolean;
  requestReview: boolean;
  requestOrder: boolean;
  approveReview: boolean;
  confirmOrder: boolean;
  markProduction: boolean;
  startInspection: boolean;
  completeInspection: boolean;
};

export type PermissionKey = keyof PermissionSet;

export type UserProfile = {
  id: string;
  name: string;
  team: TeamType;
  permissions: PermissionSet;
};

export type Attachment = {
  id: string;
  type: "image" | "pdf";
  name: string;
  url: string;
  ownerId: string;
  ownerName: string;
};

export type Material = {
  id?: string;
  type: "원단" | "부자재" | string;
  name: string;
  vendor?: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  totalCost?: number;
  status?: string;
};

export type Outsourcing = {
  id?: string;
  process: string;
  vendor?: string;
  quantity?: number;
  unitType?: string;
  unitCost?: number;
  totalCost?: number;
  status?: string;
};

export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory";

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

export type WorkflowState =
  | "작성중"
  | "검토요청"
  | "검토완료"
  | "발주요청"
  | "발주완료"
  | "생산중"
  | "입고대기"
  | "검수중"
  | "완료";

export type DisplayStage = "작성" | "검토" | "발주" | "생산" | "입고/검수" | "완료";

export type WorkflowAction = {
  key: string;
  label: string;
  nextState: WorkflowState;
  permission: PermissionKey;
};

export type WorkHistoryItem = {
  time: string;
  user: string;
  action: string;
};

export type WorkOrder = {
  id: string;
  internalCode?: string;
  productName: string;
  title: string;
  category?: string;
  stage?: string;
  vendor?: string;
  dueDate?: string;
  inventoryStatus?: string;
  filesCount?: number;
  attachments?: Attachment[];
  status?: WorkflowState | string;
  category1?: string;
  category2?: string;
  category3?: string;
  season?: string;
  manager?: string;
  priority?: string;
  quantity?: number;
  inventoryQuantity?: number;
  memo?: string;
  historyItems?: WorkHistoryItem[];
  materials?: Material[];
  outsourcing?: Outsourcing[];
};

export type WorkOrderListItem = WorkOrder;
