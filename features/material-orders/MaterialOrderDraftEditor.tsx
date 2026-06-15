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
  WaflThreePanelWorkspace,
  WaflTwoPanelWorkspace,
  WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS,
  type AppSegmentedTabItem,
} from "@/components/common/ui";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import MaterialOrderLineAddModal from "@/features/material-orders/components/MaterialOrderLineAddModal";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";
import { APP_VERSION } from "@/lib/constants/version";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

const MATERIAL_ORDER_WORKSPACE_STACK_CLASS =
  `flex h-full min-h-0 flex-col ${WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS}`;

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

  useEffect(() => {
    if (materialOrderLineAddModal.open) {
      setMobileToolSheetOpen(false);
    }
  }, [materialOrderLineAddModal.open]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId((currentOrderId) =>
      currentOrderId === orderId ? "" : orderId,
    );
    setMobileOrderListDrawerOpen(false);
  };

  const handleAddMaterialToOrder = (
    ...args: Parameters<typeof addWorkOrderMaterialLine>
  ) => {
    if (!mobileToolSheetOpen) {
      addWorkOrderMaterialLine(...args);
      return;
    }

    setMobileToolSheetOpen(false);
    window.requestAnimationFrame(() => {
      addWorkOrderMaterialLine(...args);
    });
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
      onRetry={() => void refreshWorkOrderCandidates()}
      mobile={deviceType === "mobile"}
    />
  );

  if (useTabletTwoPanel) {
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

  return null;
}
