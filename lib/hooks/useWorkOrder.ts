"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { DEFAULT_SELECTED_WORK_ORDER_ID, MOCK_HISTORY_LOGS, MOCK_WORK_ORDERS } from "@/lib/data/mock/workorders";
import { DEFAULT_CURRENT_USER_ID, DEFAULT_PERMISSION_TARGET_ID, MOCK_USERS } from "@/lib/data/mock/users";
import { ROLE_TEMPLATES } from "@/lib/constants/roles";
import { canDeleteAttachmentByUser } from "@/lib/permissions/attachments";
import { VISIBLE_STAGES } from "@/lib/constants/workflow";
import {
  createAttachmentHistoryLog,
  createCreationHistoryLog,
  createInventoryHistoryLog,
  createStatusHistoryLog,
  createUpdateHistoryLog,
  filterHistoryLogs,
  nowLabel,
  toInventoryLogs,
} from "@/lib/workorder/history";
import { createNewWorkOrder, applyInventoryAdjustment, appendAttachments, removeAttachment, updateWorkflowState } from "@/lib/workorder/actions";
import { createWorkOrderListItem, calculateWorkOrderCosts } from "@/lib/workorder/selectors";
import { getAvailableWorkflowActions } from "@/lib/workorder/workflow";
import type { Attachment, HistoryLog, InventoryLog, UserProfile, WorkOrder, WorkOrderListItem, WorkflowAction } from "@/types/workorder";
import type { RoleType } from "@/types/permission";
import type { HistoryFilter } from "@/types/workflow";

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

  const workOrderList: WorkOrderListItem[] = useMemo(() => workOrders.map(createWorkOrderListItem), [workOrders]);

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

  const { materials, outsourcing, fabricTotal, subsidiaryTotal, outsourcingTotal, totalCost, unitCost } = useMemo(
    () => calculateWorkOrderCosts(selectedWorkOrder),
    [selectedWorkOrder],
  );

  const scopedHistoryLogs = useMemo(
    () => historyLogs.filter((item) => item.workOrderId === selectedWorkOrder.id),
    [historyLogs, selectedWorkOrder.id],
  );

  const filteredHistoryLogs = useMemo(
    () => filterHistoryLogs(scopedHistoryLogs, isAdmin, historyFilter, currentRole),
    [scopedHistoryLogs, isAdmin, historyFilter, currentRole],
  );

  const inventoryLogs: InventoryLog[] = useMemo(() => toInventoryLogs(scopedHistoryLogs), [scopedHistoryLogs]);

  const availableActions = useMemo(
    () => getAvailableWorkflowActions({
      currentWorkflowState,
      currentRole,
      currentUserId,
      workOrder: selectedWorkOrder,
    }),
    [currentWorkflowState, currentRole, currentUserId, selectedWorkOrder],
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
  };

  const handleSelectWorkOrder = (id: string) => {
    setSelectedId(id);
    const next = workOrders.find((item) => item.id === id);
    setLastSavedAt(next?.lastSavedAt ?? null);
    setSaveStatus("saved");
  };

  const handleCreateWorkOrder = () => {
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

  const handleWorkflowAction = (action: WorkflowAction) => {
    const previousState = selectedWorkOrder.workflowState;
    setWorkOrders((prev) => updateWorkflowState(prev, selectedWorkOrder.id, action));
    setHistoryLogs((prev) => [
      createStatusHistoryLog(currentUser.name, selectedWorkOrder.id, previousState, action.nextState, action.label),
      ...prev,
    ]);
    if (action.nextState === "검수중") {
      setInventoryEditorOpen(true);
    }
  };

  const handleInventoryApply = ({ type, quantity, memo }: { type: InventoryLog["type"]; quantity: number; memo: string }) => {
    setWorkOrders((prev) => applyInventoryAdjustment(prev, selectedWorkOrder.id, { type, quantity }));
    setHistoryLogs((prev) => [
      createInventoryHistoryLog(currentUser.name, selectedWorkOrder.id, { type, quantity, memo }),
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
    setWorkOrders((prev) => appendAttachments(prev, selectedWorkOrder.id, nextAttachments));
    setHistoryLogs((prev) => [
      createAttachmentHistoryLog(currentUser.name, selectedWorkOrder.id, nextAttachments.map((attachment) => ({
        label: "추가",
        value: attachment.name,
      }))),
      ...prev,
    ]);
    setSaveStatus("dirty");
    event.target.value = "";
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId) ?? null;
    if (!canDeleteAttachmentByUser(currentUser, targetAttachment)) {
      return;
    }
    setWorkOrders((prev) => removeAttachment(prev, selectedWorkOrder.id, attachmentId));
    if (attachmentPreviewId === attachmentId) {
      setAttachmentPreviewId(null);
    }
    if (targetAttachment) {
      setHistoryLogs((prev) => [
        createAttachmentHistoryLog(currentUser.name, selectedWorkOrder.id, [{ label: "삭제", value: targetAttachment.name }]),
        ...prev,
      ]);
    }
    setSaveStatus("dirty");
  };

  const canDeleteAttachment = (attachment: Attachment | null) => {
    return canDeleteAttachmentByUser(currentUser, attachment);
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
    handleCreateWorkOrder,
    handleWorkflowAction,
    handleInventoryApply,
    handleApplyRole,
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
  };
}
