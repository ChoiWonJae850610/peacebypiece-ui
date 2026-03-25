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
import { APP_VERSION, LEGACY_STORAGE_KEYS, STORAGE_KEY, STORAGE_SCHEMA_VERSION } from "@/lib/constants/app";
import { getPermissionSummary, INITIAL_USERS, ROLE_PRESETS } from "@/lib/constants/roles";
import {
  ACTIONS_BY_STATE,
  getDisplayStage,
  getDisplayStageDescription,
  getStageTone,
  getVisibleStageListByUser,
  PRIMARY_FLOW,
  STAGE_ORDER,
} from "@/lib/constants/workflow";
import { canDeleteAttachmentByUser } from "@/lib/permissions/attachments";
import type {
  Attachment,
  DisplayStage,
  HistoryFilter,
  HistoryLog,
  HistoryTone,
  InventoryLog,
  Material,
  Outsourcing,
  PermissionKey,
  RoleType,
  UserProfile,
  WorkOrder,
  WorkflowAction,
  WorkflowState,
} from "@/types/workorder";

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
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  }

  return null;
}

const INITIAL_HISTORY_LOGS: Record<string, HistoryLog[]> = {
  "WO-2026-0014": [
    {
      id: "h-14-1",
      workOrderId: "WO-2026-0014",
      category: "work",
      action: "작업지시서 생성",
      message: "작업지시서가 생성되었습니다.",
      user: "김디자이너",
      time: "03-21 09:00",
      tone: "blue",
    },
    {
      id: "h-14-2",
      workOrderId: "WO-2026-0014",
      category: "work",
      action: "검토 요청",
      message: "검토 요청을 진행했습니다.",
      user: "김디자이너",
      time: "03-21 13:20",
      tone: "violet",
    },
    {
      id: "h-14-3",
      workOrderId: "WO-2026-0014",
      category: "work",
      action: "발주 요청",
      message: "발주 요청 상태로 변경했습니다.",
      user: "박관리",
      time: "03-22 09:18",
      tone: "blue",
    },
    {
      id: "h-14-4",
      workOrderId: "WO-2026-0014",
      category: "inventory",
      action: "입고",
      message: "입고 +5 · 샘플 1차 입고",
      user: "박관리",
      time: "03-22 11:40",
      tone: "emerald",
    },
    {
      id: "h-14-5",
      workOrderId: "WO-2026-0014",
      category: "inventory",
      action: "차감",
      message: "차감 -2 · 검수 불량 차감",
      user: "이검수",
      time: "03-22 16:20",
      tone: "rose",
    },
  ],
  "WO-2026-0015": [
    {
      id: "h-15-1",
      workOrderId: "WO-2026-0015",
      category: "work",
      action: "작업지시서 생성",
      message: "작업지시서가 생성되었습니다.",
      user: "김디자이너",
      time: "03-20 10:00",
      tone: "blue",
    },
    {
      id: "h-15-2",
      workOrderId: "WO-2026-0015",
      category: "work",
      action: "메모 수정",
      message: "워싱 샘플 확인 메모를 수정했습니다.",
      user: "이담당",
      time: "03-22 10:05",
      tone: "stone",
    },
  ],
  "WO-2026-0016": [
    {
      id: "h-16-1",
      workOrderId: "WO-2026-0016",
      category: "work",
      action: "작업지시서 생성",
      message: "작업지시서가 생성되었습니다.",
      user: "박관리",
      time: "03-17 15:10",
      tone: "blue",
    },
    {
      id: "h-16-2",
      workOrderId: "WO-2026-0016",
      category: "work",
      action: "완료 처리",
      message: "검수 완료 후 작업을 완료 처리했습니다.",
      user: "박관리",
      time: "03-18 11:10",
      tone: "violet",
    },
  ],
};

