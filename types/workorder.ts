export type Material = {
  type: string;
  name: string;
  vendor: string;
  quantity: number;
  inventoryQuantity?: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: string;
};

export type Outsourcing = {
  process: string;
  vendor: string;
  quantity: number;
  unitType: string;
  unitCost: number;
  totalCost: number;
  status: string;
};

export type WorkflowState =
  | "작성중"
  | "검토대기"
  | "검토완료"
  | "발주요청"
  | "발주완료"
  | "생산중"
  | "입고대기"
  | "검수중"
  | "부분완료"
  | "완료"
  | "반려"
  | "종결";

export type DisplayStage =
  | "작성중"
  | "검토중"
  | "발주대기"
  | "입고대기"
  | "완료"
  | "반려";

export type PermissionKey =
  | "createWorkorder"
  | "reviewRequest"
  | "reviewApprove"
  | "orderRequest"
  | "orderConfirm"
  | "inbound"
  | "inspection"
  | "inventoryEdit"
  | "permissionManage"
  | "viewProductionDetails"
  | "viewCost"
  | "viewInventoryHistory"
  | "viewAttachments"
  | "editAttachments";

export type PermissionSet = Record<PermissionKey, boolean>;

export type RoleType = "디자이너" | "관리자" | "입고/검수";

export type UserProfile = {
  id: string;
  name: string;
  team: RoleType;
  permissions: PermissionSet;
};

export type ActionId =
  | "saveDraft"
  | "requestReview"
  | "approveReview"
  | "rejectReview"
  | "requestOrder"
  | "confirmOrder"
  | "startProduction"
  | "registerInbound"
  | "startInspection"
  | "completeInspection"
  | "markPartial"
  | "closeOrder";

export type WorkflowAction = {
  id: ActionId;
  label: string;
  nextState: WorkflowState;
  permission: PermissionKey;
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

export type HistoryCategory = "work" | "inventory";
export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory";

export type HistoryLog = {
  id: string;
  workOrderId: string;
  category: HistoryCategory;
  action: string;
  message: string;
  user: string;
  time: string;
  tone: HistoryTone;
};

export type Attachment = {
  id: string;
  type: "image" | "pdf";
  name: string;
  url: string;
  ownerId: string;
  ownerName: string;
};

export type WorkOrder = {
  id: string;
  productName: string;
  internalCode: string;
  category: string;
  stage: WorkflowState;
  vendor: string;
  dueDate: string;
  inventoryStatus: string;
  filesCount: number;
  attachments: Attachment[];
  title: string;
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
  materials: Material[];
  outsourcing: Outsourcing[];
};

export type WorkOrderListItem = Pick<
  WorkOrder,
  | "id"
  | "title"
  | "vendor"
  | "dueDate"
  | "category1"
  | "category2"
  | "category3"
  | "inventoryStatus"
  | "filesCount"
>;
