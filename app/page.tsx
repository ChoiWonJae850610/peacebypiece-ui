"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import AttachmentPreviewModal from "@/components/common/modal/AttachmentPreviewModal";
import InventoryEditor from "@/components/common/modal/InventoryEditor";
import InventoryLogModal from "@/components/common/modal/InventoryLogModal";
import PermissionModal from "@/components/common/modal/PermissionModal";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import { APP_VERSION, LEGACY_STORAGE_KEYS, STORAGE_KEY, STORAGE_SCHEMA_VERSION } from "@/lib/constants/app";
import { getPermissionSummary, INITIAL_USERS, ROLE_PRESETS } from "@/lib/constants/roles";
import { ACTIONS_BY_STATE, getDisplayStage, getVisibleStageListByUser } from "@/lib/constants/workflow";
import { canDeleteAttachmentByUser } from "@/lib/permissions/attachments";
import type { Attachment, HistoryFilter, HistoryLog, HistoryTone, InventoryLog, RoleType, UserProfile, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

function getCurrentTimeLabel() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function loadPersistedPayload() {
  const storageKeys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of storageKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  }
  return null;
}

const INITIAL_HISTORY_LOGS: Record<string, HistoryLog[]> = {
  "WO-2026-0014": [
    { id: "h-14-1", workOrderId: "WO-2026-0014", category: "work", action: "작업지시서 생성", message: "작업지시서가 생성되었습니다.", user: "김디자이너", time: "03-21 09:00", tone: "blue" },
    { id: "h-14-2", workOrderId: "WO-2026-0014", category: "work", action: "검토 요청", message: "검토 요청을 진행했습니다.", user: "김디자이너", time: "03-21 13:20", tone: "violet" },
    { id: "h-14-3", workOrderId: "WO-2026-0014", category: "work", action: "발주 요청", message: "발주 요청 상태로 변경했습니다.", user: "박관리", time: "03-22 09:18", tone: "blue" },
    { id: "h-14-4", workOrderId: "WO-2026-0014", category: "inventory", action: "입고", message: "입고 +5 · 샘플 1차 입고", user: "박관리", time: "03-22 11:40", tone: "emerald" },
    { id: "h-14-5", workOrderId: "WO-2026-0014", category: "inventory", action: "차감", message: "차감 -2 · 검수 불량 차감", user: "이검수", time: "03-22 16:20", tone: "rose" },
  ],
  "WO-2026-0015": [
    { id: "h-15-1", workOrderId: "WO-2026-0015", category: "work", action: "작업지시서 생성", message: "작업지시서가 생성되었습니다.", user: "김디자이너", time: "03-20 10:00", tone: "blue" },
    { id: "h-15-2", workOrderId: "WO-2026-0015", category: "work", action: "메모 수정", message: "워싱 샘플 확인 메모를 수정했습니다.", user: "이담당", time: "03-22 10:05", tone: "stone" },
  ],
  "WO-2026-0016": [
    { id: "h-16-1", workOrderId: "WO-2026-0016", category: "work", action: "작업지시서 생성", message: "작업지시서가 생성되었습니다.", user: "박관리", time: "03-17 15:10", tone: "blue" },
    { id: "h-16-2", workOrderId: "WO-2026-0016", category: "work", action: "완료 처리", message: "검수 완료 후 작업을 완료 처리했습니다.", user: "박관리", time: "03-18 11:10", tone: "violet" },
  ],
};

function getDefaultHistoryFilterByRole(role: ReturnType<typeof getPermissionSummary>): HistoryFilter {
  if (role === "관리자") return "all";
  if (role === "입고/검수") return "inventory";
  return "work";
}

function filterHistoryLogs(logs: HistoryLog[], role: ReturnType<typeof getPermissionSummary>, filter: HistoryFilter) {
  const roleFiltered = logs.filter((log) => {
    if (role === "관리자") return true;
    if (role === "입고/검수") return log.category === "inventory";
    return log.category === "work";
  });
  if (role !== "관리자") return roleFiltered;
  if (filter === "all") return roleFiltered;
  return roleFiltered.filter((log) => log.category === filter);
}

