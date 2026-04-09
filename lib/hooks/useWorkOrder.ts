"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { DEFAULT_SELECTED_WORK_ORDER_ID, MOCK_HISTORY_LOGS, MOCK_WORK_ORDERS } from "@/lib/data/mock/workorders";
import { DEFAULT_CURRENT_USER_ID, DEFAULT_PERMISSION_TARGET_ID, MOCK_USERS } from "@/lib/data/mock/users";
import { buildUserRoleState, canCreateWorkOrderByRoles, canUploadOfficialAttachmentsByRoles, isAdminRole, normalizeRoles } from "@/lib/constants/roles";
import { SECTION_PREFERENCES_STORAGE_KEY } from "@/lib/constants/app";
import { canDeleteAttachmentByUser, createAttachmentId, getAttachmentType, isOfficialAttachment } from "@/lib/permissions/attachments";
import { getDisplayStageFromWorkflowState, VISIBLE_STAGES, WORKFLOW_ACTION_LABELS } from "@/lib/constants/workflow";
import {
  createCreationHistoryLog,
  createInventoryHistoryLog,
  createManagerChangeHistoryLog,
  createMemoHistoryLog,
  createStatusHistoryLog,
  createUpdateHistoryLog,
  filterHistoryLogs,
  nowLabel,
  toInventoryLogs,
} from "@/lib/workorder/history";
import { addMemoReply, addMemoThread, createNewWorkOrder, applyInventoryAdjustment, appendAttachments, appendMemoAttachmentsToReply, appendMemoAttachmentsToThread, promoteAttachmentToOfficial, removeAttachment, updateWorkflowState, updateWorkOrderManager } from "@/lib/workorder/actions";
import { createWorkOrderListItem, calculateWorkOrderCosts } from "@/lib/workorder/selectors";
import { canEditInventoryForWorkflow, canManageWorkOrderManager, deriveWorkflowStateFromOrderEntries, getAvailableWorkflowActions } from "@/lib/workorder/workflow";
import type { Attachment, HistoryLog, InventoryLog, MemoAttachmentPayload, MemoReply, MemoThread, UserProfile, WorkOrder, WorkOrderListItem, WorkflowAction } from "@/types/workorder";
import type { RoleType } from "@/types/permission";
import type { HistoryFilter, NotificationSettingKey, NotificationSettings } from "@/types/workflow";

function isEmptyOrderEntry(entry: NonNullable<WorkOrder["orderEntries"]>[number]) {
  const factory = String(entry.factory ?? "").trim();
  const dueDate = String(entry.dueDate ?? "").trim();
  return !dueDate && (Number(entry.quantity) || 0) === 0 && (Number(entry.laborCost) || 0) === 0 && (Number(entry.lossCost) || 0) === 0 && (!factory || factory === "미정 공장");
}

function isEmptyMaterialRow(material: WorkOrder["materials"][number]) {
  const name = String(material.name ?? "").trim();
  const vendor = String(material.vendor ?? "").trim();
  return !vendor && (!name || name === "새 자재") && (Number(material.quantity) || 0) === 0 && (Number(material.unitCost) || 0) === 0;
}

function isEmptyOutsourcingRow(item: WorkOrder["outsourcing"][number]) {
  const vendor = String(item.vendor ?? "").trim();
  return !vendor && (Number(item.quantity) || 0) === 0 && (Number(item.unitCost) || 0) === 0;
}

function pruneDraftRows(workOrder: WorkOrder): WorkOrder {
  return {
    ...workOrder,
    orderEntries: (workOrder.orderEntries ?? []).filter((entry) => !isEmptyOrderEntry(entry)),
    materials: (workOrder.materials ?? []).filter((item) => !isEmptyMaterialRow(item)),
    outsourcing: (workOrder.outsourcing ?? []).filter((item) => !isEmptyOutsourcingRow(item)),
  };
}

