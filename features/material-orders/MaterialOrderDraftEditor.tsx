"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import ToastMessage from "@/components/common/ToastMessage";
import WorkflowValidationModal from "@/components/common/modal/WorkflowValidationModal";
import {
  AppResponsiveWorkspace,
  WaflEmptyCard,
  WaflMobileContentSection,
  WaflMobileFloatingActionButton,
  WaflMobileListDrawer,
  WaflMobileShell,
  WaflMobileTabbedActionSheet,
  WaflThreePanelWorkspace,
  WaflTwoPanelWorkspace,
  type AppSegmentedTabItem,
} from "@/components/common/ui";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import MaterialOrderLineAddDrawer from "@/features/material-orders/components/MaterialOrderLineAddDrawer";
import MaterialOrderLineAddModal from "@/features/material-orders/components/MaterialOrderLineAddModal";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";
import { APP_VERSION } from "@/lib/constants/version";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

const MATERIAL_ORDER_WORKSPACE_STACK_CLASS =
  "flex h-full min-h-0 flex-col gap-3 sm:gap-4 md:gap-5";

type MaterialOrderMobileToolKey = "workorders" | "schedule";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m20.2 20.2-4.4-4.4" />
      <circle cx="10.8" cy="10.8" r="6.1" />
    </svg>
  );
}

