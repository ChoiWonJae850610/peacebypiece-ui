"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { DEFAULT_SELECTED_WORK_ORDER_ID, MOCK_HISTORY_LOGS, MOCK_WORK_ORDERS } from "@/lib/data/mock/workorders";
import { DEFAULT_CURRENT_USER_ID, DEFAULT_PERMISSION_TARGET_ID, MOCK_USERS } from "@/lib/data/mock/users";
import { ROLE_TEMPLATES } from "@/lib/constants/roles";
import { VISIBLE_STAGES } from "@/lib/constants/workflow";
import type { RoleType } from "@/types/permission";
import type { Attachment, HistoryLog, InventoryLog, UserProfile, WorkOrder, WorkOrderListItem, WorkflowAction, WorkflowState } from "@/types/workorder";
import type { HistoryFilter } from "@/types/workflow";

const ACTIONS_BY_STATE: Record<WorkflowState, Partial<Record<RoleType, WorkflowAction[]>>> = {
  "작성중": {
    "디자이너": [{ label: "검토 요청", nextState: "검토요청" }],
    "관리자": [{ label: "검토 요청", nextState: "검토요청" }],
  },
  "검토요청": {
    "관리자": [
      { label: "작성중으로 되돌리기", nextState: "작성중" },
      { label: "발주 요청", nextState: "발주요청" },
    ],
  },
  "발주요청": {
    "관리자": [{ label: "생산 시작", nextState: "생산중" }],
  },
  "생산중": {
    "관리자": [{ label: "입고 대기", nextState: "입고대기" }],
  },
  "입고대기": {
    "입고/검수": [{ label: "검수 시작", nextState: "검수중" }],
    "관리자": [{ label: "검수 시작", nextState: "검수중" }],
  },
  "검수중": {
    "입고/검수": [{ label: "완료", nextState: "완료" }],
    "관리자": [{ label: "완료", nextState: "완료" }],
  },
  "완료": {},
};

