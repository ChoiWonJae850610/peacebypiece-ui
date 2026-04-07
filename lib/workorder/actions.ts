import type { Attachment, InventoryChange, RoleType, WorkOrder, WorkflowAction } from "@/types/workorder";

export function createNewWorkOrder(nextIndex: number, payload: {
  managerName: string;
  managerId: string;
  managerRole: RoleType;
  createdAt: string;
}): WorkOrder {
  return {
    id: `wo-${Date.now()}`,
    title: `새 작업지시서 ${nextIndex}`,
    category1: "의류",
    category2: "미분류",
    category3: "미분류",
    season: "ALL",
    priority: "보통",
    vendor: "미정",
    manager: payload.managerName,
    managerId: payload.managerId,
    createdById: payload.managerId,
    createdByRole: payload.managerRole,
    dueDate: "미정",
    quantity: 0,
    inventoryQuantity: 0,
    inventoryStatus: "확인전",
    memo: "새 작업지시서가 생성되었습니다.",
    materials: [],
    outsourcing: [],
    attachments: [],
    workflowState: "작성중",
    lastSavedAt: payload.createdAt,
  };
}

export function updateWorkflowState(workOrders: WorkOrder[], workOrderId: string, action: WorkflowAction) {
  return workOrders.map((item) => item.id === workOrderId ? { ...item, workflowState: action.nextState } : item);
}

export function applyInventoryAdjustment(
  workOrders: WorkOrder[],
  workOrderId: string,
  payload: { changes: InventoryChange[] },
) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;

    let nextInventory = item.inventoryQuantity;
    for (const change of payload.changes) {
      if (change.type === "입고") nextInventory += change.quantity;
      else if (change.type === "차감") nextInventory = Math.max(0, nextInventory - change.quantity);
      else nextInventory = change.quantity;
    }

    return {
      ...item,
      inventoryQuantity: nextInventory,
      inventoryStatus: nextInventory > 0 ? "정상" : "부족",
    };
  });
}

export function appendAttachments(workOrders: WorkOrder[], workOrderId: string, attachments: Attachment[]) {
  return workOrders.map((item) => item.id === workOrderId ? { ...item, attachments: [...item.attachments, ...attachments] } : item);
}

export function removeAttachment(workOrders: WorkOrder[], workOrderId: string, attachmentId: string) {
  return workOrders.map((item) => item.id === workOrderId
    ? { ...item, attachments: item.attachments.filter((attachment) => attachment.id !== attachmentId) }
    : item);
}


export function updateWorkOrderManager(
  workOrders: WorkOrder[],
  workOrderId: string,
  payload: { managerId: string; managerName: string },
) {
  return workOrders.map((item) => item.id === workOrderId
    ? { ...item, managerId: payload.managerId, manager: payload.managerName }
    : item);
}