function extractDeltaFromMessage(message: string) {
  const matched = message.match(/([+-]?\d+)/);
  if (!matched) return 0;
  return Number(matched[1]);
}

function mapHistoryToInventoryLogs(logs: HistoryLog[]): InventoryLog[] {
  return logs.filter((log) => log.category === "inventory").map((log) => ({ id: log.id, workOrderId: log.workOrderId, type: log.action as InventoryLog["type"], delta: extractDeltaFromMessage(log.message), memo: log.message, user: log.user, time: log.time }));
}

function buildSvgDataUrl(label: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><text x="400" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="${fg}">${label}</text><text x="400" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${fg}" opacity="0.8">PeacebyPiece Attachment Preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createSampleAttachments(workOrderId: string, count: number): Attachment[] {
  const base: Attachment[] = [
    { id: `${workOrderId}-att-image-1`, type: "image", name: "front-sample.jpg", url: buildSvgDataUrl("FRONT SAMPLE", "#E7EEF8", "#26415F"), ownerId: "user-designer", ownerName: "김디자이너" },
    { id: `${workOrderId}-att-pdf-1`, type: "pdf", name: "workorder-sheet.pdf", url: buildSvgDataUrl("PDF", "#FDECEC", "#991B1B"), ownerId: "user-admin", ownerName: "박관리" },
    { id: `${workOrderId}-att-image-2`, type: "image", name: "detail-note.jpg", url: buildSvgDataUrl("DETAIL NOTE", "#EEF7E9", "#31572C"), ownerId: "user-designer", ownerName: "김디자이너" },
    { id: `${workOrderId}-att-image-3`, type: "image", name: "color-chip.jpg", url: buildSvgDataUrl("COLOR CHIP", "#FFF4DF", "#9A6700"), ownerId: "user-inspection", ownerName: "이검수" },
    { id: `${workOrderId}-att-pdf-2`, type: "pdf", name: "spec-sheet.pdf", url: buildSvgDataUrl("SPEC PDF", "#F4EAFE", "#6D28D9"), ownerId: "user-admin", ownerName: "박관리" },
    { id: `${workOrderId}-att-image-4`, type: "image", name: "back-view.jpg", url: buildSvgDataUrl("BACK VIEW", "#E9F8F8", "#155E75"), ownerId: "user-inspection", ownerName: "이검수" },
  ];
  return base.slice(0, count);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createWorkflowStateMap(orders: WorkOrder[]): Record<string, WorkflowState> {
  return Object.fromEntries(orders.map((item) => [item.id, item.status as WorkflowState])) as Record<string, WorkflowState>;
}

function createInventoryQuantityMap(orders: WorkOrder[]): Record<string, number> {
  return Object.fromEntries(orders.map((item) => [item.id, item.inventoryQuantity])) as Record<string, number>;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-2026-0014", internalCode: "MN-24031", productName: "코튼 레이어드 반팔", title: "코튼 레이어드 반팔", category: "의류 > 상의 > 반팔", stage: "발주요청", vendor: "A공장", dueDate: "03/29", inventoryStatus: "부족", filesCount: 4,
    attachments: createSampleAttachments("WO-2026-0014", 4), status: "발주요청", category1: "의류", category2: "상의", category3: "반팔", season: "SS", manager: "김담당", priority: "높음", quantity: 20, inventoryQuantity: 8, memo: "샘플 1차 진행. 넥라인 시보리 톤 다운 요청.",
    historyItems: [{ time: "09:14", user: "Kty", action: "수량 30 → 50 변경" }, { time: "09:18", user: "김담당", action: "검토 완료 후 발주 요청 상태로 변경" }, { time: "09:23", user: "staff1", action: "샘플사진 2장 업로드" }, { time: "09:40", user: "Kty", action: "외주공정 나염 추가" }],
    materials: [
      { type: "원단", name: "30수 코튼", vendor: "A텍스타일", quantity: 12, unit: "yd", unitCost: 3500, totalCost: 42000, status: "발주완료" },
      { type: "원단", name: "폴리 안감", vendor: "B원단", quantity: 8, unit: "yd", unitCost: 2200, totalCost: 17600, status: "입고완료" },
      { type: "부자재", name: "단추 18mm", vendor: "C부자재", quantity: 40, unit: "개", unitCost: 120, totalCost: 4800, status: "발주완료" },
      { type: "부자재", name: "케어라벨", vendor: "D라벨", quantity: 20, unit: "개", unitCost: 150, totalCost: 3000, status: "요청전" },
    ],
    outsourcing: [
      { process: "재단", vendor: "A공장", quantity: 20, unitType: "장당", unitCost: 1500, totalCost: 30000, status: "완료" },
      { process: "봉제", vendor: "B공장", quantity: 20, unitType: "장당", unitCost: 8000, totalCost: 160000, status: "진행중" },
      { process: "나염", vendor: "C프린트", quantity: 1, unitType: "건당", unitCost: 50000, totalCost: 50000, status: "요청전" },
      { process: "라벨봉제", vendor: "D업체", quantity: 20, unitType: "장당", unitCost: 300, totalCost: 6000, status: "완료" },
    ],
  },
  {
    id: "WO-2026-0015", internalCode: "MN-24032", productName: "워싱 데님 팬츠", title: "워싱 데님 팬츠", category: "의류 > 하의 > 데님", stage: "생산중", vendor: "B공장", dueDate: "04/02", inventoryStatus: "정상", filesCount: 6,
    attachments: createSampleAttachments("WO-2026-0015", 6), status: "생산중", category1: "의류", category2: "하의", category3: "데님", season: "SS", manager: "이담당", priority: "중간", quantity: 30, inventoryQuantity: 18, memo: "워싱 강도 샘플 확인 후 본생산 진행 예정.",
    historyItems: [{ time: "10:05", user: "이담당", action: "워싱 샘플 확인 요청" }, { time: "10:20", user: "Kty", action: "봉제 수량 재확인" }],
    materials: [
      { type: "원단", name: "데님 10oz", vendor: "청원단", quantity: 20, unit: "yd", unitCost: 5200, totalCost: 104000, status: "입고완료" },
      { type: "부자재", name: "지퍼", vendor: "YKK", quantity: 30, unit: "개", unitCost: 600, totalCost: 18000, status: "발주완료" },
      { type: "부자재", name: "리벳", vendor: "금속부자재", quantity: 60, unit: "개", unitCost: 120, totalCost: 7200, status: "입고완료" },
    ],
    outsourcing: [
      { process: "재단", vendor: "B공장", quantity: 30, unitType: "장당", unitCost: 1800, totalCost: 54000, status: "완료" },
      { process: "봉제", vendor: "B공장", quantity: 30, unitType: "장당", unitCost: 9000, totalCost: 270000, status: "진행중" },
      { process: "워싱", vendor: "세탁공정", quantity: 30, unitType: "장당", unitCost: 2500, totalCost: 75000, status: "요청전" },
    ],
  },
  {
    id: "WO-2026-0016", internalCode: "MN-24033", productName: "미니 숄더백", title: "미니 숄더백", category: "가방 > 숄더백 > 미니백", stage: "완료", vendor: "C업체", dueDate: "03/18", inventoryStatus: "정상", filesCount: 3,
    attachments: createSampleAttachments("WO-2026-0016", 3), status: "완료", category1: "가방", category2: "숄더백", category3: "미니백", season: "FW", manager: "박담당", priority: "낮음", quantity: 15, inventoryQuantity: 15, memo: "완료된 샘플. 사진 아카이브만 추가 정리 예정.",
    historyItems: [{ time: "11:10", user: "박담당", action: "완료 처리" }],
    materials: [
      { type: "원단", name: "합성피혁", vendor: "가방원단", quantity: 10, unit: "yd", unitCost: 6800, totalCost: 68000, status: "입고완료" },
      { type: "부자재", name: "체인 스트랩", vendor: "금속부자재", quantity: 15, unit: "개", unitCost: 2200, totalCost: 33000, status: "입고완료" },
    ],
    outsourcing: [
      { process: "재단", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 2000, totalCost: 30000, status: "완료" },
      { process: "봉제", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 7500, totalCost: 112500, status: "완료" },
    ],
  },
];