export function useWorkOrder() {
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [basicInfoOpen, setBasicInfoOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [outsourcingOpen, setOutsourcingOpen] = useState(false);
  const [inventoryEditorOpen, setInventoryEditorOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [managerAssignModalOpen, setManagerAssignModalOpen] = useState(false);
  const [inventoryLogModalOpen, setInventoryLogModalOpen] = useState(false);
  const [adminPanelModalOpen, setAdminPanelModalOpen] = useState(false);
  const [attachmentPreviewId, setAttachmentPreviewId] = useState<string | null>(null);
  const [orderRequestConfirmOpen, setOrderRequestConfirmOpen] = useState(false);
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<WorkflowAction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_CURRENT_USER_ID);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(DEFAULT_PERMISSION_TARGET_ID);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    created: false,
    updated: false,
    status_changed: true,
    materials_changed: false,
    outsourcing_changed: false,
    stock_changed: true,
    comment_added: true,
  });
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(MOCK_HISTORY_LOGS);
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_WORK_ORDER_ID);
  const [searchQuery, setSearchQuery] = useState("");
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
  const currentRoles = normalizeRoles(currentUser.roles, currentUser.role);
  const currentRole = currentUser.role;
  const isAdmin = isAdminRole(currentRoles);
  const canCreateWorkOrder = canCreateWorkOrderByRoles(currentRoles);
  const permissionTargetUser = useMemo(
    () => users.find((user) => user.id === permissionTargetUserId) ?? users[0],
    [users, permissionTargetUserId],
  );

  const workflowStateById = useMemo(
    () => Object.fromEntries(workOrders.map((item) => [item.id, deriveWorkflowStateFromOrderEntries(item.workflowState, item.orderEntries)])),
    [workOrders],
  );
  const currentWorkflowState = useMemo(
    () => deriveWorkflowStateFromOrderEntries(selectedWorkOrder.workflowState, selectedWorkOrder.orderEntries),
    [selectedWorkOrder.workflowState, selectedWorkOrder.orderEntries],
  );
  const canChangeManager = canManageWorkOrderManager(currentRoles, currentWorkflowState);
  const currentDisplayStage = getDisplayStageFromWorkflowState(currentWorkflowState);
  const visibleStages = VISIBLE_STAGES;
  const isReviewRequestLocked = currentWorkflowState === "검토요청";
  const canUploadOfficialAttachments = canUploadOfficialAttachmentsByRoles(currentRoles) && !isReviewRequestLocked;

  const workOrderList: WorkOrderListItem[] = useMemo(() => workOrders.map(createWorkOrderListItem), [workOrders]);

  const filteredWorkOrderList = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return workOrderList;
    return workOrderList.filter((item) => {
      const fields = [
        item.title,
        item.category1,
        item.category2,
        item.category3,
        item.vendor,
        workflowStateById[item.id] ?? "",
      ];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(normalized));
    });
  }, [searchQuery, workOrderList, workflowStateById]);

  const canSeeProductionSections = currentUser.permissions.canSeeProductionSections;
  const canSeeCostSections = currentUser.permissions.canSeeCostSections;
  const canEditInventory = currentUser.permissions.canEditInventory;
  const canOpenInventoryEditor = canEditInventoryForWorkflow(currentRoles, currentWorkflowState);
  const canSeeInventoryHistorySection = currentUser.permissions.canSeeInventoryHistorySection;
  const canSeeAttachments = currentUser.permissions.canSeeAttachments;

  const currentInventoryQuantity = selectedWorkOrder.inventoryQuantity;
  const officialAttachments = useMemo(
    () => (selectedWorkOrder.attachments ?? []).filter((item) => isOfficialAttachment(item)),
    [selectedWorkOrder.attachments],
  );
  const selectedAttachment = useMemo(
    () => selectedWorkOrder.attachments.find((item) => item.id === attachmentPreviewId) ?? null,
    [selectedWorkOrder, attachmentPreviewId],
  );

  const { materials, outsourcing, fabricTotal, subsidiaryTotal, outsourcingTotal, totalCost, unitCost } = useMemo(
    () => calculateWorkOrderCosts(selectedWorkOrder),
    [selectedWorkOrder],
  );

  const scopedHistoryLogs = useMemo(
    () => historyLogs.filter((item) => item.workOrderId === selectedWorkOrder.id),
    [historyLogs, selectedWorkOrder.id],
  );

  const filteredHistoryLogs = useMemo(
    () => filterHistoryLogs(scopedHistoryLogs, isAdmin, historyFilter, currentRoles),
    [scopedHistoryLogs, isAdmin, historyFilter, currentRoles],
  );

  const inventoryLogs: InventoryLog[] = useMemo(() => toInventoryLogs(scopedHistoryLogs), [scopedHistoryLogs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SECTION_PREFERENCES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { basicInfoOpen?: boolean; materialOpen?: boolean; outsourcingOpen?: boolean };
      setBasicInfoOpen(Boolean(parsed.basicInfoOpen));
      setMaterialOpen(Boolean(parsed.materialOpen));
      setOutsourcingOpen(Boolean(parsed.outsourcingOpen));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SECTION_PREFERENCES_STORAGE_KEY, JSON.stringify({
      basicInfoOpen,
      materialOpen,
      outsourcingOpen,
    }));
  }, [basicInfoOpen, materialOpen, outsourcingOpen]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const availableActions = useMemo(
    () => getAvailableWorkflowActions({
      currentWorkflowState,
      currentRoles,
      currentUserId,
      workOrder: selectedWorkOrder,
    }),
    [currentWorkflowState, currentRoles, currentUserId, selectedWorkOrder],
  );

  const handleSave = () => {
    setSaveStatus("saving");
    const label = nowLabel();
    setLastSavedAt(label);
    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id ? { ...item, lastSavedAt: label } : item));
    setHistoryLogs((prev) => [
      createUpdateHistoryLog(currentUser.name, selectedWorkOrder.id, [
        { label: "저장", value: `저장 시각 ${label}` },
        { label: "작업지시서", value: selectedWorkOrder.title },
      ]),
      ...prev,
    ]);
    setSaveStatus("saved");
    setToastMessage("저장이 완료되었습니다.");
  };

  const handleSelectWorkOrder = (id: string) => {
    setSelectedId(id);
    const next = workOrders.find((item) => item.id === id);
    setLastSavedAt(next?.lastSavedAt ?? null);
    setSaveStatus("saved");
  };

  const canDeleteWorkOrder = (workflowState: WorkOrder["workflowState"]) => workflowState === "작성중" || workflowState === "검토요청";

  const handleCreateWorkOrder = () => {
    if (!canCreateWorkOrder) return;
    const newWorkOrder = createNewWorkOrder(workOrders.length + 1, {
      managerName: currentUser.name,
      managerId: currentUser.id,
      managerRole: currentUser.role,
      createdAt: nowLabel(),
    });
    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setSelectedId(newWorkOrder.id);
    setLastSavedAt(newWorkOrder.lastSavedAt);
    setSaveStatus("dirty");
    setHistoryLogs((prev) => [
      createCreationHistoryLog(currentUser.name, newWorkOrder.id),
      ...prev,
    ]);
  };

  const applyWorkflowAction = (action: WorkflowAction) => {
    const previousState = selectedWorkOrder.workflowState;
    const targetWorkOrder = action.label === WORKFLOW_ACTION_LABELS.requestReview ? pruneDraftRows(selectedWorkOrder) : selectedWorkOrder;

    setWorkOrders((prev) => prev.map((item) => {
      if (item.id !== selectedWorkOrder.id) return item;
      return updateWorkflowState([targetWorkOrder], selectedWorkOrder.id, action)[0] ?? item;
    }));
    setHistoryLogs((prev) => [
      createStatusHistoryLog(currentUser.name, selectedWorkOrder.id, previousState, action.nextState, action.label),
      ...prev,
    ]);
    if (action.label === WORKFLOW_ACTION_LABELS.requestReview) {
      setSaveStatus("dirty");
    }
    if (action.nextState === "검수중") {
      setInventoryEditorOpen(true);
    }
  };

  const handleWorkflowAction = (action: WorkflowAction) => {
    if (action.label === WORKFLOW_ACTION_LABELS.requestOrder && action.nextState === "생산중") {
      setPendingWorkflowAction(action);
      setOrderRequestConfirmOpen(true);
      return;
    }

    applyWorkflowAction(action);
  };

  const handleConfirmOrderRequest = () => {
    if (!pendingWorkflowAction) return;
    applyWorkflowAction(pendingWorkflowAction);
    setPendingWorkflowAction(null);
    setOrderRequestConfirmOpen(false);
  };

  const handleCloseOrderRequestConfirm = () => {
    setPendingWorkflowAction(null);
    setOrderRequestConfirmOpen(false);
  };

  const handleInventoryApply = ({
    inboundQuantity,
    adjustmentQuantity,
    deductionQuantity,
    memo,
  }: {
    inboundQuantity: number;
    adjustmentQuantity: number;
    deductionQuantity: number;
    memo: string;
  }) => {
    const changes = [
      ...(inboundQuantity > 0 ? [{ type: "입고" as const, quantity: inboundQuantity }] : []),
      ...(adjustmentQuantity > 0 ? [{ type: "보정" as const, quantity: adjustmentQuantity }] : []),
      ...(deductionQuantity > 0 ? [{ type: "차감" as const, quantity: deductionQuantity }] : []),
    ];

    if (changes.length === 0) return;

    setWorkOrders((prev) => applyInventoryAdjustment(prev, selectedWorkOrder.id, { changes }));
    setHistoryLogs((prev) => [
      createInventoryHistoryLog(currentUser.name, selectedWorkOrder.id, { changes, memo }),
      ...prev,
    ]);
  };

  const handleApplyRoles = (userId: string, roles: RoleType[]) => {
    const nextRoleState = buildUserRoleState(roles);
    setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, ...nextRoleState } : user));
  };

  const handleOpenManagerAssignModal = () => {
    if (!canChangeManager) return;
    setManagerAssignModalOpen(true);
  };

  const handleCloseManagerAssignModal = () => {
    setManagerAssignModalOpen(false);
  };

  const handleChangeManager = (managerId: string) => {
    if (!canChangeManager) return;
    const nextManager = users.find((user) => user.id === managerId);
    if (!nextManager) return;

    const previousManagerName = selectedWorkOrder.manager || "-";
    const previousManagerId = selectedWorkOrder.managerId ?? null;
    if (previousManagerId === nextManager.id || previousManagerName === nextManager.name) {
      setManagerAssignModalOpen(false);
      return;
    }

    setWorkOrders((prev) => updateWorkOrderManager(prev, selectedWorkOrder.id, {
      managerId: nextManager.id,
      managerName: nextManager.name,
    }));
    setHistoryLogs((prev) => [
      createManagerChangeHistoryLog(currentUser.name, selectedWorkOrder.id, previousManagerName, nextManager.name),
      ...prev,
    ]);
    setSaveStatus("dirty");
    setToastMessage("담당자가 변경되었습니다.");
    setManagerAssignModalOpen(false);
  };

  const handleDeleteWorkOrder = (workOrderId: string) => {
    const target = workOrders.find((item) => item.id === workOrderId);
    if (!target || !canDeleteWorkOrder(target.workflowState) || workOrders.length <= 1) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(`작업지시서 "${target.title}"를 삭제할까요?`);
      if (!ok) return;
    }

    const remaining = workOrders.filter((item) => item.id !== workOrderId);
    const fallbackSelectedId = remaining[0]?.id ?? DEFAULT_SELECTED_WORK_ORDER_ID;
    setWorkOrders(remaining);
    setHistoryLogs((prev) => prev.filter((item) => item.workOrderId !== workOrderId));
    if (selectedId === workOrderId) {
      setSelectedId(fallbackSelectedId);
      const fallbackWorkOrder = remaining.find((item) => item.id === fallbackSelectedId) ?? remaining[0];
      setLastSavedAt(fallbackWorkOrder?.lastSavedAt ?? null);
      setSaveStatus("saved");
    }
    setToastMessage("작업지시서가 삭제되었습니다.");
  };

  const handleOpenAttachmentPicker = () => {
    if (!canUploadOfficialAttachments) return;
    attachmentInputRef.current?.click();
  };

  const handleAttachmentFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canUploadOfficialAttachments) {
      event.target.value = "";
      return;
    }
    const files = Array.from<File>(event.target.files ?? []);
    if (files.length === 0) return;
    const nextAttachments: Attachment[] = files.map((file) => ({
      id: createAttachmentId(file.name),
      name: file.name,
      type: getAttachmentType(file),
      url: URL.createObjectURL(file),
      scope: "official",
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    }));
    setWorkOrders((prev) => appendAttachments(prev, selectedWorkOrder.id, nextAttachments));
    setSaveStatus("dirty");
    event.target.value = "";
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId) ?? null;
    if (isReviewRequestLocked && isOfficialAttachment(targetAttachment)) {
      return;
    }
    if (!canDeleteAttachmentByUser(currentUser, targetAttachment)) {
      return;
    }
    setWorkOrders((prev) => removeAttachment(prev, selectedWorkOrder.id, attachmentId));
    if (attachmentPreviewId === attachmentId) {
      setAttachmentPreviewId(null);
    }
    setSaveStatus("dirty");
  };


  const createMemoAttachments = (files: File[], target: { threadId?: string; replyId?: string } = {}): Attachment[] => {
    return files.map((file): Attachment => ({
      id: createAttachmentId(file.name),
      name: file.name,
      type: getAttachmentType(file),
      url: URL.createObjectURL(file),
      scope: "memo" as const,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      linkedThreadId: target.threadId ?? null,
      linkedReplyId: target.replyId ?? null,
    }));
  };

  const handleCreateMemoThread = (content: string, payload?: MemoAttachmentPayload) => {
    const trimmed = content.trim();
    const selectedAttachmentIds = payload?.selectedAttachmentIds ?? [];
    const files = payload?.files ?? [];
    if (!trimmed) return;

    const nextThread: MemoThread = {
      id: createAttachmentId("memo"),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: trimmed,
      createdAt: nowLabel(),
      attachmentIds: selectedAttachmentIds,
      replies: [],
    };

    const memoAttachments = createMemoAttachments(files, { threadId: nextThread.id });

    setWorkOrders((prev) => {
      const withThread = addMemoThread(prev, selectedWorkOrder.id, nextThread);
      if (memoAttachments.length === 0) return withThread;
      return appendMemoAttachmentsToThread(withThread, selectedWorkOrder.id, nextThread.id, {
        attachmentIds: memoAttachments.map((item) => item.id),
        attachments: memoAttachments,
      });
    });
    setHistoryLogs((prev) => [
      createMemoHistoryLog(currentUser.name, selectedWorkOrder.id, {
        action: "thread",
        content: trimmed,
        attachmentNames: [
          ...selectedAttachmentIds.map((attachmentId) => selectedWorkOrder.attachments.find((item) => item.id === attachmentId)?.name).filter((name): name is string => Boolean(name)),
          ...memoAttachments.map((attachment) => attachment.name),
        ],
      }),
      ...prev,
    ]);
    setSaveStatus("dirty");
    setToastMessage(memoAttachments.length > 0 || selectedAttachmentIds.length > 0 ? "첨부가 포함된 작업 메모가 등록되었습니다." : "작업 메모가 등록되었습니다.");
  };

  const handleCreateMemoReply = (threadId: string, content: string, payload?: MemoAttachmentPayload) => {
    const trimmed = content.trim();
    const selectedAttachmentIds = payload?.selectedAttachmentIds ?? [];
    const files = payload?.files ?? [];
    if (!trimmed) return;

    const nextReply: MemoReply = {
      id: createAttachmentId("reply"),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: trimmed,
      createdAt: nowLabel(),
      attachmentIds: selectedAttachmentIds,
    };

    const memoAttachments = createMemoAttachments(files, { threadId, replyId: nextReply.id });

    setWorkOrders((prev) => {
      const withReply = addMemoReply(prev, selectedWorkOrder.id, threadId, nextReply);
      if (memoAttachments.length === 0) return withReply;
      return appendMemoAttachmentsToReply(withReply, selectedWorkOrder.id, threadId, nextReply.id, {
        attachmentIds: memoAttachments.map((item) => item.id),
        attachments: memoAttachments,
      });
    });
    setHistoryLogs((prev) => [
      createMemoHistoryLog(currentUser.name, selectedWorkOrder.id, {
        action: "reply",
        content: trimmed,
        attachmentNames: [
          ...selectedAttachmentIds.map((attachmentId) => selectedWorkOrder.attachments.find((item) => item.id === attachmentId)?.name).filter((name): name is string => Boolean(name)),
          ...memoAttachments.map((attachment) => attachment.name),
        ],
      }),
      ...prev,
    ]);
    setSaveStatus("dirty");
    setToastMessage(memoAttachments.length > 0 || selectedAttachmentIds.length > 0 ? "첨부가 포함된 메모 댓글이 등록되었습니다." : "메모 댓글이 등록되었습니다.");
  };

  const handlePromoteMemoAttachment = (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId);
    if (!targetAttachment || (targetAttachment.scope ?? "official") === "official" || !canUploadOfficialAttachments || isReviewRequestLocked) return;

    setWorkOrders((prev) => promoteAttachmentToOfficial(prev, selectedWorkOrder.id, attachmentId, {
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    }));

    setSaveStatus("dirty");
    setToastMessage("메모 첨부가 공식 첨부로 승격되었습니다.");
  };

  const canDeleteAttachment = (attachment: Attachment | null) => {
    if (isReviewRequestLocked && isOfficialAttachment(attachment)) return false;
    return canDeleteAttachmentByUser(currentUser, attachment);
  };

  const handleToggleNotificationSetting = (key: NotificationSettingKey) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateSelectedWorkOrder = useCallback((patch: Partial<WorkOrder>) => {
    const hasLockedChanges = Boolean(patch.orderEntries || patch.materials || patch.outsourcing || patch.attachments);
    if (isReviewRequestLocked && hasLockedChanges) {
      return;
    }

    setWorkOrders((prev) => prev.map((item) => {
      if (item.id !== selectedWorkOrder.id) return item;
      const nextItem = { ...item, ...patch };
      if (patch.orderEntries) {
        nextItem.workflowState = deriveWorkflowStateFromOrderEntries(item.workflowState, patch.orderEntries);
      }
      return nextItem;
    }));
    setSaveStatus("dirty");
  }, [isReviewRequestLocked, selectedWorkOrder.id]);

  return {
    appShellRef,
    attachmentInputRef,
    drawerOpen,
    setDrawerOpen,
    basicInfoOpen,
    setBasicInfoOpen,
    materialOpen,
    setMaterialOpen,
    outsourcingOpen,
    setOutsourcingOpen,
    inventoryEditorOpen,
    setInventoryEditorOpen,
    permissionModalOpen,
    setPermissionModalOpen,
    managerAssignModalOpen,
    setManagerAssignModalOpen,
    inventoryLogModalOpen,
    setInventoryLogModalOpen,
    adminPanelModalOpen,
    setAdminPanelModalOpen,
    attachmentPreviewId,
    setAttachmentPreviewId,
    orderRequestConfirmOpen,
    pendingWorkflowAction,
    toastMessage,
    users,
    currentUserId,
    setCurrentUserId,
    permissionTargetUserId: permissionTargetUser?.id ?? users[0]?.id ?? "",
    setPermissionTargetUserId,
    historyFilter,
    setHistoryFilter,
    notificationSettings,
    handleToggleNotificationSetting,
    searchQuery,
    setSearchQuery,
    workOrders: filteredWorkOrderList,
    workflowStateById,
    selectedId,
    selectedWorkOrder,
    currentWorkflowState,
    currentUser,
    currentRole,
    isAdmin,
    canCreateWorkOrder,
    canUploadOfficialAttachments,
    isReviewRequestLocked,
    canChangeManager,
    canSeeProductionSections,
    canSeeCostSections,
    canEditInventory,
    canOpenInventoryEditor,
    canSeeInventoryHistorySection,
    canSeeAttachments,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
    officialAttachments,
    selectedAttachment,
    canDeleteAttachment,
    materials,
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
    canDeleteWorkOrder,
    handleCreateWorkOrder,
    handleDeleteWorkOrder,
    handleWorkflowAction,
    handleUpdateSelectedWorkOrder,
    handleConfirmOrderRequest,
    handleCloseOrderRequestConfirm,
    handleInventoryApply,
    handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal,
    handleChangeManager,
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
    handleCreateMemoThread,
    handleCreateMemoReply,
    handlePromoteMemoAttachment,
  };
}
