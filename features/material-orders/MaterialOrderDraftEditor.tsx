"use client";

import { useEffect, useState } from "react";

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
  WaflSurface,
  WaflThreePanelWorkspace,
  type AppSegmentedTabItem,
} from "@/components/common/ui";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import MaterialOrderLineAddModal from "@/features/material-orders/components/MaterialOrderLineAddModal";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";
import { APP_VERSION } from "@/lib/constants/version";
import { RESPONSIVE_BREAKPOINTS } from "@/lib/responsive/responsiveLayoutPolicy";
import { useResponsiveDeviceType } from "@/lib/responsive/useResponsiveDeviceType";
import { useResponsiveOrientation } from "@/lib/responsive/useResponsiveOrientation";

const MATERIAL_ORDER_TABLET_GRID_STYLE = {
  gridTemplateColumns: "minmax(240px, 0.72fr) minmax(0, 1fr)",
} as const;

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

function getViewportWidth() {
  if (typeof window === "undefined") return RESPONSIVE_BREAKPOINTS.desktopMin;
  return window.innerWidth;
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
  const deviceType = useResponsiveDeviceType();
  const orientation = useResponsiveOrientation();
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
  const tabletCanUseThreePanel =
    orientation === "landscape" &&
    viewportWidth >= RESPONSIVE_BREAKPOINTS.tabletThreePanelMin;
  const compactTabletLandscape =
    deviceType === "tablet" &&
    orientation === "landscape" &&
    !tabletCanUseThreePanel;
  const useDrawerNavigation =
    deviceType === "mobile" ||
    (deviceType === "tablet" && !tabletCanUseThreePanel);
  const useStackedProgress = deviceType === "mobile";
  const canUseThreePanelWorkspace =
    deviceType === "desktop" ||
    (deviceType === "tablet" && tabletCanUseThreePanel);
  const [mobileOrderListDrawerOpen, setMobileOrderListDrawerOpen] =
    useState(false);
  const [mobileToolSheetOpen, setMobileToolSheetOpen] = useState(false);
  const [mobileActiveTool, setMobileActiveTool] =
    useState<MaterialOrderMobileToolKey>("workorders");

  useEffect(() => {
    const handleResize = () => setViewportWidth(getViewportWidth());
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

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

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId((currentOrderId) =>
      currentOrderId === orderId ? "" : orderId,
    );
    setMobileOrderListDrawerOpen(false);
  };

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
      onAddMaterialToOrder={addWorkOrderMaterialLine}
      onRetry={() => void refreshWorkOrderCandidates()}
      mobile={deviceType === "mobile"}
    />
  );

  if (compactTabletLandscape) {
    return (
      <div className={MATERIAL_ORDER_WORKSPACE_STACK_CLASS}>
        {topbar}
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
          <div className="grid h-full min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_minmax(280px,0.46fr)] gap-3">
            <WaflSurface
              as="section"
              component="material-order-tablet-detail-shell"
              className="min-h-0 min-w-0 overflow-y-auto"
            >
              {detailPanel}
            </WaflSurface>
            <WaflSurface
              as="section"
              component="material-order-tablet-allocation-shell"
              className="min-h-0 min-w-0 overflow-y-auto"
            >
              {allocationPanel}
            </WaflSurface>
          </div>
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
        ariaLabel="작지·자재 선택 열기"
        title="작업지시서와 자재 선택 도구를 엽니다."
        disabled={!selectedOrderId}
        onClick={() => setMobileToolSheetOpen(true)}
      >
        <SearchIcon />
        <span>작지·자재</span>
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
        {statusToast}
        <WaflMobileContentSection>{detailPanel}</WaflMobileContentSection>
        <WaflMobileTabbedActionSheet
          open={mobileToolSheetOpen}
          onOpenChange={setMobileToolSheetOpen}
          title="작지·자재"
          items={mobileToolTabs}
          value={mobileActiveTool}
          onChange={setMobileActiveTool}
          ariaLabel="원단·부자재 작업지시서 및 자재 선택 도구"
        >
          {mobileActiveTool === "workorders" ? (
            <div className="min-h-[58dvh] min-w-0">{allocationPanel}</div>
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

  if (deviceType === "tablet") {
    if (canUseThreePanelWorkspace) {
      return (
        <div className={MATERIAL_ORDER_WORKSPACE_STACK_CLASS}>
          {topbar}
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

    return (
      <div className={MATERIAL_ORDER_WORKSPACE_STACK_CLASS}>
        {topbar}
        {validationModal}
        <AppResponsiveWorkspace device="tablet">
          {statusToast}
          <div
            className="grid min-h-0 min-w-0 gap-3"
            style={MATERIAL_ORDER_TABLET_GRID_STYLE}
          >
            <section className="min-h-[680px] min-w-0">{listPanel}</section>
            <section className="min-h-[680px] min-w-0">{detailPanel}</section>
          </div>
        </AppResponsiveWorkspace>
      </div>
    );
  }

  return (
    <div className={MATERIAL_ORDER_WORKSPACE_STACK_CLASS}>
      {topbar}
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
