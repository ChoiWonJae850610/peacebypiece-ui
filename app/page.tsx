"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import InventoryEditor from "@/components/common/InventoryEditor";
import PermissionModal from "@/components/common/PermissionModal";

type Material = {
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

type Outsourcing = {
  process: string;
  vendor: string;
  quantity: number;
  unitType: string;
  unitCost: number;
  totalCost: number;
  status: string;
};

type WorkflowState =
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

type PermissionKey =
  | "createWorkorder"
  | "reviewRequest"
  | "reviewApprove"
  | "orderRequest"
  | "orderConfirm"
  | "inbound"
  | "inspection"
  | "inventoryEdit"
  | "permissionManage";

type PermissionSet = Record<PermissionKey, boolean>;

type UserProfile = {
  id: string;
  name: string;
  team: string;
  permissions: PermissionSet;
};

type ActionId =
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

type WorkflowAction = {
  id: ActionId;
  label: string;
  nextState: WorkflowState;
  permission: PermissionKey;
};

type InventoryLog = {
  id: string;
  workOrderId: string;
  type: "입고" | "차감" | "보정";
  delta: number;
  memo: string;
  user: string;
  time: string;
};

type WorkOrder = {
  id: string;
  productName: string;
  internalCode: string;
  category: string;
  stage: WorkflowState;
  vendor: string;
  dueDate: string;
  inventoryStatus: string;
  filesCount: number;
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

const STAGE_ORDER: WorkflowState[] = [
  "작성중",
  "검토대기",
  "검토완료",
  "발주요청",
  "발주완료",
  "생산중",
  "입고대기",
  "검수중",
  "부분완료",
  "완료",
  "반려",
  "종결",
];

const PRIMARY_FLOW: WorkflowState[] = [
  "작성중",
  "검토대기",
  "검토완료",
  "발주요청",
  "발주완료",
  "생산중",
  "입고대기",
  "검수중",
  "부분완료",
  "완료",
  "종결",
];

const ACTIONS_BY_STATE: Partial<Record<WorkflowState, WorkflowAction[]>> = {
  작성중: [
    { id: "saveDraft", label: "임시저장", nextState: "작성중", permission: "createWorkorder" },
    { id: "requestReview", label: "검토요청", nextState: "검토대기", permission: "reviewRequest" },
  ],
  검토대기: [
    { id: "approveReview", label: "검토승인", nextState: "검토완료", permission: "reviewApprove" },
    { id: "rejectReview", label: "검토반려", nextState: "반려", permission: "reviewApprove" },
  ],
  검토완료: [
    { id: "requestOrder", label: "발주요청", nextState: "발주요청", permission: "orderRequest" },
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
  발주요청: [
    { id: "confirmOrder", label: "발주확정", nextState: "발주완료", permission: "orderConfirm" },
    { id: "rejectReview", label: "반려", nextState: "반려", permission: "reviewApprove" },
  ],
  발주완료: [
    { id: "startProduction", label: "생산시작", nextState: "생산중", permission: "inbound" },
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
  생산중: [
    { id: "registerInbound", label: "입고등록", nextState: "입고대기", permission: "inbound" },
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
  입고대기: [
    { id: "startInspection", label: "검수시작", nextState: "검수중", permission: "inspection" },
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
  검수중: [
    { id: "completeInspection", label: "검수완료", nextState: "완료", permission: "inspection" },
    { id: "markPartial", label: "부분완료", nextState: "부분완료", permission: "inspection" },
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
  부분완료: [
    { id: "registerInbound", label: "추가입고 등록", nextState: "입고대기", permission: "inbound" },
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
  완료: [
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
  반려: [
    { id: "saveDraft", label: "수정 후 저장", nextState: "작성중", permission: "createWorkorder" },
    { id: "requestReview", label: "재검토요청", nextState: "검토대기", permission: "createWorkorder" },
    { id: "closeOrder", label: "종결처리", nextState: "종결", permission: "reviewApprove" },
  ],
};

function getStageTone(state: WorkflowState) {
  switch (state) {
    case "완료":
      return "bg-emerald-100 text-emerald-800";
    case "부분완료":
      return "bg-amber-100 text-amber-800";
    case "반려":
      return "bg-rose-100 text-rose-800";
    case "종결":
      return "bg-stone-200 text-stone-700";
    default:
      return "bg-cyan-100 text-cyan-800";
  }
}

function getStageDescription(state: WorkflowState) {
  switch (state) {
    case "작성중":
      return "디자이너가 작업지시서를 작성 중입니다.";
    case "검토대기":
      return "관리자 검토가 필요한 상태입니다.";
    case "검토완료":
      return "검토가 끝나 발주 요청이 가능합니다.";
    case "발주요청":
      return "발주 확정 대기 상태입니다.";
    case "발주완료":
      return "발주 확정 완료, 생산 시작 전 단계입니다.";
    case "생산중":
      return "공장 또는 외주처에서 생산 진행 중입니다.";
    case "입고대기":
      return "생산 이후 입고 및 검수 준비 단계입니다.";
    case "검수중":
      return "입고 물량 검수 중이며 재고 반영 전입니다.";
    case "부분완료":
      return "일부 수량만 정상 처리된 상태입니다.";
    case "완료":
      return "검수 완료 및 정상 수량 반영까지 끝났습니다.";
    case "반려":
      return "내용 수정 후 다시 검토 요청이 필요합니다.";
    case "종결":
      return "더 이상 진행하지 않는 종료 상태입니다.";
  }
}

function getVisibleStageList(currentState: WorkflowState) {
  if (currentState === "반려") {
    return ["작성중", "검토대기", "반려"] as WorkflowState[];
  }
  return PRIMARY_FLOW;
}

const DEFAULT_PERMISSIONS: PermissionSet = {
  createWorkorder: false,
  reviewRequest: false,
  reviewApprove: false,
  orderRequest: false,
  orderConfirm: false,
  inbound: false,
  inspection: false,
  inventoryEdit: false,
  permissionManage: false,
};

const INITIAL_USERS: UserProfile[] = [
  {
    id: "user-designer",
    name: "김디자이너",
    team: "디자인팀",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      createWorkorder: true,
      reviewRequest: true,
      orderRequest: true,
      inbound: true,
      inspection: true,
    },
  },
  {
    id: "user-admin",
    name: "박관리",
    team: "관리자",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      createWorkorder: true,
      reviewRequest: true,
      reviewApprove: true,
      orderRequest: true,
      orderConfirm: true,
      inbound: true,
      inspection: true,
      inventoryEdit: true,
      permissionManage: true,
    },
  },
  {
    id: "user-inspection",
    name: "이검수",
    team: "입고/검수",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      inbound: true,
      inspection: true,
      inventoryEdit: true,
    },
  },
];

function getCurrentTimeLabel() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getPermissionSummary(user: UserProfile) {
  if (user.permissions.permissionManage) return "관리자";
  if (user.permissions.inventoryEdit && user.permissions.inspection) return "입고/검수";
  return "디자이너";
}

export default function Home() {
  const version = "0.0.15";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [outsourcingOpen, setOutsourcingOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("WO-2026-0014");
  const [inventoryEditorOpen, setInventoryEditorOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState("user-admin");
  const [permissionTargetUserId, setPermissionTargetUserId] = useState("user-designer");
  const appShellRef = useRef<HTMLDivElement | null>(null);

  const blockingOverlayOpen = drawerOpen || inventoryEditorOpen || permissionModalOpen;

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (blockingOverlayOpen) {
      const scrollY = window.scrollY;
      body.dataset.scrollY = String(scrollY);
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
      html.style.overflow = "hidden";
      html.style.touchAction = "none";
    } else {
      const saved = body.dataset.scrollY || "0";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      html.style.overflow = "";
      html.style.touchAction = "";
      window.scrollTo(0, Number(saved));
      delete body.dataset.scrollY;
    }

    return () => {
      const saved = body.dataset.scrollY || "0";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      html.style.overflow = "";
      html.style.touchAction = "";
      if (blockingOverlayOpen) {
        window.scrollTo(0, Number(saved));
      }
      delete body.dataset.scrollY;
    };
  }, [blockingOverlayOpen]);

  useEffect(() => {
    const appShell = appShellRef.current;
    if (!appShell) return;

    if (inventoryEditorOpen || permissionModalOpen) {
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
  }, [inventoryEditorOpen, permissionModalOpen]);

  const workOrders: WorkOrder[] = [
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
        { time: "09:18", user: "김담당", action: "검토 완료 후 발주 요청 상태로 변경" },
        { time: "09:23", user: "staff1", action: "샘플사진 2장 업로드" },
        { time: "09:40", user: "Kty", action: "외주공정 나염 추가" },
      ],
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
        { type: "원단", name: "합성피혁", vendor: "가방원단", quantity: 10, unit: "yd", unitCost: 6800, totalCost: 68000, status: "입고완료" },
        { type: "부자재", name: "체인 스트랩", vendor: "금속부자재", quantity: 15, unit: "개", unitCost: 2200, totalCost: 33000, status: "입고완료" },
      ],
      outsourcing: [
        { process: "재단", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 2000, totalCost: 30000, status: "완료" },
        { process: "봉제", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 7500, totalCost: 112500, status: "완료" },
      ],
    },
  ];

  const [workflowStateById, setWorkflowStateById] = useState<Record<string, WorkflowState>>(() =>
    Object.fromEntries(workOrders.map((item) => [item.id, item.status])),
  );
  const [inventoryQuantityById, setInventoryQuantityById] = useState<Record<string, number>>(() =>
    Object.fromEntries(workOrders.map((item) => [item.id, item.inventoryQuantity])),
  );
  const [inventoryLogsById, setInventoryLogsById] = useState<Record<string, InventoryLog[]>>(() => ({
    "WO-2026-0014": [
      { id: "log-1", workOrderId: "WO-2026-0014", type: "입고", delta: 5, memo: "샘플 1차 입고", user: "박관리", time: "03-22 11:40" },
      { id: "log-2", workOrderId: "WO-2026-0014", type: "차감", delta: -2, memo: "검수 불량 차감", user: "이검수", time: "03-22 16:20" },
    ],
  }));

  const selectedWorkOrder = workOrders.find((item) => item.id === selectedId) ?? workOrders[0];
  const currentWorkflowState = workflowStateById[selectedWorkOrder.id] ?? selectedWorkOrder.status;
  const currentUser = users.find((item) => item.id === currentUserId) ?? users[0];
  const currentInventoryQuantity = inventoryQuantityById[selectedWorkOrder.id] ?? selectedWorkOrder.inventoryQuantity;
  const inventoryLogs = inventoryLogsById[selectedWorkOrder.id] ?? [];

  const materials = selectedWorkOrder.materials;
  const outsourcing = selectedWorkOrder.outsourcing;
  const historyItems = selectedWorkOrder.historyItems;

  const fabricTotal = materials.filter((item) => item.type === "원단").reduce((sum, item) => sum + item.totalCost, 0);
  const subsidiaryTotal = materials.filter((item) => item.type === "부자재").reduce((sum, item) => sum + item.totalCost, 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + item.totalCost, 0);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal;
  const unitCost = Math.round(totalCost / selectedWorkOrder.quantity);

  const materialSummary = useMemo(() => {
    return { count: materials.length, total: materials.reduce((sum, item) => sum + item.totalCost, 0) };
  }, [materials]);

  const outsourcingSummary = useMemo(() => {
    return { count: outsourcing.length, total: outsourcing.reduce((sum, item) => sum + item.totalCost, 0) };
  }, [outsourcing]);

  const availableActions = (ACTIONS_BY_STATE[currentWorkflowState] ?? []).filter((action) => currentUser.permissions[action.permission]);
  const visibleStages = getVisibleStageList(currentWorkflowState);

  const handleSelectWorkOrder = (id: string, closeDrawer = false) => {
    setSelectedId(id);
    setMaterialOpen(false);
    setOutsourcingOpen(false);
    if (closeDrawer) setDrawerOpen(false);
  };

  const handleWorkflowAction = (action: WorkflowAction) => {
    setWorkflowStateById((prev) => ({ ...prev, [selectedWorkOrder.id]: action.nextState }));
  };

  const handleInventoryApply = ({ type, quantity, memo }: { type: "입고" | "차감" | "보정"; quantity: number; memo: string }) => {
    setInventoryQuantityById((prev) => {
      const current = prev[selectedWorkOrder.id] ?? selectedWorkOrder.inventoryQuantity;
      const nextValue = type === "입고" ? current + quantity : type === "차감" ? Math.max(0, current - quantity) : quantity;
      return { ...prev, [selectedWorkOrder.id]: nextValue };
    });

    const delta = type === "입고" ? quantity : type === "차감" ? -quantity : quantity - (inventoryQuantityById[selectedWorkOrder.id] ?? selectedWorkOrder.inventoryQuantity);

    setInventoryLogsById((prev) => ({
      ...prev,
      [selectedWorkOrder.id]: [
        {
          id: `${selectedWorkOrder.id}-${Date.now()}`,
          workOrderId: selectedWorkOrder.id,
          type,
          delta,
          memo,
          user: currentUser.name,
          time: getCurrentTimeLabel(),
        },
        ...(prev[selectedWorkOrder.id] ?? []),
      ],
    }));
  };

  const handleTogglePermission = (userId: string, key: PermissionKey) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, permissions: { ...user.permissions, [key]: !user.permissions[key] } }
          : user,
      ),
    );
  };

  const handleApplyPreset = (userId: string, permissions: PermissionSet) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, permissions: { ...permissions } } : user)));
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
      />

      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-12">
        <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
          <SidebarContent
            version={version}
            workOrders={workOrders}
            selectedId={selectedId}
            workflowStateById={workflowStateById}
            onSelect={handleSelectWorkOrder}
          />
        </aside>

        <section className="min-w-0 p-4 md:col-span-6 md:overflow-y-auto md:p-6">
          <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-cyan-900">모바일 체크포인트</div>
                <div className="mt-1 text-xs text-cyan-800">v{version} 반영 여부를 여기 기준으로 확인</div>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-cyan-800">state</span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-cyan-900">
              <div>1. 상단 버전이 v0.0.15로 표시되는지</div>
              <div>2. 메뉴에서 작업 선택 시 드로어가 닫히는지</div>
              <div>3. 우측 진행단계 카드가 상태/액션 구조로 바뀌었는지</div>
              <div>4. 권한/사용자 변경 시 액션 버튼과 재고 수정 가능 여부가 달라지는지</div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <h2 className="mt-1 break-keep text-2xl font-semibold">{selectedWorkOrder.title}</h2>
                <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStageTone(currentWorkflowState)}`}>
                  상태: {currentWorkflowState}
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <button className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm sm:flex-none">복제</button>
                <button className="flex-1 rounded-xl bg-stone-900 px-4 py-2 text-sm text-white sm:flex-none">저장</button>
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
                  <Info label="발주 수량" value={`${selectedWorkOrder.quantity}장`} valueClassName="text-base font-semibold tabular-nums" />
                  <Info label="재고 수량" value={`${currentInventoryQuantity}장`} valueClassName="text-base font-semibold tabular-nums" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">재고 수정</div>
                    <div className="mt-1 text-xs text-stone-500">수정자: {currentUser.name} · {getPermissionSummary(currentUser)}</div>
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
                <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-stone-900">최근 재고 히스토리</div>
                      <div className="mt-1 text-xs text-stone-500">최근 3건 기준으로 재고 변경 이력을 표시합니다.</div>
                    </div>
                    <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{inventoryLogs.length}건</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {inventoryLogs.length > 0 ? (
                      inventoryLogs.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                              item.type === "입고"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.type === "차감"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}>
                              {item.type} {item.delta > 0 ? `+${item.delta}` : item.delta}
                            </div>
                            <div className="text-[11px] text-stone-500">{item.time}</div>
                          </div>
                          <div className="mt-2 text-xs text-stone-500">{item.user}</div>
                          <div className="mt-1 text-sm text-stone-700">{item.memo || "메모 없음"}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">최근 재고 변경 이력이 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>

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
                desktopHeaders={["구분", "자재명", "거래처", "수량", "단가", "금액", "상태"]}
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
                desktopHeaders={["공정", "외주처", "수량", "단가기준", "단가", "금액", "상태"]}
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

              <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
                <h3 className="text-base font-semibold">작업 메모</h3>
                <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{selectedWorkOrder.memo}</div>
              </div>
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
              visibleStages={visibleStages}
              actions={availableActions}
              onAction={handleWorkflowAction}
            />

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">비용 요약</h3>
              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow label="원단 합계" value={`${fabricTotal.toLocaleString()}원`} />
                <SummaryRow label="부자재 합계" value={`${subsidiaryTotal.toLocaleString()}원`} />
                <SummaryRow label="외주 합계" value={`${outsourcingTotal.toLocaleString()}원`} />
                <div className="border-t border-stone-200 pt-3">
                  <SummaryRow label="총합" value={`${totalCost.toLocaleString()}원`} strong />
                  <SummaryRow label="장당 추정 원가" value={`${unitCost.toLocaleString()}원`} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">공정별 금액</h3>
              <div className="mt-4 space-y-2 text-sm">
                {outsourcing.map((item) => (
                  <SummaryRow key={item.process} label={item.process} value={`${item.totalCost.toLocaleString()}원`} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">최근 히스토리</h3>
              <div className="mt-4 space-y-3">
                {historyItems.map((item) => (
                  <div key={`${item.time}-${item.action}`} className="rounded-xl bg-stone-50 p-3">
                    <div className="text-xs text-stone-500">
                      {item.time} · {item.user}
                    </div>
                    <div className="mt-1 text-sm">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">전체 재고 로그</h3>
              <div className="mt-4 space-y-3">
                {inventoryLogs.length > 0 ? (
                  inventoryLogs.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-xl bg-stone-50 p-3">
                      <div className="text-xs text-stone-500">
                        {item.time} · {item.user}
                      </div>
                      <div className="mt-1 text-sm">{item.type} {item.delta > 0 ? `+${item.delta}` : item.delta} · {item.memo || "메모 없음"}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">재고 변경 로그가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>

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
        onTogglePermission={handleTogglePermission}
        onApplyPreset={handleApplyPreset}
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
  visibleStages,
  actions,
  onAction,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  onCurrentUserChange: (userId: string) => void;
  onOpenPermissions: () => void;
  currentState: WorkflowState;
  visibleStages: WorkflowState[];
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
}) {
  const currentIndex = visibleStages.indexOf(currentState);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">진행 단계</h3>
          <p className="mt-1 text-xs text-stone-500">상태와 가능한 행동을 함께 표시</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStageTone(currentState)}`}>{currentState}</span>
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
                <div className={`mt-1 text-[11px] ${active ? "text-stone-300" : "text-stone-500"}`}>{getPermissionSummary(user)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="text-xs font-medium text-stone-500">현재 상태 설명</div>
        <div className="mt-2 text-sm leading-6 text-stone-800">{getStageDescription(currentState)}</div>
      </div>

      <div className="mt-4 space-y-3">
        {visibleStages.map((stage, index) => {
          const isCurrent = stage === currentState;
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
        <button className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">{buttonLabel}</button>
      </div>

      <div className="mt-4 md:hidden">
        <button type="button" onClick={onToggle} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left">
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
                  <td key={`${rowIndex}-${cellIndex}`} className={`px-2 py-3 ${cellIndex === row.length - 2 ? "font-medium" : ""}`}>
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

function MobileTopBar({ version, onOpen }: { version: string; onOpen: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <button type="button" onClick={onOpen} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800">
        메뉴
      </button>
      <div className="text-sm font-semibold text-stone-900">PeacebyPiece v{version}</div>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  workOrders,
  selectedId,
  workflowStateById,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  workOrders: WorkOrder[];
  selectedId: string;
  workflowStateById: Record<string, WorkflowState>;
  onSelect: (id: string, closeDrawer?: boolean) => void;
}) {
  return (
    <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-40 md:hidden`}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute left-0 top-0 h-full w-[85%] max-w-80 overflow-y-auto bg-white shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <div>
            <div className="text-base font-semibold text-stone-900">작업 리스트</div>
            <div className="mt-1 text-xs text-stone-500">모바일 드로어 메뉴</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">
            닫기
          </button>
        </div>
        <div className="p-4">
          <input className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm outline-none" placeholder="제품명 검색" />
          <div className="mt-3 flex flex-wrap gap-2">
            {["전체", "진행중", "발주요청", "입고대기", "완료"].map((tag) => (
              <button key={tag} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs">
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3 px-4 pb-6">
          {workOrders.map((item) => {
            const selected = item.id === selectedId;
            const state = workflowStateById[item.id] ?? item.status;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id, true)}
                className={`block w-full rounded-2xl border p-4 text-left shadow-sm ${selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-keep text-sm font-semibold">{item.productName}</div>
                    <div className={`mt-1 text-xs ${selected ? "text-stone-300" : "text-stone-500"}`}>{item.internalCode}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${selected ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"}`}>{state}</span>
                </div>
                <div className={`mt-3 space-y-1 text-xs ${selected ? "text-stone-300" : "text-stone-600"}`}>
                  <div className="break-keep">{item.category}</div>
                  <div>마감: {item.dueDate}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  version,
  workOrders,
  selectedId,
  workflowStateById,
  onSelect,
}: {
  version: string;
  workOrders: WorkOrder[];
  selectedId: string;
  workflowStateById: Record<string, WorkflowState>;
  onSelect: (id: string, closeDrawer?: boolean) => void;
}) {
  return (
    <>
      <div className="border-b border-stone-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">PeacebyPiece</h1>
            <p className="mt-1 text-sm text-stone-500">작업지시 워크스테이션</p>
          </div>
          <span className="shrink-0 rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">v{version}</span>
        </div>
      </div>
      <div className="p-4">
        <input className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm outline-none" placeholder="제품명 검색" />
        <div className="mt-3 flex flex-wrap gap-2">
          {["전체", "진행중", "발주요청", "입고대기", "완료"].map((tag) => (
            <button key={tag} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs">
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 px-4 pb-4">
        {workOrders.map((item) => {
          const selected = item.id === selectedId;
          const state = workflowStateById[item.id] ?? item.status;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`block w-full rounded-2xl border p-4 text-left shadow-sm ${selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-keep text-sm font-semibold">{item.productName}</div>
                  <div className={`mt-1 text-xs ${selected ? "text-stone-300" : "text-stone-500"}`}>{item.internalCode}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${selected ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"}`}>{state}</span>
              </div>
              <div className={`mt-3 space-y-1 text-xs ${selected ? "text-stone-300" : "text-stone-600"}`}>
                <div className="break-keep">{item.category}</div>
                <div>거래처/공장: {item.vendor}</div>
                <div>마감: {item.dueDate}</div>
                <div>재고: {item.inventoryStatus}</div>
                <div>첨부파일: {item.filesCount}개</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function MobileDataCard({ title, rows }: { title: string; rows: [string, string][] }) {
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

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={strong ? "font-semibold text-stone-900" : "font-medium"}>{value}</span>
    </div>
  );
}
