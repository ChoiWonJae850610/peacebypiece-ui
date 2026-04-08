import { createAttachmentId } from "@/lib/permissions/attachments";
import type { Attachment, InventoryChange, MemoReply, MemoThread, OrderEntry, RoleType, WorkOrder, WorkflowAction } from "@/types/workorder";

export function createNewWorkOrder(nextIndex: number, payload: {
  managerName: string;
  managerId: string;
  managerRole: RoleType;
  createdAt: string;
}): WorkOrder {
  return {
    id: createAttachmentId("wo"),
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
    memoThreads: [],
    workflowState: "작성중",
    lastSavedAt: payload.createdAt,
  };
}

export function updateWorkflowState(workOrders: WorkOrder[], workOrderId: string, action: WorkflowAction) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;

    if (action.label === "발주 요청") {
      const nextOrderEntries: OrderEntry[] = (item.orderEntries ?? []).map((entry) => ({
        ...entry,
        inspectionStatus: entry.inspectionStatus === "검수완료" ? "검수완료" : "검수대기",
      }));

      return {
        ...item,
        workflowState: action.nextState,
        orderEntries: nextOrderEntries,
      };
    }

    return { ...item, workflowState: action.nextState };
  });
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

export function addMemoThread(workOrders: WorkOrder[], workOrderId: string, thread: MemoThread) {
  return workOrders.map((item) => item.id === workOrderId
    ? { ...item, memoThreads: [thread, ...(item.memoThreads ?? [])] }
    : item);
}

export function addMemoReply(workOrders: WorkOrder[], workOrderId: string, threadId: string, reply: MemoReply) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;
    return {
      ...item,
      memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
        ? { ...thread, replies: [...(thread.replies ?? []), reply] }
        : thread),
    };
  });
}



export function appendMemoAttachmentsToThread(
  workOrders: WorkOrder[],
  workOrderId: string,
  threadId: string,
  payload: { attachmentIds: string[]; attachments: Attachment[] },
) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;
    return {
      ...item,
      attachments: [...item.attachments, ...payload.attachments],
      memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
        ? { ...thread, attachmentIds: [...(thread.attachmentIds ?? []), ...payload.attachmentIds] }
        : thread),
    };
  });
}

export function appendMemoAttachmentsToReply(
  workOrders: WorkOrder[],
  workOrderId: string,
  threadId: string,
  replyId: string,
  payload: { attachmentIds: string[]; attachments: Attachment[] },
) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;
    return {
      ...item,
      attachments: [...item.attachments, ...payload.attachments],
      memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
        ? {
            ...thread,
            replies: (thread.replies ?? []).map((reply) => reply.id === replyId
              ? { ...reply, attachmentIds: [...(reply.attachmentIds ?? []), ...payload.attachmentIds] }
              : reply),
          }
        : thread),
    };
  });
}

export function promoteAttachmentToOfficial(
  workOrders: WorkOrder[],
  workOrderId: string,
  attachmentId: string,
  payload: { ownerId: string; ownerName: string },
): WorkOrder[] {
  return workOrders.map((item): WorkOrder => item.id === workOrderId
    ? {
        ...item,
        attachments: item.attachments.map((attachment): Attachment => attachment.id === attachmentId
          ? { ...attachment, scope: "official" as const, ownerId: payload.ownerId, ownerName: payload.ownerName }
          : attachment),
      }
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