function getHistoryToneClass(tone: HistoryTone) {
  switch (tone) {
    case "blue":
      return "bg-blue-100 text-blue-700";
    case "violet":
      return "bg-violet-100 text-violet-700";
    case "emerald":
      return "bg-emerald-100 text-emerald-700";
    case "rose":
      return "bg-rose-100 text-rose-700";
    case "amber":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function getDefaultHistoryFilterByRole(
  role: ReturnType<typeof getPermissionSummary>,
): HistoryFilter {
  if (role === "관리자") return "all";
  if (role === "입고/검수") return "inventory";
  return "work";
}

function filterHistoryLogs(
  logs: HistoryLog[],
  role: ReturnType<typeof getPermissionSummary>,
  filter: HistoryFilter,
) {
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
  return logs
    .filter((log) => log.category === "inventory")
    .map((log) => ({
      id: log.id,
      workOrderId: log.workOrderId,
      type: log.action as InventoryLog["type"],
      delta: extractDeltaFromMessage(log.message),
      memo: log.message,
      user: log.user,
      time: log.time,
    }));
}

function buildSvgDataUrl(label: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><text x="400" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="${fg}">${label}</text><text x="400" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${fg}" opacity="0.8">PeacebyPiece Attachment Preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createSampleAttachments(workOrderId: string, count: number): Attachment[] {
  const base: Attachment[] = [
    {
      id: `${workOrderId}-att-image-1`,
      type: "image",
      name: "front-sample.jpg",
      url: buildSvgDataUrl("FRONT SAMPLE", "#E7EEF8", "#26415F"),
      ownerId: "user-designer",
      ownerName: "김디자이너",
    },
    {
      id: `${workOrderId}-att-pdf-1`,
      type: "pdf",
      name: "workorder-sheet.pdf",
      url: buildSvgDataUrl("PDF", "#FDECEC", "#991B1B"),
      ownerId: "user-admin",
      ownerName: "박관리",
    },
    {
      id: `${workOrderId}-att-image-2`,
      type: "image",
      name: "detail-note.jpg",
      url: buildSvgDataUrl("DETAIL NOTE", "#EEF7E9", "#31572C"),
      ownerId: "user-designer",
      ownerName: "김디자이너",
    },
    {
      id: `${workOrderId}-att-image-3`,
      type: "image",
      name: "color-chip.jpg",
      url: buildSvgDataUrl("COLOR CHIP", "#FFF4DF", "#9A6700"),
      ownerId: "user-inspection",
      ownerName: "이검수",
    },
    {
      id: `${workOrderId}-att-pdf-2`,
      type: "pdf",
      name: "spec-sheet.pdf",
      url: buildSvgDataUrl("SPEC PDF", "#F4EAFE", "#6D28D9"),
      ownerId: "user-admin",
      ownerName: "박관리",
    },
    {
      id: `${workOrderId}-att-image-4`,
      type: "image",
      name: "back-view.jpg",
      url: buildSvgDataUrl("BACK VIEW", "#E9F8F8", "#155E75"),
      ownerId: "user-inspection",
      ownerName: "이검수",
    },
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

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-2026-0014",
    internalCode: "MN-24031",
    productName: "코튼 레이어드 반팔",
    title: "코튼 레이어드 반팔",
    category: "의류 > 상의 > 반팔",
    stage: "발주요청",
    vendor: "A공장",
    dueDate: "03/29",
    inventoryStatus: "부족",
    filesCount: 4,
    attachments: createSampleAttachments("WO-2026-0014", 4),
    status: "발주요청",
    category1: "의류",
    category2: "상의",
    category3: "반팔",
    season: "SS",
    manager: "김담당",
    priority: "높음",
    quantity: 20,
    inventoryQuantity: 8,
    memo: "샘플 1차 진행. 넥라인 시보리 톤 다운 요청.",
    historyItems: [
      { time: "09:14", user: "Kty", action: "수량 30 → 50 변경" },
      {
        time: "09:18",
        user: "김담당",
        action: "검토 완료 후 발주 요청 상태로 변경",
      },
      { time: "09:23", user: "staff1", action: "샘플사진 2장 업로드" },
      { time: "09:40", user: "Kty", action: "외주공정 나염 추가" },
    ],
    materials: [
      {
        type: "원단",
        name: "30수 코튼",
        vendor: "A텍스타일",
        quantity: 12,
        unit: "yd",
        unitCost: 3500,
        totalCost: 42000,
        status: "발주완료",
      },
      {
        type: "원단",
        name: "폴리 안감",
        vendor: "B원단",
        quantity: 8,
        unit: "yd",
        unitCost: 2200,
        totalCost: 17600,
        status: "입고완료",
      },
      {
        type: "부자재",
        name: "단추 18mm",
        vendor: "C부자재",
        quantity: 40,
        unit: "개",
        unitCost: 120,
        totalCost: 4800,
        status: "발주완료",
      },
      {
        type: "부자재",
        name: "케어라벨",
        vendor: "D라벨",
        quantity: 20,
        unit: "개",
        unitCost: 150,
        totalCost: 3000,
        status: "요청전",
      },
    ],
    outsourcing: [
      {
        process: "재단",
        vendor: "A공장",
        quantity: 20,
        unitType: "장당",
        unitCost: 1500,
        totalCost: 30000,
        status: "완료",
      },
      {
        process: "봉제",
        vendor: "B공장",
        quantity: 20,
        unitType: "장당",
        unitCost: 8000,
        totalCost: 160000,
        status: "진행중",
      },
      {
        process: "나염",
        vendor: "C프린트",
        quantity: 1,
        unitType: "건당",
        unitCost: 50000,
        totalCost: 50000,
        status: "요청전",
      },
      {
        process: "라벨봉제",
        vendor: "D업체",
        quantity: 20,
        unitType: "장당",
        unitCost: 300,
        totalCost: 6000,
        status: "완료",
      },
    ],
  },
  {
    id: "WO-2026-0015",
    internalCode: "MN-24032",
    productName: "워싱 데님 팬츠",
    title: "워싱 데님 팬츠",
    category: "의류 > 하의 > 데님",
    stage: "생산중",
    vendor: "B공장",
    dueDate: "04/02",
    inventoryStatus: "정상",
    filesCount: 6,
    attachments: createSampleAttachments("WO-2026-0015", 6),
    status: "생산중",
    category1: "의류",
    category2: "하의",
    category3: "데님",
    season: "SS",
    manager: "이담당",
    priority: "중간",
    quantity: 30,
    inventoryQuantity: 18,
    memo: "워싱 강도 샘플 확인 후 본생산 진행 예정.",
    historyItems: [
      { time: "10:05", user: "이담당", action: "워싱 샘플 확인 요청" },
      { time: "10:20", user: "Kty", action: "봉제 수량 재확인" },
    ],
    materials: [
      {
        type: "원단",
        name: "데님 10oz",
        vendor: "청원단",
        quantity: 20,
        unit: "yd",
        unitCost: 5200,
        totalCost: 104000,
        status: "입고완료",
      },
      {
        type: "부자재",
        name: "지퍼",
        vendor: "YKK",
        quantity: 30,
        unit: "개",
        unitCost: 600,
        totalCost: 18000,
        status: "발주완료",
      },
      {
        type: "부자재",
        name: "리벳",
        vendor: "금속부자재",
        quantity: 60,
        unit: "개",
        unitCost: 120,
        totalCost: 7200,
        status: "입고완료",
      },
    ],
    outsourcing: [
      {
        process: "재단",
        vendor: "B공장",
        quantity: 30,
        unitType: "장당",
        unitCost: 1800,
        totalCost: 54000,
        status: "완료",
      },
      {
        process: "봉제",
        vendor: "B공장",
        quantity: 30,
        unitType: "장당",
        unitCost: 9000,
        totalCost: 270000,
        status: "진행중",
      },
      {
        process: "워싱",
        vendor: "세탁공정",
        quantity: 30,
        unitType: "장당",
        unitCost: 2500,
        totalCost: 75000,
        status: "요청전",
      },
    ],
  },
  {
    id: "WO-2026-0016",
    internalCode: "MN-24033",
    productName: "미니 숄더백",
    title: "미니 숄더백",
    category: "가방 > 숄더백 > 미니백",
    stage: "완료",
    vendor: "C업체",
    dueDate: "03/18",
    inventoryStatus: "정상",
    filesCount: 3,
    attachments: createSampleAttachments("WO-2026-0016", 3),
    status: "완료",
    category1: "가방",
    category2: "숄더백",
    category3: "미니백",
    season: "FW",
    manager: "박담당",
    priority: "낮음",
    quantity: 15,
    inventoryQuantity: 15,
    memo: "완료된 샘플. 사진 아카이브만 추가 정리 예정.",
    historyItems: [{ time: "11:10", user: "박담당", action: "완료 처리" }],
    materials: [
      {
        type: "원단",
        name: "합성피혁",
        vendor: "가방원단",
        quantity: 10,
        unit: "yd",
        unitCost: 6800,
        totalCost: 68000,
        status: "입고완료",
      },
      {
        type: "부자재",
        name: "체인 스트랩",
        vendor: "금속부자재",
        quantity: 15,
        unit: "개",
        unitCost: 2200,
        totalCost: 33000,
        status: "입고완료",
      },
    ],
    outsourcing: [
      {
        process: "재단",
        vendor: "C업체",
        quantity: 15,
        unitType: "개당",
        unitCost: 2000,
        totalCost: 30000,
        status: "완료",
      },
      {
        process: "봉제",
        vendor: "C업체",
        quantity: 15,
        unitType: "개당",
        unitCost: 7500,
        totalCost: 112500,
        status: "완료",
      },
    ],
  },
];

function buildPersistedState(payload: {
  workOrders: WorkOrder[];
  selectedId: string;
  users: UserProfile[];
  currentUserId: string;
  rolePermissionTemplates: typeof ROLE_PRESETS;
  workflowStateById: Record<string, WorkflowState>;
  inventoryQuantityById: Record<string, number>;
  historyLogsById: Record<string, HistoryLog[]>;
}) {
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
  const [permissionTargetUserId, setPermissionTargetUserId] =
    useState("user-designer");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const lockedScrollYRef = useRef(0);
  const overlayWasOpenRef = useRef(false);
  const savedSnapshotRef = useRef<string>("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">(
    "saved",
  );
  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>(INITIAL_WORK_ORDERS);

  const blockingOverlayOpen =
    drawerOpen ||
    inventoryEditorOpen ||
    permissionModalOpen ||
    inventoryLogModalOpen ||
    attachmentPreviewId !== null;

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
        if (typeof parsed.selectedId === "string")
          setSelectedId(parsed.selectedId);
        if (Array.isArray(parsed.users)) setUsers(parsed.users);
        if (parsed.rolePermissionTemplates && typeof parsed.rolePermissionTemplates === "object") setRolePermissionTemplates(parsed.rolePermissionTemplates);
        if (typeof parsed.currentUserId === "string")
          setCurrentUserId(parsed.currentUserId);
        if (
          parsed.workflowStateById &&
          typeof parsed.workflowStateById === "object"
        )
          setWorkflowStateById(parsed.workflowStateById);
        if (
          parsed.inventoryQuantityById &&
          typeof parsed.inventoryQuantityById === "object"
        )
          setInventoryQuantityById(parsed.inventoryQuantityById);
        if (
          parsed.historyLogsById &&
          typeof parsed.historyLogsById === "object"
        )
          setHistoryLogsById(parsed.historyLogsById);
        if (typeof parsed.lastSavedAt === "string")
          setLastSavedAt(parsed.lastSavedAt);
        savedSnapshotRef.current = buildPersistedState({
          workOrders: Array.isArray(parsed.workOrders)
            ? parsed.workOrders
            : INITIAL_WORK_ORDERS,
          selectedId:
            typeof parsed.selectedId === "string"
              ? parsed.selectedId
              : "WO-2026-0014",
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS,
          currentUserId:
            typeof parsed.currentUserId === "string"
              ? parsed.currentUserId
              : "user-admin",
          rolePermissionTemplates: parsed.rolePermissionTemplates && typeof parsed.rolePermissionTemplates === "object" ? parsed.rolePermissionTemplates : ROLE_PRESETS,
          workflowStateById:
            parsed.workflowStateById &&
            typeof parsed.workflowStateById === "object"
              ? parsed.workflowStateById
              : Object.fromEntries(
                  INITIAL_WORK_ORDERS.map((item) => [item.id, item.status]),
                ),
          inventoryQuantityById:
            parsed.inventoryQuantityById &&
            typeof parsed.inventoryQuantityById === "object"
              ? parsed.inventoryQuantityById
              : Object.fromEntries(
                  INITIAL_WORK_ORDERS.map((item) => [
                    item.id,
                    item.inventoryQuantity,
                  ]),
                ),
          historyLogsById:
            parsed.historyLogsById && typeof parsed.historyLogsById === "object"
              ? parsed.historyLogsById
              : INITIAL_HISTORY_LOGS,
        });
      } else {
        savedSnapshotRef.current = buildPersistedState({
          workOrders: INITIAL_WORK_ORDERS,
          selectedId: "WO-2026-0014",
          users: INITIAL_USERS,
          currentUserId: "user-admin",
          rolePermissionTemplates: ROLE_PRESETS,
          workflowStateById: Object.fromEntries(
            INITIAL_WORK_ORDERS.map((item) => [item.id, item.status]),
          ),
          inventoryQuantityById: Object.fromEntries(
            INITIAL_WORK_ORDERS.map((item) => [
              item.id,
              item.inventoryQuantity,
            ]),
          ),
          historyLogsById: INITIAL_HISTORY_LOGS,
        });
      }
    } catch (error) {
      console.error("localStorage load failed", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const [workflowStateById, setWorkflowStateById] = useState<
    Record<string, WorkflowState>
  >(() =>
    Object.fromEntries(
      INITIAL_WORK_ORDERS.map((item) => [item.id, item.status]),
    ),
  );
  const [inventoryQuantityById, setInventoryQuantityById] = useState<
    Record<string, number>
  >(() =>
    Object.fromEntries(
      INITIAL_WORK_ORDERS.map((item) => [item.id, item.inventoryQuantity]),
    ),
  );
  const [historyLogsById, setHistoryLogsById] = useState<
    Record<string, HistoryLog[]>
  >(() => INITIAL_HISTORY_LOGS);

  const selectedWorkOrder =
    workOrders.find((item) => item.id === selectedId) ?? workOrders[0];
  const currentWorkflowState =
    workflowStateById[selectedWorkOrder.id] ?? selectedWorkOrder.status;
  const currentUser =
    users.find((item) => item.id === currentUserId) ?? users[0];
  const currentRole = getPermissionSummary(currentUser);
  const isAdmin = currentRole === "관리자";
  const canSeeProductionSections = currentUser.permissions.viewProductionDetails;
  const canSeeCostSections = currentUser.permissions.viewCost;
  const canViewInventoryHistory = currentUser.permissions.viewInventoryHistory;
  const canEditInventory = currentUser.permissions.inventoryEdit;
  const canSeeInventoryHistorySection =
    currentRole === "디자이너" ? true : canViewInventoryHistory;
  const canSeeAttachments = currentUser.permissions.viewAttachments;
  const canEditAttachments =
    (currentUser.permissions.editAttachments || currentUser.permissions.permissionManage) &&
    currentUser.permissions.viewAttachments;
  const currentDisplayStage = getDisplayStage(currentWorkflowState);
  const currentInventoryQuantity =
    inventoryQuantityById[selectedWorkOrder.id] ??
    selectedWorkOrder.inventoryQuantity;
  const historyLogs = historyLogsById[selectedWorkOrder.id] ?? [];
  const filteredHistoryLogs = filterHistoryLogs(
    historyLogs,
    currentRole,
    historyFilter,
  );
  const inventoryLogs = mapHistoryToInventoryLogs(historyLogs);
  const selectedAttachment =
    selectedWorkOrder.attachments.find((item) => item.id === attachmentPreviewId) ?? null;
  const canDeleteAttachment = (attachment: Attachment | null) => canDeleteAttachmentByUser(currentUser, attachment);

  const materials = selectedWorkOrder.materials;
  const outsourcing = selectedWorkOrder.outsourcing;

  const fabricTotal = materials
    .filter((item) => item.type === "원단")
    .reduce((sum, item) => sum + item.totalCost, 0);
  const subsidiaryTotal = materials
    .filter((item) => item.type === "부자재")
    .reduce((sum, item) => sum + item.totalCost, 0);
  const outsourcingTotal = outsourcing.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal;
  const unitCost = Math.round(totalCost / selectedWorkOrder.quantity);

  const materialSummary = useMemo(() => {
    return {
      count: materials.length,
      total: materials.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }, [materials]);

  const outsourcingSummary = useMemo(() => {
    return {
      count: outsourcing.length,
      total: outsourcing.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }, [outsourcing]);

  const currentSnapshot = useMemo(
    () =>
      buildPersistedState({
        workOrders,
        selectedId,
        users,
        currentUserId,
        rolePermissionTemplates,
        workflowStateById,
        inventoryQuantityById,
        historyLogsById,
      }),
    [
      workOrders,
      selectedId,
      users,
      currentUserId,
      rolePermissionTemplates,
      workflowStateById,
      inventoryQuantityById,
      historyLogsById,
    ],
  );

  useEffect(() => {
    if (!isHydrated) return;
    setIsDirty(currentSnapshot !== savedSnapshotRef.current);
  }, [currentSnapshot, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isDirty) {
      setSaveStatus((prev) => (prev === "saving" ? prev : "dirty"));
    } else {
      setSaveStatus("saved");
    }
  }, [isDirty, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !isDirty) return;

    setSaveStatus("saving");
    const timer = window.setTimeout(() => {
      handleSave(true);
    }, 2500);

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

  const handleSave = (isAutoSave = false) => {
    if (!isHydrated) return;
    const savedAt = getCurrentTimeLabel();
    const payload = {
      workOrders,
      selectedId,
      users,
      currentUserId,
      rolePermissionTemplates,
      workflowStateById,
      inventoryQuantityById,
      historyLogsById,
      lastSavedAt: savedAt,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, storageSchemaVersion: STORAGE_SCHEMA_VERSION }));
      savedSnapshotRef.current = buildPersistedState({
        workOrders,
        selectedId,
        users,
        currentUserId,
        rolePermissionTemplates,
        workflowStateById,
        inventoryQuantityById,
        historyLogsById,
      });
      setLastSavedAt(savedAt);
      setIsDirty(false);
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus(isAutoSave ? "dirty" : "dirty");
      console.error("localStorage save failed", error);
    }
  };

  useEffect(() => {
    setHistoryFilter(getDefaultHistoryFilterByRole(currentRole));
  }, [currentRole]);

  const availableActions = (
    ACTIONS_BY_STATE[currentWorkflowState] ?? []
  ).filter((action) => currentUser.permissions[action.permission]);
  const visibleStages = getVisibleStageListByUser(
    currentUser,
    currentWorkflowState,
  );

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
      historyItems: [
        {
          time: getCurrentTimeLabel(),
          user: currentUser.name,
          action: "새 작업지시서 초안 생성",
        },
      ],
      materials: [],
      outsourcing: [],
    };

    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setWorkflowStateById((prev) => ({ ...prev, [newId]: "작성중" }));
    setInventoryQuantityById((prev) => ({ ...prev, [newId]: 0 }));
    setHistoryLogsById((prev) => ({
      ...prev,
      [newId]: [
        {
          id: `${newId}-created-${Date.now()}`,
          workOrderId: newId,
          category: "work",
          action: "작업지시서 생성",
          message: "작업지시서 초안을 생성했습니다.",
          user: currentUser.name,
          time: getCurrentTimeLabel(),
          tone: "blue",
        },
      ],
    }));
    setSelectedId(newId);
    setMaterialOpen(false);
    setOutsourcingOpen(false);
    if (closeDrawer) setDrawerOpen(false);
  };

  const handleWorkflowAction = (action: WorkflowAction) => {
    setWorkflowStateById((prev) => ({
      ...prev,
      [selectedWorkOrder.id]: action.nextState,
    }));
    setHistoryLogsById((prev) => ({
      ...prev,
      [selectedWorkOrder.id]: [
        {
          id: `${selectedWorkOrder.id}-${action.id}-${Date.now()}`,
          workOrderId: selectedWorkOrder.id,
          category: "work",
          action: action.label,
          message: `${action.label} 처리: ${currentWorkflowState} → ${action.nextState}`,
          user: currentUser.name,
          time: getCurrentTimeLabel(),
          tone: action.id === "rejectReview" ? "rose" : "violet",
        },
        ...(prev[selectedWorkOrder.id] ?? []),
      ],
    }));
  };

  const handleInventoryApply = ({
    type,
    quantity,
    memo,
  }: {
    type: "입고" | "차감" | "보정";
    quantity: number;
    memo: string;
  }) => {
    const current =
      inventoryQuantityById[selectedWorkOrder.id] ??
      selectedWorkOrder.inventoryQuantity;
    const nextValue =
      type === "입고"
        ? current + quantity
        : type === "차감"
          ? Math.max(0, current - quantity)
          : quantity;

    setInventoryQuantityById((prev) => ({
      ...prev,
      [selectedWorkOrder.id]: nextValue,
    }));

    if (
      type === "입고" &&
      currentWorkflowState === "입고대기" &&
      nextValue > 0
    ) {
      setWorkflowStateById((prev) => ({
        ...prev,
        [selectedWorkOrder.id]: "검수중",
      }));
    }

    const delta =
      type === "입고"
        ? quantity
        : type === "차감"
          ? -quantity
          : quantity - current;

    setHistoryLogsById((prev) => ({
      ...prev,
      [selectedWorkOrder.id]: [
        {
          id: `${selectedWorkOrder.id}-${Date.now()}`,
          workOrderId: selectedWorkOrder.id,
          category: "inventory",
          action: type,
          message: `${type} ${delta > 0 ? `+${delta}` : delta}${memo ? ` · ${memo}` : ""}`,
          user: currentUser.name,
          time: getCurrentTimeLabel(),
          tone:
            type === "입고" ? "emerald" : type === "차감" ? "rose" : "amber",
        },
        ...(prev[selectedWorkOrder.id] ?? []),
      ],
    }));
  };

  const handleTogglePermission = (userId: string, key: PermissionKey) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [key]: !user.permissions[key],
              },
            }
          : user,
      ),
    );
  };

  const handleToggleRolePermission = (
    role: "디자이너" | "관리자" | "입고/검수",
    key:
      | "viewAttachments"
      | "editAttachments"
      | "viewCost"
      | "viewInventoryHistory"
      | "viewProductionDetails",
  ) => {
    setRolePermissionTemplates((prev) => {
      const currentTemplate = prev[role];
      let nextPermissions = {
        ...currentTemplate.permissions,
        [key]: !currentTemplate.permissions[key],
      };

      if (key === "viewAttachments" && !nextPermissions.viewAttachments) {
        nextPermissions.editAttachments = false;
      }

      if (key === "editAttachments" && nextPermissions.editAttachments) {
        nextPermissions.viewAttachments = true;
      }

      const nextTemplates = {
        ...prev,
        [role]: {
          ...currentTemplate,
          permissions: nextPermissions,
        },
      };

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.team === currentTemplate.team
            ? {
                ...user,
                permissions: {
                  ...nextTemplates[role].permissions,
                },
              }
            : user,
        ),
      );

      return nextTemplates;
    });
  };

  const handleApplyRole = (
    userId: string,
    role: "디자이너" | "관리자" | "입고/검수",
  ) => {
    const preset = rolePermissionTemplates[role];
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              team: preset.team,
              permissions: { ...preset.permissions },
            }
          : user,
      ),
    );
  };

  const handleOpenAttachmentPicker = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentFiles = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
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

      setWorkOrders((prev) =>
        prev.map((workOrder) =>
          workOrder.id === selectedWorkOrder.id
            ? {
                ...workOrder,
                attachments: [...workOrder.attachments, ...uploaded],
                filesCount: workOrder.attachments.length + uploaded.length,
              }
            : workOrder,
        ),
      );
    } catch (error) {
      console.error("attachment load failed", error);
    } finally {
      event.target.value = "";
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setWorkOrders((prev) =>
      prev.map((workOrder) => {
        if (workOrder.id !== selectedWorkOrder.id) return workOrder;
        const nextAttachments = workOrder.attachments.filter(
          (item) => item.id !== attachmentId,
        );
        return {
          ...workOrder,
          attachments: nextAttachments,
          filesCount: nextAttachments.length,
        };
      }),
    );
    if (attachmentPreviewId === attachmentId) {
      setAttachmentPreviewId(null);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef}>
        <MobileTopBar version={version} onOpen={() => setDrawerOpen(true)} />

        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          workOrders={workOrders}
          selectedId={selectedId}
          workflowStateById={workflowStateById}
          onSelect={handleSelectWorkOrder}
          onCreate={handleCreateWorkOrder}
        />

        <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-12">
          <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
            <SidebarContent
              version={version}
              workOrders={workOrders}
              selectedId={selectedId}
              workflowStateById={workflowStateById}
              onSelect={handleSelectWorkOrder}
              onCreate={handleCreateWorkOrder}
            />
          </aside>

          <section className="min-w-0 p-4 md:col-span-6 md:overflow-y-auto md:p-6">
            <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-cyan-900">
                    모바일 체크포인트
                  </div>
                  <div className="mt-1 text-xs text-cyan-800">
                    모바일 체크포인트 기준: 버전/드로어/카드 정보량/모달 동작 확인
                  </div>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-cyan-800">
                  state
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-cyan-900">
                <div>1. 상단 버전이 v0.0.30으로 표시되는지</div>
                <div>2. 메뉴에서 작업 선택 시 드로어가 닫히는지</div>
                <div>3. 우측 진행단계 카드가 상태/액션 구조로 바뀌었는지</div>
                <div>
                  4. 권한/사용자 변경 시 액션 버튼과 재고 수정 가능 여부가
                  달라지는지
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
                <div>
                  <h2 className="mt-1 break-keep text-2xl font-semibold">
                    {selectedWorkOrder.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStageTone(currentWorkflowState)}`}
                    >
                      상태: {currentWorkflowState}
                    </div>
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        saveStatus === "saving"
                          ? "bg-cyan-100 text-cyan-800"
                          : saveStatus === "dirty"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {saveStatus === "saving"
                        ? "저장 중"
                        : saveStatus === "dirty"
                          ? "저장되지 않음"
                          : "저장됨"}
                    </div>
                    {lastSavedAt && (
                      <div className="text-xs text-stone-500">
                        마지막 저장: {lastSavedAt}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <button className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm sm:flex-none">
                    복제
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    className="flex-1 rounded-xl bg-stone-900 px-4 py-2 text-sm text-white sm:flex-none"
                  >
                    즉시 저장
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-6">
                <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
                  <h3 className="text-base font-semibold">기본 분류</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <Info label="대분류" value={selectedWorkOrder.category1} />
                    <Info label="중분류" value={selectedWorkOrder.category2} />
                    <Info label="소분류" value={selectedWorkOrder.category3} />
                    <Info label="시즌" value={selectedWorkOrder.season} />
                    <Info label="우선순위" value={selectedWorkOrder.priority} />
                    <Info label="공장" value={selectedWorkOrder.vendor} />
                    <Info label="담당자" value={selectedWorkOrder.manager} />
                    <Info label="납기일" value={selectedWorkOrder.dueDate} />
                    <Info
                      label="발주 수량"
                      value={`${selectedWorkOrder.quantity}장`}
                      valueClassName="text-base font-semibold tabular-nums"
                    />
                    <Info
                      label="재고 수량"
                      value={`${currentInventoryQuantity}장`}
                      valueClassName="text-base font-semibold tabular-nums"
                    />
                  </div>
                  {canEditInventory && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">
                          재고 수정
                        </div>
                        <div className="mt-1 text-xs text-stone-500">
                          수정자: {currentUser.name} · {getPermissionSummary(currentUser)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInventoryEditorOpen(true)}
                        disabled={!currentUser.permissions.inventoryEdit}
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${
                          currentUser.permissions.inventoryEdit
                            ? "bg-stone-900 text-white"
                            : "cursor-not-allowed border border-stone-300 bg-stone-100 text-stone-400"
                        }`}
                      >
                        재고 수정
                      </button>
                    </div>
                  )}
                </div>

                {canSeeProductionSections && (
                  <AccordionSection
                    title="원단 / 부자재 구성"
                    buttonLabel="항목 추가"
                    mobileOpen={materialOpen}
                    onToggle={() => setMaterialOpen((prev) => !prev)}
                    summaryText={`총 ${materialSummary.count}개 / ${materialSummary.total.toLocaleString()}원`}
                    mobileItems={materials.map((item) => ({
                      key: `${item.name}-${item.vendor}`,
                      title: `${item.type} · ${item.name}`,
                      rows: [
                        ["거래처", item.vendor],
                        ["수량", `${item.quantity}${item.unit}`],
                        ["단가", `${item.unitCost.toLocaleString()}원`],
                        ["금액", `${item.totalCost.toLocaleString()}원`],
                        ["상태", item.status],
                      ],
                    }))}
                    desktopHeaders={[
                      "구분",
                      "자재명",
                      "거래처",
                      "수량",
                      "단가",
                      "금액",
                      "상태",
                    ]}
                    desktopRows={materials.map((item) => [
                      item.type,
                      item.name,
                      item.vendor,
                      `${item.quantity}${item.unit}`,
                      `${item.unitCost.toLocaleString()}원`,
                      `${item.totalCost.toLocaleString()}원`,
                      item.status,
                    ])}
                  />
                )}

                {canSeeProductionSections && (
                  <AccordionSection
                    title="외주 공정"
                    buttonLabel="공정 추가"
                    mobileOpen={outsourcingOpen}
                    onToggle={() => setOutsourcingOpen((prev) => !prev)}
                    summaryText={`총 ${outsourcingSummary.count}개 / ${outsourcingSummary.total.toLocaleString()}원`}
                    mobileItems={outsourcing.map((item) => ({
                      key: `${item.process}-${item.vendor}`,
                      title: item.process,
                      rows: [
                        ["외주처", item.vendor],
                        ["수량", String(item.quantity)],
                        ["단가기준", item.unitType],
                        ["단가", `${item.unitCost.toLocaleString()}원`],
                        ["금액", `${item.totalCost.toLocaleString()}원`],
                        ["상태", item.status],
                      ],
                    }))}
                    desktopHeaders={[
                      "공정",
                      "외주처",
                      "수량",
                      "단가기준",
                      "단가",
                      "금액",
                      "상태",
                    ]}
                    desktopRows={outsourcing.map((item) => [
                      item.process,
                      item.vendor,
                      String(item.quantity),
                      item.unitType,
                      `${item.unitCost.toLocaleString()}원`,
                      `${item.totalCost.toLocaleString()}원`,
                      item.status,
                    ])}
                  />
                )}

                <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
                  <h3 className="text-base font-semibold">작업 메모</h3>
                  <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
                    {selectedWorkOrder.memo}
                  </div>
                </div>

                {canSeeAttachments && (
                <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">첨부파일</h3>
                      <div className="mt-1 text-xs text-stone-500">
                        이미지와 PDF를 작업지시서에 함께 보관합니다.
                      </div>
                    </div>
                    {canSeeAttachments && (
                    <button
                      type="button"
                      onClick={handleOpenAttachmentPicker}
                      className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800"
                    >
                      + 추가
                    </button>
                    )}
                  </div>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleAttachmentFiles}
                  />
                  {selectedWorkOrder.attachments.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                      {selectedWorkOrder.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => setAttachmentPreviewId(attachment.id)}
                            className="block w-full text-left"
                          >
                            <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                              {attachment.type === "image" ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-rose-50 text-sm font-semibold text-rose-700">
                                  PDF 미리보기
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <div className="truncate text-sm font-medium text-stone-900">
                                {attachment.name}
                              </div>
                              <div className="mt-1 text-xs text-stone-500">
                                {attachment.type === "image" ? "이미지" : "PDF"}
                              </div>
                              <div className="mt-1 text-[11px] text-stone-400">
                                업로드: {attachment.ownerName ?? "기존 첨부"}
                              </div>
                            </div>
                          </button>
                          {canDeleteAttachment(attachment) && (
                            <div className="border-t border-stone-200 p-3">
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
                      아직 첨부파일이 없습니다.
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </section>

          <aside className="min-w-0 border-t border-stone-200 bg-stone-50 p-4 md:col-span-3 md:border-t-0 md:border-l md:p-6">
            <div className="space-y-6">
              <WorkflowPanel
                currentUser={currentUser}
                users={users}
                onCurrentUserChange={setCurrentUserId}
                onOpenPermissions={() => setPermissionModalOpen(true)}
                currentState={currentWorkflowState}
                currentDisplayStage={currentDisplayStage}
                visibleStages={visibleStages}
                actions={availableActions}
                onAction={handleWorkflowAction}
              />

              {canSeeCostSections && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold">비용 요약</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <SummaryRow
                      label="원단 합계"
                      value={`${fabricTotal.toLocaleString()}원`}
                    />
                    <SummaryRow
                      label="부자재 합계"
                      value={`${subsidiaryTotal.toLocaleString()}원`}
                    />
                    <SummaryRow
                      label="외주 합계"
                      value={`${outsourcingTotal.toLocaleString()}원`}
                    />
                    <div className="border-t border-stone-200 pt-3">
                      <SummaryRow
                        label="총합"
                        value={`${totalCost.toLocaleString()}원`}
                        strong
                      />
                      <SummaryRow
                        label="장당 추정 원가"
                        value={`${unitCost.toLocaleString()}원`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {canSeeCostSections && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold">공정별 금액</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    {outsourcing.map((item) => (
                      <SummaryRow
                        key={item.process}
                        label={item.process}
                        value={`${item.totalCost.toLocaleString()}원`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {canSeeInventoryHistorySection && (
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">최근 히스토리</h3>
                    <div className="mt-1 text-xs text-stone-500">
                      {isAdmin
                        ? "전체 / 작업 / 재고 필터로 히스토리를 확인할 수 있습니다."
                        : currentRole === "디자이너"
                          ? "작업 관련 히스토리만 표시됩니다."
                          : "재고 관련 히스토리만 표시됩니다."}
                    </div>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">
                    {filteredHistoryLogs.length}건
                  </span>
                </div>
                {isAdmin && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        ["all", "전체"],
                        ["work", "작업"],
                        ["inventory", "재고"],
                      ] as [HistoryFilter, string][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setHistoryFilter(value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          historyFilter === value
                            ? "bg-stone-900 text-white"
                            : "border border-stone-300 bg-white text-stone-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  {filteredHistoryLogs.length > 0 ? (
                    filteredHistoryLogs.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getHistoryToneClass(item.tone)}`}
                          >
                            {item.action}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {item.time}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-stone-500">
                          {item.user}
                        </div>
                        <div className="mt-1 text-sm text-stone-700">
                          {item.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
                      표시할 히스토리가 없습니다.
                    </div>
                  )}
                </div>
                {filteredHistoryLogs.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setInventoryLogModalOpen(true)}
                    className="mt-4 w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800"
                  >
                    전체 히스토리 보기
                  </button>
                )}
              </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <AttachmentPreviewModal
        attachment={selectedAttachment}
        canDelete={canDeleteAttachment(selectedAttachment)}
        onClose={() => setAttachmentPreviewId(null)}
        onDelete={() => selectedAttachment && handleDeleteAttachment(selectedAttachment.id)}
      />

      <InventoryLogModal
        open={inventoryLogModalOpen}
        onClose={() => setInventoryLogModalOpen(false)}
        logs={filteredHistoryLogs}
        role={currentRole}
        filter={historyFilter}
      />

      <InventoryEditor
        open={inventoryEditorOpen}
        onClose={() => setInventoryEditorOpen(false)}
        currentStock={currentInventoryQuantity}
        currentUserName={currentUser.name}
        logs={inventoryLogs}
        onApply={handleInventoryApply}
      />

      <PermissionModal
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        users={users}
        currentUserId={currentUserId}
        selectedUserId={permissionTargetUserId}
        onSelectedUserChange={setPermissionTargetUserId}
        onApplyRole={handleApplyRole}
      />
    </main>
  );
}


function WorkflowPanel({
  currentUser,
  users,
  onCurrentUserChange,
  onOpenPermissions,
  currentState,
  currentDisplayStage,
  visibleStages,
  actions,
  onAction,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  onCurrentUserChange: (userId: string) => void;
  onOpenPermissions: () => void;
  currentState: WorkflowState;
  currentDisplayStage: DisplayStage;
  visibleStages: DisplayStage[];
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
}) {
  const currentIndex = visibleStages.indexOf(currentDisplayStage);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">진행 단계</h3>
          <p className="mt-1 text-xs text-stone-500">상태와 가능한 행동을 함께 표시</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStageTone(currentState)}`}>
          {currentState}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium text-stone-500">현재 사용자</div>
          <button
            type="button"
            onClick={onOpenPermissions}
            className="rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] text-stone-700"
          >
            권한 설정
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
          {users.map((user) => {
            const active = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onCurrentUserChange(user.id)}
                className={`rounded-xl px-3 py-3 text-left ${active ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}
              >
                <div className="text-xs font-semibold">{user.name}</div>
                <div className={`mt-1 text-[11px] ${active ? "text-stone-300" : "text-stone-500"}`}>
                  {getPermissionSummary(user)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="text-xs font-medium text-stone-500">현재 상태 설명</div>
        <div className="mt-2 text-sm leading-6 text-stone-800">
          {getDisplayStageDescription(currentDisplayStage)}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {visibleStages.map((stage, index) => {
          const isCurrent = stage === currentDisplayStage;
          const isDone = currentIndex >= 0 && index < currentIndex;
          const isUpcoming = !isCurrent && !isDone;
          return (
            <div key={stage} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isCurrent
                    ? "bg-stone-900 text-white"
                    : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${isCurrent ? "font-semibold text-stone-900" : isUpcoming ? "text-stone-500" : "text-stone-700"}`}>
                  {stage}
                </div>
                {isCurrent && <div className="mt-1 text-xs text-stone-500">현재 단계</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-stone-900">가능한 액션</div>
          <span className="text-xs text-stone-500">권한 기준</span>
        </div>
        {actions.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            {actions.map((action) => (
              <button
                key={`${currentState}-${action.id}`}
                type="button"
                onClick={() => onAction(action)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
            현재 사용자 권한에서는 실행 가능한 액션이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  buttonLabel,
  mobileOpen,
  onToggle,
  summaryText,
  mobileItems,
  desktopHeaders,
  desktopRows,
}: {
  title: string;
  buttonLabel: string;
  mobileOpen: boolean;
  onToggle: () => void;
  summaryText: string;
  mobileItems: { key: string; title: string; rows: [string, string][] }[];
  desktopHeaders: string[];
  desktopRows: string[][];
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">
          {buttonLabel}
        </button>
      </div>

      <div className="mt-4 md:hidden">
        <button
          type="button"
          onClick={onToggle}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{title}</div>
              <div className="mt-1 text-xs text-stone-500">{summaryText}</div>
            </div>
            <span className="shrink-0 text-lg text-stone-500">{mobileOpen ? "−" : "+"}</span>
          </div>
        </button>

        {mobileOpen && (
          <div className="mt-3 space-y-3">
            {mobileItems.map((item) => (
              <MobileDataCard key={item.key} title={item.title} rows={item.rows} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-stone-500">
            <tr className="border-b border-stone-200">
              {desktopHeaders.map((header) => (
                <th key={header} className="px-2 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {desktopRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-stone-100">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className={`px-2 py-3 ${cellIndex === row.length - 2 ? "font-medium" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileDataCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="text-sm font-semibold text-stone-900">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={`${title}-${label}`} className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-xs text-stone-500">{label}</span>
            <span className="text-right text-sm font-medium text-stone-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-3">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 font-medium ${valueClassName ?? "text-sm"}`}>{value}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={strong ? "font-semibold text-stone-900" : "font-medium"}>{value}</span>
    </div>
  );
}
