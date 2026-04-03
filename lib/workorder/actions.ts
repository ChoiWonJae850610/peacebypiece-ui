import type { Attachment, InventoryLog, WorkOrder, WorkflowAction } from "@/types/workorder";

export function createNewWorkOrder(nextIndex: number, managerName: string, createdAt: string): WorkOrder {
  return {
    id: `wo-${Date.now()}`,
    title: `새 작업지시서 ${nextIndex}`,
    category1: "의류",
    category2: "미분류",
    category3: "미분류",
    season: "ALL",
    priority: "보통",
    vendor: "미정",
    manager: managerName,
    dueDate: "미정",
    quantity: 0,
    inventoryQuantity: 0,
    inventoryStatus: "확인전",
    memo: "새 작업지시서가 생성되었습니다.",
    materials: [],
    outsourcing: [],
    attachments: [],
    workflowState: "작성중",
    lastSavedAt: createdAt,
  };
}

export function updateWorkflowState(workOrders: WorkOrder[], workOrderId: string, action: WorkflowAction) {
  return workOrders.map((item) => item.id === workOrderId ? { ...item, workflowState: action.nextState } : item);
}

export function applyInventoryAdjustment(
  workOrders: WorkOrder[],
  workOrderId: string,
  payload: { type: InventoryLog["type"]; quantity: number },
) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;
    const nextInventory = payload.type === "입고"
      ? item.inventoryQuantity + payload.quantity
      : payload.type === "차감"
        ? Math.max(0, item.inventoryQuantity - payload.quantity)
        : payload.quantity;

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