export default function MaterialOrderDraftEditor({
  companyName,
  canRequestMaterialOrder,
  canPlaceMaterialOrder,
}: {
  companyName: string;
  canRequestMaterialOrder: boolean;
  canPlaceMaterialOrder: boolean;
}) {
  const {
    deviceType,
    useDrawerNavigation,
    useStackedProgress,
    useTabletTwoPanel,
    useThreePanel,
  } = useWorkspaceLayoutMode();
  const [mobileOrderListDrawerOpen, setMobileOrderListDrawerOpen] =
    useState(false);
  const [mobileToolSheetOpen, setMobileToolSheetOpen] = useState(false);
  const [mobileActiveTool, setMobileActiveTool] =
    useState<MaterialOrderMobileToolKey>("workorders");
  const [pageFocusTestValue, setPageFocusTestValue] = useState("");
  const [fixedPanelOpen, setFixedPanelOpen] = useState(false);
  const [inlinePanelOpen, setInlinePanelOpen] = useState(false);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);

  const {
    orders,
    selectedOrderId,
    selectedOrder,
    ordersLoading,
    ordersError,
    creatingOrder,
    statusChanging,
    statusToastMessage,
    statusToastTone,
    statusToastEventKey,
    workOrderCandidates,
    suppliers,
    suppliersLoading,
    suppliersError,
    workOrdersLoading,
    workOrdersError,
    materialType,
    supplierPartnerId,
    lines,
    dueDate,
    totals,
    selectedDraftSupplierName,
    materialRequestQuantityMap,
    materialRequestCompletionMap,
    materialOrderLineAddModal,
    materialOrderLineAddDrawer,
    materialOrderValidationModal,
    setSelectedOrderId,
    setSupplierPartnerId,
    setDueDate,
    refreshOrders,
    refreshWorkOrderCandidates,
    refreshSuppliers,
    createOrder,
    cancelOrder,
    changeMaterialType,
    changeSelectedOrderStatus,
    updateLine,
    addWorkOrderMaterialLine,
    removeLine,
  } = useMaterialOrderDraftEditor();

  useEffect(() => {
    if (!selectedOrderId) {
      setMobileOrderListDrawerOpen(false);
      setMobileToolSheetOpen(false);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    if (materialOrderLineAddModal.open || materialOrderLineAddDrawer.open) {
      setMobileToolSheetOpen(false);
    }
  }, [materialOrderLineAddDrawer.open, materialOrderLineAddModal.open]);


  useEffect(() => {
    const shouldLockWorkspaceScroll =
      materialOrderLineAddModal.open ||
      materialOrderLineAddDrawer.open ||
      fixedPanelOpen ||
      cleanModalOpen;

    if (!shouldLockWorkspaceScroll || typeof document === "undefined") {
      return;
    }

    const workspaceRoot = document.querySelector<HTMLElement>(
      '[data-material-order-workspace-root="true"]',
    );

    if (!workspaceRoot) {
      return;
    }

    const candidates = [
      workspaceRoot,
      ...Array.from(workspaceRoot.querySelectorAll<HTMLElement>("*")),
    ];

    const scrollContainers = candidates.filter((element) => {
      const style = window.getComputedStyle(element);
      const canScrollY =
        /(auto|scroll|overlay)/.test(style.overflowY) &&
        element.scrollHeight > element.clientHeight;
      const canScrollX =
        /(auto|scroll|overlay)/.test(style.overflowX) &&
        element.scrollWidth > element.clientWidth;

      return canScrollY || canScrollX;
    });

    const snapshots = scrollContainers.map((element) => ({
      element,
      overflow: element.style.overflow,
      overflowX: element.style.overflowX,
      overflowY: element.style.overflowY,
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
    }));

    for (const snapshot of snapshots) {
      snapshot.element.style.overflow = "hidden";
      snapshot.element.scrollLeft = snapshot.scrollLeft;
      snapshot.element.scrollTop = snapshot.scrollTop;
    }

    return () => {
      for (const snapshot of snapshots) {
        snapshot.element.style.overflow = snapshot.overflow;
        snapshot.element.style.overflowX = snapshot.overflowX;
        snapshot.element.style.overflowY = snapshot.overflowY;
        snapshot.element.scrollLeft = snapshot.scrollLeft;
        snapshot.element.scrollTop = snapshot.scrollTop;
      }
    };
  }, [
    cleanModalOpen,
    fixedPanelOpen,
    materialOrderLineAddDrawer.open,
    materialOrderLineAddModal.open,
  ]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId((currentOrderId) =>
      currentOrderId === orderId ? "" : orderId,
    );
    setMobileOrderListDrawerOpen(false);
  };

  type AddMaterialArgs = [
    Parameters<typeof addWorkOrderMaterialLine>[0],
    Parameters<typeof addWorkOrderMaterialLine>[1],
  ];

  const openMaterialLineEditor = (
    presentation: "modal" | "drawer",
    ...args: AddMaterialArgs
  ) => {
    const openEditor = () => addWorkOrderMaterialLine(...args, presentation);

    if (!mobileToolSheetOpen) {
      openEditor();
      return;
    }

    setMobileToolSheetOpen(false);
    window.requestAnimationFrame(openEditor);
  };

  const handleAddMaterialToOrder = (...args: AddMaterialArgs) =>
    openMaterialLineEditor("modal", ...args);

  const handleAddMaterialToOrderDrawer = (...args: AddMaterialArgs) =>
    openMaterialLineEditor("drawer", ...args);

  const focusEnvironmentDiagnostic = (
    <div className="relative isolate grid gap-3">
      <section
        aria-label="A 페이지 입력 테스트"
        className="grid gap-2 rounded-md border-2 border-dashed border-sky-500 bg-sky-50 p-3 text-slate-950 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        data-focus-environment-test="page"
      >
        <div className="grid gap-1">
          <label htmlFor="material-order-page-focus-test" className="text-xs font-bold">
            A. 페이지 본문 일반 input
          </label>
          <input
            id="material-order-page-focus-test"
            inputMode="numeric"
            value={pageFocusTestValue}
            onChange={(event) => setPageFocusTestValue(event.target.value)}
            aria-label="A 페이지 본문 일반 입력 테스트"
            style={{
              display: "block",
              width: "100%",
              minHeight: 40,
              border: "1px solid #0f172a",
              borderRadius: 4,
              background: "#ffffff",
              color: "#0f172a",
              padding: "8px 10px",
              fontSize: 16,
            }}
          />
          <p className="text-[11px] leading-4">모달·드로어·portal·fixed를 사용하지 않는 페이지 입력입니다.</p>
        </div>
        <div className="grid gap-2 sm:justify-items-end">
          <button
            type="button"
            className="min-h-10 rounded-md border border-slate-900 bg-white px-3 text-xs font-bold text-slate-950"
            onClick={() => setFixedPanelOpen(true)}
          >
            B 고정 패널 열기
          </button>
          <button
            type="button"
            className="min-h-10 rounded-md border border-emerald-700 bg-emerald-50 px-3 text-xs font-bold text-emerald-950"
            onClick={() => setInlinePanelOpen((current) => !current)}
          >
            {inlinePanelOpen ? "D 레이아웃 패널 닫기" : "D 레이아웃 패널 열기"}
          </button>
          <button
            type="button"
            className="min-h-10 rounded-md border border-amber-700 bg-amber-50 px-3 text-xs font-bold text-amber-950"
            onClick={() => setCleanModalOpen(true)}
          >
            E2 새 최소 모달 열기
          </button>
          <p className="max-w-[280px] text-[11px] leading-4 text-slate-700 sm:text-right">
            C는 우측 발주 대상 카드의 <strong>[C 드로어]</strong> 버튼으로 엽니다.
          </p>
        </div>
      </section>

      {inlinePanelOpen ? (
        <section
          aria-label="D 레이아웃 내부 패널 테스트"
          className="grid gap-4 rounded-md border-4 border-emerald-600 bg-emerald-50 p-4 text-slate-950"
          data-focus-environment-test="layout-inline"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">D. 레이아웃 내부 패널 테스트</p>
              <p className="mt-1 text-[11px] leading-4">
                fixed, portal, AppSheet를 사용하지 않고 발주서 레이아웃 흐름 안에 직접 렌더링됩니다.
              </p>
            </div>
            <button
              type="button"
              className="min-h-9 shrink-0 rounded-md border border-emerald-800 bg-white px-3 text-xs font-bold text-emerald-950"
              onClick={() => setInlinePanelOpen(false)}
            >
              닫기
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold">
              D-1 기본 HTML 비제어형
              <input
                inputMode="numeric"
                defaultValue=""
                aria-label="D-1 레이아웃 내부 기본 입력"
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: 44,
                  border: "1px solid #065f46",
                  borderRadius: 4,
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "8px 10px",
                  fontSize: 16,
                }}
              />
            </label>

            <label className="grid gap-1 text-xs font-bold">
              D-2 기본 HTML 비제어형
              <input
                inputMode="numeric"
                defaultValue=""
                aria-label="D-2 레이아웃 내부 기본 입력"
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: 44,
                  border: "1px solid #065f46",
                  borderRadius: 4,
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "8px 10px",
                  fontSize: 16,
                }}
              />
            </label>
          </div>

          <div className="min-h-20 rounded-md border border-dashed border-emerald-700 bg-white/70 p-3 text-xs">
            D 패널 빈 영역입니다. D-1/D-2 입력 전환, 빈 영역 터치, 닫기를 반복합니다.
          </div>
        </section>
      ) : null}

      {cleanModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[9000] grid place-items-center bg-slate-950/45 p-4"
              data-focus-environment-test="clean-fixed-modal"
              role="presentation"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="clean-modal-title"
                className="grid w-[min(460px,calc(100vw-32px))] gap-4 rounded-md border-4 border-amber-600 bg-white p-5 text-slate-950"
              >
                <div className="flex items-start justify-between gap-3 border-b border-amber-300 pb-3">
                  <div>
                    <p id="clean-modal-title" className="text-base font-bold">E2. 새 최소 모달 테스트</p>
                    <p className="mt-1 text-[11px] leading-4">
                      기존 WAFL 모달·AppSheet·focus trap·scroll lock·viewport 보정 없이 body portal과 fixed backdrop만 사용합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="min-h-10 shrink-0 rounded-md border border-slate-900 bg-white px-4 text-sm font-bold"
                    onClick={() => setCleanModalOpen(false)}
                  >
                    닫기
                  </button>
                </div>

                <div className="grid gap-4">
                  <label className="grid gap-1 text-xs font-bold">
                    E2-1 기본 HTML 비제어형
                    <input
                      inputMode="numeric"
                      defaultValue=""
                      aria-label="E2-1 새 최소 모달 기본 입력"
                      style={{
                        display: "block",
                        width: "100%",
                        minHeight: 48,
                        border: "1px solid #92400e",
                        borderRadius: 4,
                        background: "#ffffff",
                        color: "#0f172a",
                        padding: "10px 12px",
                        fontSize: 16,
                      }}
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-bold">
                    E2-2 기본 HTML 비제어형
                    <input
                      inputMode="numeric"
                      defaultValue=""
                      aria-label="E2-2 새 최소 모달 기본 입력"
                      style={{
                        display: "block",
                        width: "100%",
                        minHeight: 48,
                        border: "1px solid #92400e",
                        borderRadius: 4,
                        background: "#ffffff",
                        color: "#0f172a",
                        padding: "10px 12px",
                        fontSize: 16,
                      }}
                    />
                  </label>
                </div>

                <div className="min-h-24 rounded-md border border-dashed border-amber-600 bg-amber-50 p-4 text-xs">
                  E2 모달 빈 영역입니다. E2-1/E2-2 입력 전환, 빈 영역 터치, 닫기를 반복합니다.
                </div>

                <button
                  type="button"
                  className="min-h-11 rounded-md border border-amber-700 bg-amber-100 px-4 text-sm font-bold text-amber-950"
                  onClick={() => setCleanModalOpen(false)}
                >
                  하단 닫기 테스트
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {fixedPanelOpen ? (
        <div
          className="fixed bottom-0 right-0 top-[72px] z-[5000] flex w-[min(420px,92vw)] flex-col border-l-4 border-fuchsia-600 bg-white text-slate-950 shadow-none"
          data-focus-environment-test="fixed-no-portal"
        >
          <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b-2 border-fuchsia-600 bg-fuchsia-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold">B. 비포털 fixed 패널 테스트</p>
              <p className="mt-1 text-[11px]">AppSheet와 portal 없이 현재 React 트리에 직접 렌더링됩니다.</p>
            </div>
            <button
              type="button"
              className="min-h-9 rounded-md border border-slate-900 px-3 text-xs font-bold"
              onClick={() => setFixedPanelOpen(false)}
            >
              닫기
            </button>
          </header>
          <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto overscroll-contain p-4">
            <label className="grid gap-1 text-xs font-bold">
              B-1 기본 HTML 비제어형
              <input
                inputMode="numeric"
                defaultValue=""
                aria-label="B-1 비포털 fixed 기본 입력"
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: 44,
                  border: "1px solid #0f172a",
                  borderRadius: 4,
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "8px 10px",
                  fontSize: 16,
                }}
              />
            </label>
            <label className="grid gap-1 text-xs font-bold">
              B-2 기본 HTML 비제어형
              <input
                inputMode="numeric"
                defaultValue=""
                aria-label="B-2 비포털 fixed 기본 입력"
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: 44,
                  border: "1px solid #0f172a",
                  borderRadius: 4,
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "8px 10px",
                  fontSize: 16,
                }}
              />
            </label>
            <div className="min-h-28 rounded-md border border-dashed border-slate-400 p-3 text-xs">
              패널 빈 영역입니다. 입력 사이 이동, 빈 영역 터치, 닫기를 반복합니다.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const topbar = (
    <AdminTopbar
      companyName={companyName || "WAFL"}
      appVersion={APP_VERSION}
      title="원단·부자재"
      description="작업지시서의 자재 발주 대기 항목을 공급처별 발주서로 묶고, 발주 상태와 잔여 자재를 확인합니다."
      onOpenMenu={
        useDrawerNavigation
          ? () => setMobileOrderListDrawerOpen(true)
          : undefined
      }
      menuLabel="발주서"
      menuAriaLabel="발주서 목록 열기"
    />
  );

  const statusToast = (
    <ToastMessage
      message={statusToastMessage}
      tone={statusToastTone}
      eventKey={statusToastEventKey}
    />
  );

  const validationModal = (
    <>
      <MaterialOrderLineAddModal {...materialOrderLineAddModal} />
      <MaterialOrderLineAddDrawer {...materialOrderLineAddDrawer} />
      <WorkflowValidationModal {...materialOrderValidationModal} />
    </>
  );

  const listPanel = (
    <MaterialOrderListPanel
      orders={orders}
      selectedOrderId={selectedOrderId}
      loading={ordersLoading}
      errorMessage={ordersError}
      creating={creatingOrder}
      onSelectOrder={handleSelectOrder}
      onCreateOrder={createOrder}
      onCancelOrder={cancelOrder}
      onRetry={() => void refreshOrders()}
      selectedDraftMaterialType={materialType}
      selectedDraftSupplierName={selectedDraftSupplierName}
    />
  );

  const detailPanel = (
    <MaterialOrderDetailPanel
      selectedOrder={selectedOrder}
      materialType={materialType}
      supplierPartnerId={supplierPartnerId}
      suppliers={suppliers}
      suppliersLoading={suppliersLoading}
      suppliersError={suppliersError}
      lines={lines}
      totals={totals}
      dueDate={dueDate}
      onChangeDueDate={setDueDate}
      onChangeMaterialType={changeMaterialType}
      onChangeSupplierPartnerId={setSupplierPartnerId}
      onRetrySuppliers={() => void refreshSuppliers(materialType)}
      statusChanging={statusChanging}
      onChangeLine={updateLine}
      onRemoveLine={removeLine}
      onChangeStatus={(status) => void changeSelectedOrderStatus(status)}
      canRequestMaterialOrder={canRequestMaterialOrder}
      canPlaceMaterialOrder={canPlaceMaterialOrder}
      workOrderCandidates={workOrderCandidates}
      mobile={deviceType === "mobile"}
      progressLayout={useStackedProgress ? "vertical" : "horizontal"}
    />
  );

  const allocationPanel = (
    <MaterialOrderAllocationPanel
      candidates={workOrderCandidates}
      lines={lines}
      materialRequestQuantityMap={materialRequestQuantityMap}
      materialRequestCompletionMap={materialRequestCompletionMap}
      selectedMaterialType={materialType}
      hasSelectedOrder={Boolean(selectedOrderId)}
      editable={selectedOrder?.status === "draft"}
      loading={workOrdersLoading}
      errorMessage={workOrdersError}
      onAddMaterialToOrder={handleAddMaterialToOrder}
      onAddMaterialToOrderDrawer={handleAddMaterialToOrderDrawer}
      onRetry={() => void refreshWorkOrderCandidates()}
      mobile={deviceType === "mobile"}
    />
  );

  if (useTabletTwoPanel) {
    return (
      <div className={MATERIAL_ORDER_WORKSPACE_STACK_CLASS} data-material-order-workspace-root="true">
        {topbar}
        {focusEnvironmentDiagnostic}
        {validationModal}
        <WaflMobileListDrawer
          open={mobileOrderListDrawerOpen}
          onClose={() => setMobileOrderListDrawerOpen(false)}
          title="발주서 목록"
          closeLabel="닫기"
          closeOverlayAria="발주서 목록 드로어 닫기"
          titleId="material-order-tablet-drawer-title"
          showHeader={false}
        >
          <div className="min-h-[72dvh] min-w-0">
            <MaterialOrderListPanel
              variant="drawer"
              orders={orders}
              selectedOrderId={selectedOrderId}
              loading={ordersLoading}
              errorMessage={ordersError}
              creating={creatingOrder}
              onSelectOrder={handleSelectOrder}
              onCreateOrder={createOrder}
              onCancelOrder={cancelOrder}
              onRetry={() => void refreshOrders()}
              selectedDraftMaterialType={materialType}
              selectedDraftSupplierName={selectedDraftSupplierName}
            />
          </div>
        </WaflMobileListDrawer>
        <AppResponsiveWorkspace device="tablet">
          {statusToast}
          <WaflTwoPanelWorkspace detail={detailPanel} side={allocationPanel} />
        </AppResponsiveWorkspace>
      </div>
    );
  }

  if (useDrawerNavigation) {
    const mobileToolTabs: Array<
      AppSegmentedTabItem<MaterialOrderMobileToolKey>
    > = [
      { key: "workorders", label: "작업지시서" },
      { key: "schedule", label: "PDF·납기" },
    ];

    const actionBar = (
      <WaflMobileFloatingActionButton
        ariaLabel="발주 대상 선택 열기"
        title="발주 대상 작업지시서와 자재 선택 도구를 엽니다."
        disabled={!selectedOrderId}
        onClick={() => setMobileToolSheetOpen(true)}
      >
        <SearchIcon />
        <span>발주 대상</span>
      </WaflMobileFloatingActionButton>
    );

    return (
      <>
        {validationModal}
        <WaflMobileShell
          topBar={topbar}
          actionBar={actionBar}
          drawer={
            <WaflMobileListDrawer
              open={mobileOrderListDrawerOpen}
              onClose={() => setMobileOrderListDrawerOpen(false)}
              title="발주서 목록"
              closeLabel="닫기"
              closeOverlayAria="발주서 목록 드로어 닫기"
              titleId="material-order-mobile-drawer-title"
              showHeader={false}
            >
              <div className="min-h-[72dvh] min-w-0">
                <MaterialOrderListPanel
                  variant="drawer"
                  orders={orders}
                  selectedOrderId={selectedOrderId}
                  loading={ordersLoading}
                  errorMessage={ordersError}
                  creating={creatingOrder}
                  onSelectOrder={handleSelectOrder}
                  onCreateOrder={createOrder}
                  onCancelOrder={cancelOrder}
                  onRetry={() => void refreshOrders()}
                  selectedDraftMaterialType={materialType}
                  selectedDraftSupplierName={selectedDraftSupplierName}
                />
              </div>
            </WaflMobileListDrawer>
          }
          contentClassName="gap-3"
        >
          {focusEnvironmentDiagnostic}
          {statusToast}
          <WaflMobileContentSection>{detailPanel}</WaflMobileContentSection>
          <WaflMobileTabbedActionSheet
            open={mobileToolSheetOpen}
            onOpenChange={setMobileToolSheetOpen}
            title="발주 대상"
            items={mobileToolTabs}
            value={mobileActiveTool}
            onChange={setMobileActiveTool}
            ariaLabel="원단·부자재 작업지시서 및 자재 선택 도구"
            presentation={deviceType === "tablet" ? "modal" : "sheet"}
            contentClassName={deviceType === "tablet" ? "px-5 py-5" : undefined}
          >
            {mobileActiveTool === "workorders" ? (
              <div className={deviceType === "tablet" ? "min-h-0 min-w-0" : "min-h-[58dvh] min-w-0"}>{allocationPanel}</div>
            ) : null}
            {mobileActiveTool === "schedule" ? (
              <WaflEmptyCard
                component="material-order-schedule-empty"
                className="min-h-[42dvh] p-4 text-left"
              >
                <p className="text-sm font-bold pbp-text-primary">PDF·납기</p>
                <p className="mt-2 text-xs leading-5 pbp-text-muted">
                  PDF 생성과 납기 입력 액션은 후속 기능 연결 시 이 탭에
                  배치합니다.
                </p>
              </WaflEmptyCard>
            ) : null}
          </WaflMobileTabbedActionSheet>
        </WaflMobileShell>
      </>
    );
  }

  if (useThreePanel) {
    return (
      <div className={MATERIAL_ORDER_WORKSPACE_STACK_CLASS} data-material-order-workspace-root="true">
        {topbar}
        {focusEnvironmentDiagnostic}
        {validationModal}
        <AppResponsiveWorkspace device="desktop">
          {statusToast}
          <WaflThreePanelWorkspace
            list={listPanel}
            detail={detailPanel}
            side={allocationPanel}
          />
        </AppResponsiveWorkspace>
      </div>
    );
  }

  return null;
}