function buildPersistedState(payload: { workOrders: WorkOrder[]; selectedId: string; users: UserProfile[]; currentUserId: string; rolePermissionTemplates: typeof ROLE_PRESETS; workflowStateById: Record<string, WorkflowState>; inventoryQuantityById: Record<string, number>; historyLogsById: Record<string, HistoryLog[]>; }) {
  return JSON.stringify(payload);
}

export default function Home() {
  const version = APP_VERSION;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [outsourcingOpen, setOutsourcingOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("WO-2026-0014");
  const [inventoryEditorOpen, setInventoryEditorOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [inventoryLogModalOpen, setInventoryLogModalOpen] = useState(false);
  const [attachmentPreviewId, setAttachmentPreviewId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [rolePermissionTemplates, setRolePermissionTemplates] = useState<typeof ROLE_PRESETS>(ROLE_PRESETS);
  const [currentUserId, setCurrentUserId] = useState("user-admin");
  const [permissionTargetUserId, setPermissionTargetUserId] = useState("user-designer");
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
      body.style.position = ""; body.style.top = ""; body.style.left = ""; body.style.right = ""; body.style.width = ""; body.style.overflow = ""; body.style.touchAction = "";
      html.style.overflow = ""; html.style.touchAction = "";
      window.scrollTo(0, lockedScrollYRef.current);
      overlayWasOpenRef.current = false;
    }
    return () => {
      if (!overlayWasOpenRef.current) return;
      body.style.position = ""; body.style.top = ""; body.style.left = ""; body.style.right = ""; body.style.width = ""; body.style.overflow = ""; body.style.touchAction = "";
      html.style.overflow = ""; html.style.touchAction = "";
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
          selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : "WO-2026-0014",
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS,
          currentUserId: typeof parsed.currentUserId === "string" ? parsed.currentUserId : "user-admin",
          rolePermissionTemplates: parsed.rolePermissionTemplates && typeof parsed.rolePermissionTemplates === "object" ? parsed.rolePermissionTemplates : ROLE_PRESETS,
          workflowStateById: parsed.workflowStateById && typeof parsed.workflowStateById === "object" ? parsed.workflowStateById : createWorkflowStateMap(INITIAL_WORK_ORDERS),
          inventoryQuantityById: parsed.inventoryQuantityById && typeof parsed.inventoryQuantityById === "object" ? parsed.inventoryQuantityById : createInventoryQuantityMap(INITIAL_WORK_ORDERS),
          historyLogsById: parsed.historyLogsById && typeof parsed.historyLogsById === "object" ? parsed.historyLogsById : INITIAL_HISTORY_LOGS,
        });
      } else {
        savedSnapshotRef.current = buildPersistedState({ workOrders: INITIAL_WORK_ORDERS, selectedId: "WO-2026-0014", users: INITIAL_USERS, currentUserId: "user-admin", rolePermissionTemplates: ROLE_PRESETS, workflowStateById: createWorkflowStateMap(INITIAL_WORK_ORDERS), inventoryQuantityById: createInventoryQuantityMap(INITIAL_WORK_ORDERS), historyLogsById: INITIAL_HISTORY_LOGS });
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

  const currentSnapshot = useMemo(() => buildPersistedState({ workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById }), [workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById]);

  useEffect(() => { if (!isHydrated) return; setIsDirty(currentSnapshot !== savedSnapshotRef.current); }, [currentSnapshot, isHydrated]);
  useEffect(() => { if (!isHydrated) return; setSaveStatus(isDirty ? "dirty" : "saved"); }, [isDirty, isHydrated]);
  useEffect(() => { if (!isHydrated || !isDirty) return; setSaveStatus("saving"); const timer = window.setTimeout(() => handleSave(true), 2500); return () => window.clearTimeout(timer); }, [currentSnapshot, isDirty, isHydrated]);
  useEffect(() => { if (!isHydrated) return; const handleBeforeUnload = (event: BeforeUnloadEvent) => { if (!isDirty) return; event.preventDefault(); event.returnValue = ""; }; window.addEventListener("beforeunload", handleBeforeUnload); return () => window.removeEventListener("beforeunload", handleBeforeUnload); }, [isDirty, isHydrated]);

  const handleSave = (isAutoSave = false) => {
    if (!isHydrated) return;
    const savedAt = getCurrentTimeLabel();
    const payload = { workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById, lastSavedAt: savedAt };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, storageSchemaVersion: STORAGE_SCHEMA_VERSION }));
      savedSnapshotRef.current = buildPersistedState({ workOrders, selectedId, users, currentUserId, rolePermissionTemplates, workflowStateById, inventoryQuantityById, historyLogsById });
      setLastSavedAt(savedAt); setIsDirty(false); setSaveStatus("saved");
    } catch (error) {
      setSaveStatus(isAutoSave ? "dirty" : "dirty");
      console.error("localStorage save failed", error);
    }
  };

  useEffect(() => { setHistoryFilter(getDefaultHistoryFilterByRole(currentRole)); }, [currentRole]);

  const availableActions = (ACTIONS_BY_STATE[currentWorkflowState] ?? []).filter((action) => currentUser.permissions[action.permission]);
  const visibleStages = getVisibleStageListByUser(currentUser, currentWorkflowState);

  const handleSelectWorkOrder = (id: string, closeDrawer = false) => { setSelectedId(id); setMaterialOpen(false); setOutsourcingOpen(false); if (closeDrawer) setDrawerOpen(false); };

  const handleCreateWorkOrder = (closeDrawer = false) => {
    const newId = `WO-2026-${String(workOrders.length + 14).padStart(4, "0")}`;
    const newInternalCode = `MN-${String(24031 + workOrders.length).padStart(5, "0")}`;
    const draftTitle = `새 작업지시서 ${workOrders.length - 2}`;
    const newWorkOrder: WorkOrder = { id: newId, internalCode: newInternalCode, productName: draftTitle, title: draftTitle, category: "미분류 > 미분류 > 미분류", stage: "작성중", vendor: "미정", dueDate: "미정", inventoryStatus: "확인전", filesCount: 0, attachments: [], status: "작성중", category1: "미분류", category2: "미분류", category3: "미분류", season: "미정", manager: currentUser.name, priority: "보통", quantity: 0, inventoryQuantity: 0, memo: "새 작업지시서 초안입니다.", historyItems: [{ time: getCurrentTimeLabel(), user: currentUser.name, action: "새 작업지시서 초안 생성" }], materials: [], outsourcing: [] };
    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setWorkflowStateById((prev) => ({ ...prev, [newId]: "작성중" }));
    setInventoryQuantityById((prev) => ({ ...prev, [newId]: 0 }));
    setHistoryLogsById((prev) => ({ ...prev, [newId]: [{ id: `${newId}-created-${Date.now()}`, workOrderId: newId, category: "work", action: "작업지시서 생성", message: "작업지시서 초안을 생성했습니다.", user: currentUser.name, time: getCurrentTimeLabel(), tone: "blue" }] }));
    setSelectedId(newId); setMaterialOpen(false); setOutsourcingOpen(false); if (closeDrawer) setDrawerOpen(false);
  };

  const getWorkflowActionKey = (action: WorkflowAction) => `${action.nextState}-${action.label.replace(/\s+/g, "-")}`;
  const getWorkflowActionTone = (action: WorkflowAction): HistoryTone => action.label.includes("반려") ? "rose" : "violet";

  const handleWorkflowAction = (action: WorkflowAction) => {
    setWorkflowStateById((prev) => ({ ...prev, [selectedWorkOrder.id]: action.nextState }));
    setHistoryLogsById((prev) => ({ ...prev, [selectedWorkOrder.id]: [{ id: `${selectedWorkOrder.id}-${getWorkflowActionKey(action)}-${Date.now()}`, workOrderId: selectedWorkOrder.id, category: "work", action: action.label, message: `${action.label} 처리: ${currentWorkflowState} → ${action.nextState}`, user: currentUser.name, time: getCurrentTimeLabel(), tone: getWorkflowActionTone(action) }, ...(prev[selectedWorkOrder.id] ?? [])] }));
  };

  const handleInventoryApply = ({ type, quantity, memo }: { type: "입고" | "차감" | "보정"; quantity: number; memo: string }) => {
    const current = inventoryQuantityById[selectedWorkOrder.id] ?? selectedWorkOrder.inventoryQuantity;
    const nextValue = type === "입고" ? current + quantity : type === "차감" ? Math.max(0, current - quantity) : quantity;
    setInventoryQuantityById((prev) => ({ ...prev, [selectedWorkOrder.id]: nextValue }));
    if (type === "입고" && currentWorkflowState === "입고대기" && nextValue > 0) setWorkflowStateById((prev) => ({ ...prev, [selectedWorkOrder.id]: "검수중" }));
    const delta = type === "입고" ? quantity : type === "차감" ? -quantity : quantity - current;
    setHistoryLogsById((prev) => ({ ...prev, [selectedWorkOrder.id]: [{ id: `${selectedWorkOrder.id}-${Date.now()}`, workOrderId: selectedWorkOrder.id, category: "inventory", action: type, message: `${type} ${delta > 0 ? `+${delta}` : delta}${memo ? ` · ${memo}` : ""}`, user: currentUser.name, time: getCurrentTimeLabel(), tone: type === "입고" ? "emerald" : type === "차감" ? "rose" : "amber" }, ...(prev[selectedWorkOrder.id] ?? [])] }));
  };

  const handleApplyRole = (userId: string, role: RoleType) => {
    const preset = rolePermissionTemplates[role];
    setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, team: preset.team, permissions: { ...preset.permissions } } : user));
  };

  const handleOpenAttachmentPicker = () => attachmentInputRef.current?.click();

  const handleAttachmentFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    try {
      const uploaded = await Promise.all(files.map(async (file) => ({ id: `${selectedWorkOrder.id}-attachment-${Date.now()}-${file.name}`, type: file.type === "application/pdf" ? ("pdf" as const) : ("image" as const), name: file.name, url: await readFileAsDataUrl(file), ownerId: currentUser.id, ownerName: currentUser.name })));
      setWorkOrders((prev) => prev.map((workOrder) => workOrder.id === selectedWorkOrder.id ? { ...workOrder, attachments: [...(workOrder.attachments ?? []), ...uploaded], filesCount: (workOrder.attachments ?? []).length + uploaded.length } : workOrder));
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef}>
        <MobileTopBar version={version} onOpen={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} workOrders={workOrders} selectedId={selectedId} workflowStateById={workflowStateById} onSelect={handleSelectWorkOrder} onCreate={handleCreateWorkOrder} />
        <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-12">
          <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
            <SidebarContent version={version} workOrders={workOrders} selectedId={selectedId} workflowStateById={workflowStateById} onSelect={handleSelectWorkOrder} onCreate={handleCreateWorkOrder} />
          </aside>
          <section className="min-w-0 p-4 md:col-span-6 md:overflow-y-auto md:p-6">
            <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-cyan-900">모바일 체크포인트</div>
                  <div className="mt-1 text-xs text-cyan-800">모바일 체크포인트 기준: 버전/드로어/카드 정보량/모달 동작 확인</div>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-cyan-800">state</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-cyan-900">
                <div>1. 상단 버전이 v0.1.6으로 표시되는지</div>
                <div>2. 메뉴에서 작업 선택 시 드로어가 닫히는지</div>
                <div>3. 우측 진행단계 카드가 상태/액션 구조로 유지되는지</div>
                <div>4. 권한/사용자 변경 시 액션 버튼과 재고 수정 가능 여부가 달라지는지</div>
              </div>
            </div>
            <WorkOrderDetail
              workOrder={selectedWorkOrder}
              currentWorkflowState={currentWorkflowState}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              currentInventoryQuantity={currentInventoryQuantity}
              currentUserName={currentUser.name}
              currentRole={currentRole}
              canEditInventory={canEditInventory}
              canSeeProductionSections={canSeeProductionSections}
              canSeeAttachments={canSeeAttachments}
              materialOpen={materialOpen}
              outsourcingOpen={outsourcingOpen}
              attachmentInputRef={attachmentInputRef}
              onSave={() => handleSave(false)}
              onOpenInventoryEditor={() => setInventoryEditorOpen(true)}
              onToggleMaterial={() => setMaterialOpen((prev) => !prev)}
              onToggleOutsourcing={() => setOutsourcingOpen((prev) => !prev)}
              onOpenAttachmentPicker={handleOpenAttachmentPicker}
              onAttachmentFiles={handleAttachmentFiles}
              onPreviewAttachment={setAttachmentPreviewId}
              onDeleteAttachment={handleDeleteAttachment}
              canDeleteAttachment={canDeleteAttachment}
            />
          </section>
          <aside className="min-w-0 border-t border-stone-200 bg-stone-50 p-4 md:col-span-3 md:border-t-0 md:border-l md:p-6">
            <WorkOrderSidePanel
              currentUser={currentUser}
              users={users}
              onCurrentUserChange={setCurrentUserId}
              onOpenPermissions={() => setPermissionModalOpen(true)}
              currentState={currentWorkflowState}
              currentDisplayStage={currentDisplayStage}
              visibleStages={visibleStages}
              actions={availableActions}
              onAction={handleWorkflowAction}
              canSeeCostSections={canSeeCostSections}
              fabricTotal={fabricTotal}
              subsidiaryTotal={subsidiaryTotal}
              outsourcingTotal={outsourcingTotal}
              totalCost={totalCost}
              unitCost={unitCost}
              outsourcing={outsourcing}
              canSeeInventoryHistorySection={canSeeInventoryHistorySection}
              isAdmin={isAdmin}
              currentRole={currentRole}
              filteredHistoryLogs={filteredHistoryLogs}
              historyFilter={historyFilter}
              onHistoryFilterChange={setHistoryFilter}
              onOpenInventoryLogModal={() => setInventoryLogModalOpen(true)}
            />
          </aside>
        </div>
      </div>

      <AttachmentPreviewModal attachment={selectedAttachment} canDelete={canDeleteAttachment(selectedAttachment)} onClose={() => setAttachmentPreviewId(null)} onDelete={() => selectedAttachment && handleDeleteAttachment(selectedAttachment.id)} />
      <InventoryLogModal open={inventoryLogModalOpen} onClose={() => setInventoryLogModalOpen(false)} logs={filteredHistoryLogs} role={currentRole} filter={historyFilter} />
      <InventoryEditor open={inventoryEditorOpen} onClose={() => setInventoryEditorOpen(false)} currentStock={currentInventoryQuantity} currentUserName={currentUser.name} logs={inventoryLogs} onApply={handleInventoryApply} />
      <PermissionModal open={permissionModalOpen} onClose={() => setPermissionModalOpen(false)} users={users} currentUserId={currentUserId} selectedUserId={permissionTargetUserId} onSelectedUserChange={setPermissionTargetUserId} onApplyRole={handleApplyRole} />
    </main>
  );
}
