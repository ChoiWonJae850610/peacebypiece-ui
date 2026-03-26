"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { STORAGE_KEY, STORAGE_SCHEMA_VERSION } from "@/lib/constants/app";
import { ACTIONS_BY_STATE, getDisplayStage, getVisibleStageListByUser } from "@/lib/constants/workflow";
import { getPermissionSummary } from "@/lib/constants/roles";
import { canDeleteAttachmentByUser } from "@/lib/permissions/attachments";
import {
  buildPersistedState,
  createInventoryQuantityMap,
  createWorkflowStateMap,
  DEFAULT_CURRENT_USER_ID,
  DEFAULT_PERMISSION_TARGET_ID,
  DEFAULT_SELECTED_ID,
  filterHistoryLogs,
  getCurrentTimeLabel,
  getDefaultHistoryFilterByRole,
  INITIAL_HISTORY_LOGS,
  INITIAL_USERS,
  INITIAL_WORK_ORDERS,
  loadPersistedPayload,
  mapHistoryToInventoryLogs,
  readFileAsDataUrl,
  ROLE_PRESETS,
} from "@/lib/data/workorderMockData";
import type { Attachment, HistoryFilter, HistoryLog, HistoryTone, RoleType, UserProfile, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export function useWorkOrder() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [outsourcingOpen, setOutsourcingOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_ID);
  const [inventoryEditorOpen, setInventoryEditorOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [inventoryLogModalOpen, setInventoryLogModalOpen] = useState(false);
  const [attachmentPreviewId, setAttachmentPreviewId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [rolePermissionTemplates, setRolePermissionTemplates] = useState<typeof ROLE_PRESETS>(ROLE_PRESETS);
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_CURRENT_USER_ID);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(DEFAULT_PERMISSION_TARGET_ID);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const lockedScrollYRef = useRef(0);
  const overlayWasOpenRef = useRef(false);
  const savedSnapshotRef = useRef<string>("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [workflowStateById, setWorkflowStateById] = useState<Record<string, WorkflowState>>(() => createWorkflowStateMap(INITIAL_WORK_ORDERS));
  const [inventoryQuantityById, setInventoryQuantityById] = useState<Record<string, number>>(() => createInventoryQuantityMap(INITIAL_WORK_ORDERS));
  const [historyLogsById, setHistoryLogsById] = useState<Record<string, HistoryLog[]>>(() => INITIAL_HISTORY_LOGS);

  const blockingOverlayOpen = drawerOpen || inventoryEditorOpen || permissionModalOpen || inventoryLogModalOpen || attachmentPreviewId !== null;

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    if (blockingOverlayOpen && !overlayWasOpenRef.current) {
      lockedScrollYRef.current = window.scrollY;
      body.style.position = "fixed";
      body.style.top = `-${lockedScrollYRef.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
      html.style.overflow = "hidden";
      html.style.touchAction = "none";
      overlayWasOpenRef.current = true;
    }
    if (!blockingOverlayOpen && overlayWasOpenRef.current) {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      html.style.overflow = "";
      html.style.touchAction = "";
      window.scrollTo(0, lockedScrollYRef.current);
      overlayWasOpenRef.current = false;
    }
    return () => {
      if (!overlayWasOpenRef.current) return;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      html.style.overflow = "";
      html.style.touchAction = "";
    };
  }, [blockingOverlayOpen]);

  useEffect(() => {
    const appShell = appShellRef.current;
    if (!appShell) return;
    if (inventoryEditorOpen || permissionModalOpen || inventoryLogModalOpen || attachmentPreviewId !== null) {
      appShell.setAttribute("inert", "");
      appShell.setAttribute("aria-hidden", "true");
    } else {
      appShell.removeAttribute("inert");
      appShell.removeAttribute("aria-hidden");
    }
    return () => {
      appShell.removeAttribute("inert");
      appShell.removeAttribute("aria-hidden");
    };
  }, [inventoryEditorOpen, permissionModalOpen, inventoryLogModalOpen, attachmentPreviewId]);

  useEffect(() => {
    try {
      const parsed = loadPersistedPayload();
      if (parsed) {
        if (Array.isArray(parsed.workOrders)) setWorkOrders(parsed.workOrders);
        if (typeof parsed.selectedId === "string") setSelectedId(parsed.selectedId);
        if (Array.isArray(parsed.users)) setUsers(parsed.users);
        if (parsed.rolePermissionTemplates && typeof parsed.rolePermissionTemplates === "object") setRolePermissionTemplates(parsed.rolePermissionTemplates);
        if (typeof parsed.currentUserId === "string") setCurrentUserId(parsed.currentUserId);
        if (parsed.workflowStateById && typeof parsed.workflowStateById === "object") setWorkflowStateById(parsed.workflowStateById);
        if (parsed.inventoryQuantityById && typeof parsed.inventoryQuantityById === "object") setInventoryQuantityById(parsed.inventoryQuantityById);
        if (parsed.historyLogsById && typeof parsed.historyLogsById === "object") setHistoryLogsById(parsed.historyLogsById);
        if (typeof parsed.lastSavedAt === "string") setLastSavedAt(parsed.lastSavedAt);
        savedSnapshotRef.current = buildPersistedState({
          workOrders: Array.isArray(parsed.workOrders) ? parsed.workOrders : INITIAL_WORK_ORDERS,
          selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : DEFAULT_SELECTED_ID,
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS,
          currentUserId: typeof parsed.currentUserId === "string" ? parsed.currentUserId : DEFAULT_CURRENT_USER_ID,
          rolePermissionTemplates: parsed.rolePermissionTemplates && typeof parsed.rolePermissionTemplates === "object" ? parsed.rolePermissionTemplates : ROLE_PRESETS,
          workflowStateById: parsed.workflowStateById && typeof parsed.workflowStateById === "object" ? parsed.workflowStateById : createWorkflowStateMap(INITIAL_WORK_ORDERS),
          inventoryQuantityById: parsed.inventoryQuantityById && typeof parsed.inventoryQuantityById === "object" ? parsed.inventoryQuantityById : createInventoryQuantityMap(INITIAL_WORK_ORDERS),
          historyLogsById: parsed.historyLogsById && typeof parsed.historyLogsById === "object" ? parsed.historyLogsById : INITIAL_HISTORY_LOGS,
        });
      } else {
        savedSnapshotRef.current = buildPersistedState({
          workOrders: INITIAL_WORK_ORDERS,
          selectedId: DEFAULT_SELECTED_ID,
          users: INITIAL_USERS,
          currentUserId: DEFAULT_CURRENT_USER_ID,
          rolePermissionTemplates: ROLE_PRESETS,
          workflowStateById: createWorkflowStateMap(INITIAL_WORK_ORDERS),
          inventoryQuantityById: createInventoryQuantityMap(INITIAL_WORK_ORDERS),
          historyLogsById: INITIAL_HISTORY_LOGS,
        });
      }
    } catch (error) {
      console.error("localStorage load failed", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const selectedWorkOrder = workOrders.find((item) => item.id === selectedId) ?? workOrders[0];
  const currentWorkflowState = workflowStateById[selectedWorkOrder.id] ?? selectedWorkOrder.status;
  const currentUser = users.find((item) => item.id === currentUserId) ?? users[0];
  const currentRole = getPermissionSummary(currentUser);
  const isAdmin = currentRole === "관리자";
  const canSeeProductionSections = currentUser.permissions.viewProductionDetails;
  const canSeeCostSections = currentUser.permissions.viewCost;
  const canEditInventory = currentUser.permissions.inventoryEdit;
  const canSeeInventoryHistorySection = currentRole === "디자이너" ? true : currentUser.permissions.viewInventoryHistory;
  const canSeeAttachments = currentUser.permissions.viewAttachments;
  const currentDisplayStage = getDisplayStage(currentWorkflowState);
  const currentInventoryQuantity = inventoryQuantityById[selectedWorkOrder.id] ?? selectedWorkOrder.inventoryQuantity;
  const historyLogs = historyLogsById[selectedWorkOrder.id] ?? [];
  const filteredHistoryLogs = filterHistoryLogs(historyLogs, currentRole, historyFilter);
  const inventoryLogs = mapHistoryToInventoryLogs(historyLogs);
  const selectedAttachments = selectedWorkOrder.attachments ?? [];
  const selectedAttachment = selectedAttachments.find((item) => item.id === attachmentPreviewId) ?? null;
  const canDeleteAttachment = (attachment: Attachment | null) => canDeleteAttachmentByUser(currentUser, attachment);
  const materials = selectedWorkOrder.materials ?? [];
  const outsourcing = selectedWorkOrder.outsourcing ?? [];
  const fabricTotal = materials.filter((item) => item.type === "원단").reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const subsidiaryTotal = materials.filter((item) => item.type === "부자재").reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal;
  const unitCost = Math.round(totalCost / (selectedWorkOrder.quantity || 1));
  const availableActions = (ACTIONS_BY_STATE[currentWorkflowState] ?? []).filter((action) => currentUser.permissions[action.permission]);
  const visibleStages = getVisibleStageListByUser(currentUser, currentWorkflowState);

  const currentSnapshot = useMemo(
    () => buildPersistedState({ workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById }),
    [workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById],
  );

  useEffect(() => {
    if (!isHydrated) return;
    setIsDirty(currentSnapshot !== savedSnapshotRef.current);
  }, [currentSnapshot, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setSaveStatus(isDirty ? "dirty" : "saved");
  }, [isDirty, isHydrated]);

  const handleSave = (isAutoSave = false) => {
    if (!isHydrated) return;
    const savedAt = getCurrentTimeLabel();
    const payload = { workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById, lastSavedAt: savedAt };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, storageSchemaVersion: STORAGE_SCHEMA_VERSION }));
      savedSnapshotRef.current = buildPersistedState({ workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById });
      setLastSavedAt(savedAt);
      setIsDirty(false);
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus(isAutoSave ? "dirty" : "dirty");
      console.error("localStorage save failed", error);
    }
  };

  useEffect(() => {
    if (!isHydrated || !isDirty) return;
    setSaveStatus("saving");
    const timer = window.setTimeout(() => handleSave(true), 2500);
    return () => window.clearTimeout(timer);
  }, [currentSnapshot, isDirty, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isHydrated]);

  useEffect(() => {
    setHistoryFilter(getDefaultHistoryFilterByRole(currentRole));
  }, [currentRole]);

  const handleSelectWorkOrder = (id: string, closeDrawer = false) => {
    setSelectedId(id);
    setMaterialOpen(false);
    setOutsourcingOpen(false);
    if (closeDrawer) setDrawerOpen(false);
  };

  const handleCreateWorkOrder = (closeDrawer = false) => {
    const newId = `WO-2026-${String(workOrders.length + 14).padStart(4, "0")}`;
    const newInternalCode = `MN-${String(24031 + workOrders.length).padStart(5, "0")}`;
    const draftTitle = `새 작업지시서 ${workOrders.length - 2}`;
    const newWorkOrder: WorkOrder = {
      id: newId,
      internalCode: newInternalCode,
      productName: draftTitle,
      title: draftTitle,
      category: "미분류 > 미분류 > 미분류",
      stage: "작성중",
      vendor: "미정",
      dueDate: "미정",
      inventoryStatus: "확인전",
      filesCount: 0,
      attachments: [],
      status: "작성중",
      category1: "미분류",
      category2: "미분류",
      category3: "미분류",
      season: "미정",
      manager: currentUser.name,
      priority: "보통",
      quantity: 0,
      inventoryQuantity: 0,
      memo: "새 작업지시서 초안입니다.",
      historyItems: [{ time: getCurrentTimeLabel(), user: currentUser.name, action: "새 작업지시서 초안 생성" }],
      materials: [],
      outsourcing: [],
    };
    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setWorkflowStateById((prev) => ({ ...prev, [newId]: "작성중" }));
    setInventoryQuantityById((prev) => ({ ...prev, [newId]: 0 }));
    setHistoryLogsById((prev) => ({
      ...prev,
      [newId]: [{ id: `${newId}-created-${Date.now()}`, workOrderId: newId, category: "work", action: "작업지시서 생성", message: "작업지시서 초안을 생성했습니다.", user: currentUser.name, time: getCurrentTimeLabel(), tone: "blue" }],
    }));
    setSelectedId(newId);
    setMaterialOpen(false);
    setOutsourcingOpen(false);
    if (closeDrawer) setDrawerOpen(false);
  };

  const getWorkflowActionKey = (action: WorkflowAction) => `${action.nextState}-${action.label.replace(/\s+/g, "-")}`;
  const getWorkflowActionTone = (action: WorkflowAction): HistoryTone => (action.label.includes("반려") ? "rose" : "violet");

  const handleWorkflowAction = (action: WorkflowAction) => {
    setWorkflowStateById((prev) => ({ ...prev, [selectedWorkOrder.id]: action.nextState }));
    setHistoryLogsById((prev) => ({
      ...prev,
      [selectedWorkOrder.id]: [{ id: `${selectedWorkOrder.id}-${getWorkflowActionKey(action)}-${Date.now()}`, workOrderId: selectedWorkOrder.id, category: "work", action: action.label, message: `${action.label} 처리: ${currentWorkflowState} → ${action.nextState}`, user: currentUser.name, time: getCurrentTimeLabel(), tone: getWorkflowActionTone(action) }, ...(prev[selectedWorkOrder.id] ?? [])],
    }));
  };

  const handleInventoryApply = ({ type, quantity, memo }: { type: "입고" | "차감" | "보정"; quantity: number; memo: string }) => {
    const current = inventoryQuantityById[selectedWorkOrder.id] ?? selectedWorkOrder.inventoryQuantity;
    const nextValue = type === "입고" ? current + quantity : type === "차감" ? Math.max(0, current - quantity) : quantity;
    setInventoryQuantityById((prev) => ({ ...prev, [selectedWorkOrder.id]: nextValue }));
    if (type === "입고" && currentWorkflowState === "입고대기" && nextValue > 0) {
      setWorkflowStateById((prev) => ({ ...prev, [selectedWorkOrder.id]: "검수중" }));
    }
    const delta = type === "입고" ? quantity : type === "차감" ? -quantity : quantity - current;
    setHistoryLogsById((prev) => ({
      ...prev,
      [selectedWorkOrder.id]: [{ id: `${selectedWorkOrder.id}-${Date.now()}`, workOrderId: selectedWorkOrder.id, category: "inventory", action: type, message: `${type} ${delta > 0 ? `+${delta}` : delta}${memo ? ` · ${memo}` : ""}`, user: currentUser.name, time: getCurrentTimeLabel(), tone: type === "입고" ? "emerald" : type === "차감" ? "rose" : "amber" }, ...(prev[selectedWorkOrder.id] ?? [])],
    }));
  };

  const handleApplyRole = (userId: string, role: RoleType) => {
    const preset = rolePermissionTemplates[role];
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, team: preset.team, permissions: { ...preset.permissions } } : user)));
  };

  const handleOpenAttachmentPicker = () => attachmentInputRef.current?.click();

  const handleAttachmentFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => ({
          id: `${selectedWorkOrder.id}-attachment-${Date.now()}-${file.name}`,
          type: file.type === "application/pdf" ? ("pdf" as const) : ("image" as const),
          name: file.name,
          url: await readFileAsDataUrl(file),
          ownerId: currentUser.id,
          ownerName: currentUser.name,
        })),
      );
      setWorkOrders((prev) => prev.map((workOrder) => (workOrder.id === selectedWorkOrder.id ? { ...workOrder, attachments: [...(workOrder.attachments ?? []), ...uploaded], filesCount: (workOrder.attachments ?? []).length + uploaded.length } : workOrder)));
    } catch (error) {
      console.error("attachment load failed", error);
    } finally {
      event.target.value = "";
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setWorkOrders((prev) => prev.map((workOrder) => {
      if (workOrder.id !== selectedWorkOrder.id) return workOrder;
      const nextAttachments = (workOrder.attachments ?? []).filter((item) => item.id !== attachmentId);
      return { ...workOrder, attachments: nextAttachments, filesCount: nextAttachments.length };
    }));
    if (attachmentPreviewId === attachmentId) setAttachmentPreviewId(null);
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
    permissionTargetUserId,
    setPermissionTargetUserId,
    historyFilter,
    setHistoryFilter,
    workOrders,
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