function nowLabel() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}-${date} ${hour}:${minute}`;
}

function createListItem(workOrder: WorkOrder): WorkOrderListItem {
  return {
    id: workOrder.id,
    title: workOrder.title,
    category1: workOrder.category1,
    category2: workOrder.category2,
    category3: workOrder.category3,
    vendor: workOrder.vendor,
    dueDate: workOrder.dueDate,
    inventoryStatus: workOrder.inventoryStatus,
    attachments: workOrder.attachments,
    filesCount: workOrder.attachments.length,
  };
}

function toHistoryLog(action: string, message: string, user: string, workOrderId: string, category: HistoryLog["category"], tone: HistoryLog["tone"]): HistoryLog {
  return {
    id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId,
    category,
    action,
    message,
    user,
    time: nowLabel(),
    tone,
  };
}

export function useWorkOrder() {
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(true);
  const [outsourcingOpen, setOutsourcingOpen] = useState(true);
  const [inventoryEditorOpen, setInventoryEditorOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [inventoryLogModalOpen, setInventoryLogModalOpen] = useState(false);
  const [attachmentPreviewId, setAttachmentPreviewId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_CURRENT_USER_ID);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(DEFAULT_PERMISSION_TARGET_ID);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(MOCK_HISTORY_LOGS);
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_WORK_ORDER_ID);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(MOCK_WORK_ORDERS.find((item) => item.id === DEFAULT_SELECTED_WORK_ORDER_ID)?.lastSavedAt ?? MOCK_WORK_ORDERS[0]?.lastSavedAt ?? null);

  const selectedWorkOrder = useMemo(
    () => workOrders.find((item) => item.id === selectedId) ?? workOrders[0],
    [workOrders, selectedId],
  );
  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? users[0],
    [users, currentUserId],
  );
  const currentRole = currentUser.role;
  const isAdmin = currentRole === "관리자";
  const permissionTargetUser = useMemo(
    () => users.find((user) => user.id === permissionTargetUserId) ?? users[0],
    [users, permissionTargetUserId],
  );

  const workflowStateById = useMemo(
    () => Object.fromEntries(workOrders.map((item) => [item.id, item.workflowState])),
    [workOrders],
  );
  const currentWorkflowState = selectedWorkOrder.workflowState;
  const currentDisplayStage = currentWorkflowState;
  const visibleStages = VISIBLE_STAGES;

  const workOrderList: WorkOrderListItem[] = useMemo(() => workOrders.map(createListItem), [workOrders]);

  const canSeeProductionSections = currentUser.permissions.canSeeProductionSections;
  const canSeeCostSections = currentUser.permissions.canSeeCostSections;
  const canEditInventory = currentUser.permissions.canEditInventory;
  const canSeeInventoryHistorySection = currentUser.permissions.canSeeInventoryHistorySection;
  const canSeeAttachments = currentUser.permissions.canSeeAttachments;

  const currentInventoryQuantity = selectedWorkOrder.inventoryQuantity;
  const selectedAttachment = useMemo(
    () => selectedWorkOrder.attachments.find((item) => item.id === attachmentPreviewId) ?? null,
    [selectedWorkOrder, attachmentPreviewId],
  );

  const materials = selectedWorkOrder.materials ?? [];
  const outsourcing = selectedWorkOrder.outsourcing ?? [];
  const fabricTotal = materials.filter((item) => item.type === "원단").reduce((sum, item) => sum + item.totalCost, 0);
  const subsidiaryTotal = materials.filter((item) => item.type === "부자재").reduce((sum, item) => sum + item.totalCost, 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + item.totalCost, 0);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal;
  const unitCost = selectedWorkOrder.quantity > 0 ? Math.round(totalCost / selectedWorkOrder.quantity) : 0;

  const scopedHistoryLogs = useMemo(
    () => historyLogs.filter((item) => item.workOrderId === selectedWorkOrder.id),
    [historyLogs, selectedWorkOrder.id],
  );

  const filteredHistoryLogs = useMemo(() => {
    if (isAdmin) {
      if (historyFilter === "all") return scopedHistoryLogs;
      return scopedHistoryLogs.filter((item) => item.category === historyFilter);
    }
    if (currentRole === "디자이너") {
      return scopedHistoryLogs.filter((item) => item.category === "work");
    }
    return scopedHistoryLogs.filter((item) => item.category === "inventory");
  }, [scopedHistoryLogs, isAdmin, historyFilter, currentRole]);

  const inventoryLogs: InventoryLog[] = useMemo(
    () => scopedHistoryLogs
      .filter((item) => item.category === "inventory")
      .map((item) => ({
        id: item.id,
        type: item.action.includes("입고") ? "입고" : item.action.includes("보정") ? "보정" : "차감",
        delta: 0,
        memo: item.message,
        user: item.user,
        time: item.time,
      })),
    [scopedHistoryLogs],
  );

  const availableActions = useMemo(
    () => ACTIONS_BY_STATE[currentWorkflowState]?.[currentRole] ?? [],
    [currentWorkflowState, currentRole],
  );

  const handleSave = () => {
    setSaveStatus("saving");
    const label = nowLabel();
    setLastSavedAt(label);
    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id ? { ...item, lastSavedAt: label } : item));
    setHistoryLogs((prev) => [
      toHistoryLog("저장 완료", "작업지시를 저장했습니다.", currentUser.name, selectedWorkOrder.id, "work", "stone"),
      ...prev,
    ]);
    setSaveStatus("saved");
  };

  const handleSelectWorkOrder = (id: string) => {
    setSelectedId(id);
    const next = workOrders.find((item) => item.id === id);
    setLastSavedAt(next?.lastSavedAt ?? null);
    setSaveStatus("saved");
  };

  const handleCreateWorkOrder = () => {
    const newWorkOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      title: `새 작업지시서 ${workOrders.length + 1}`,
      category1: "의류",
      category2: "미분류",
      category3: "미분류",
      season: "ALL",
      priority: "보통",
      vendor: "미정",
      manager: currentUser.name,
      dueDate: "미정",
      quantity: 0,
      inventoryQuantity: 0,
      inventoryStatus: "확인전",
      memo: "새 작업지시서가 생성되었습니다.",
      materials: [],
      outsourcing: [],
      attachments: [],
      workflowState: "작성중",
      lastSavedAt: nowLabel(),
    };
    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setSelectedId(newWorkOrder.id);
    setLastSavedAt(newWorkOrder.lastSavedAt);
    setSaveStatus("dirty");
    setHistoryLogs((prev) => [
      toHistoryLog("생성", "새 작업지시서를 생성했습니다.", currentUser.name, newWorkOrder.id, "work", "blue"),
      ...prev,
    ]);
  };

  const handleWorkflowAction = (action: WorkflowAction) => {
    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id ? { ...item, workflowState: action.nextState } : item));
    setHistoryLogs((prev) => [
      toHistoryLog(action.label, `${action.nextState} 상태로 변경했습니다.`, currentUser.name, selectedWorkOrder.id, "work", "violet"),
      ...prev,
    ]);
  };

  const handleInventoryApply = ({ type, quantity, memo }: { type: InventoryLog["type"]; quantity: number; memo: string }) => {
    setWorkOrders((prev) => prev.map((item) => {
      if (item.id !== selectedWorkOrder.id) return item;
      const nextInventory = type === "입고" ? item.inventoryQuantity + quantity : type === "차감" ? Math.max(0, item.inventoryQuantity - quantity) : quantity;
      return {
        ...item,
        inventoryQuantity: nextInventory,
        inventoryStatus: nextInventory > 0 ? "정상" : "부족",
      };
    }));
    setHistoryLogs((prev) => [
      toHistoryLog(type === "보정" ? "재고 보정" : type, memo || `${type} ${quantity}장 반영`, currentUser.name, selectedWorkOrder.id, "inventory", type === "차감" ? "rose" : type === "보정" ? "amber" : "emerald"),
      ...prev,
    ]);
  };

  const handleApplyRole = (userId: string, role: RoleType) => {
    const preset = ROLE_TEMPLATES[role];
    setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, role: preset.role, team: preset.team, permissions: preset.permissions } : user));
  };

  const handleOpenAttachmentPicker = () => attachmentInputRef.current?.click();

  const handleAttachmentFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const nextAttachments: Attachment[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      type: file.type.includes("pdf") ? "pdf" : "image",
      url: file.type.includes("pdf") ? "about:blank" : URL.createObjectURL(file),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    }));
    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id ? { ...item, attachments: [...item.attachments, ...nextAttachments] } : item));
    setSaveStatus("dirty");
    event.target.value = "";
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id ? { ...item, attachments: item.attachments.filter((attachment) => attachment.id !== attachmentId) } : item));
    if (attachmentPreviewId === attachmentId) {
      setAttachmentPreviewId(null);
    }
    setSaveStatus("dirty");
  };

  const canDeleteAttachment = (attachment: Attachment | null) => {
    if (!attachment) return false;
    return isAdmin || attachment.ownerId === currentUser.id;
  };

  return {
    appShellRef,
    attachmentInputRef,
    drawerOpen,
    setDrawerOpen,
    materialOpen,
    setMaterialOpen,
    outsourcingOpen,
    setOutsourcingOpen,
    inventoryEditorOpen,
    setInventoryEditorOpen,
    permissionModalOpen,
    setPermissionModalOpen,
    inventoryLogModalOpen,
    setInventoryLogModalOpen,
    attachmentPreviewId,
    setAttachmentPreviewId,
    users,
    currentUserId,
    setCurrentUserId,
    permissionTargetUserId: permissionTargetUser?.id ?? users[0]?.id ?? "",
    setPermissionTargetUserId,
    historyFilter,
    setHistoryFilter,
    workOrders: workOrderList,
    workflowStateById,
    selectedId,
    selectedWorkOrder,
    currentWorkflowState,
    currentUser,
    currentRole,
    isAdmin,
    canSeeProductionSections,
    canSeeCostSections,
    canEditInventory,
    canSeeInventoryHistorySection,
    canSeeAttachments,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
    selectedAttachment,
    canDeleteAttachment,
    outsourcing,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    totalCost,
    unitCost,
    saveStatus,
    lastSavedAt,
    availableActions,
    visibleStages,
    handleSave,
    handleSelectWorkOrder,
    handleCreateWorkOrder,
    handleWorkflowAction,
    handleInventoryApply,
    handleApplyRole,
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
  };
}
