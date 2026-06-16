"use client";

import { useEffect, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import WorkflowValidationModal from "@/components/common/modal/WorkflowValidationModal";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  WaflEmptyCard,
  WaflMobileListDrawer,
  WaflMobileWorkspaceFrame,
  WaflButton,
  WaflDesktopWorkspaceFrame,
  WaflTabletWorkspaceFrame,
  type AppSegmentedTabItem,
} from "@/components/common/ui";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import MaterialOrderLineAddModal from "@/features/material-orders/components/MaterialOrderLineAddModal";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";
import { APP_VERSION } from "@/lib/constants/version";
import { useWorkspaceSelectionController } from "@/lib/hooks/workspace/useWorkspaceSelectionController";
import { useWorkspaceToolState } from "@/lib/hooks/workspace/useWorkspaceToolState";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

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
  isAdmin,
}: {
  companyName: string;
  canRequestMaterialOrder: boolean;
  canPlaceMaterialOrder: boolean;
  isAdmin: boolean;
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

  const {
    orders,
    selectedOrderId,
    selectedOrder,
    ordersLoading,
    ordersError,
    creatingOrder,
    statusChanging,
    headerSaving,
    headerSaveStatus,
    headerSaveMessage,
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
    materialTypeChangeConfirmationModal,
    setSelectedOrderId,
    changeSupplierPartnerId,
    changeDueDate,
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
  } = useMaterialOrderDraftEditor({ isAdmin });

  const {
    open: mobileToolSheetOpen,
    setOpen: setMobileToolSheetOpen,
    activeTool: mobileActiveTool,
    setActiveTool: setMobileActiveTool,
  } = useWorkspaceToolState<MaterialOrderMobileToolKey>({
    resetKey: selectedOrderId,
    defaultTool: "workorders",
  });
  const handleSelectOrder = useWorkspaceSelectionController({
    selectedId: selectedOrderId,
    onSelect: setSelectedOrderId,
    onSelectionChange: () => setMobileOrderListDrawerOpen(false),
  });

  useEffect(() => {
    if (materialOrderLineAddModal.open) {
      setMobileToolSheetOpen(false);
    }
  }, [materialOrderLineAddModal.open, setMobileToolSheetOpen]);

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
      <ModalShell
        open={materialTypeChangeConfirmationModal.open}
        title={materialTypeChangeConfirmationModal.title}
        description={materialTypeChangeConfirmationModal.description}
        onClose={materialTypeChangeConfirmationModal.onClose}
        maxWidthClass="sm:max-w-md"
        footer={(
          <>
            <WaflButton
              variant="secondary"
              onClick={materialTypeChangeConfirmationModal.onClose}
            >
              {materialTypeChangeConfirmationModal.cancelLabel}
            </WaflButton>
            <WaflButton
              variant="danger"
              onClick={materialTypeChangeConfirmationModal.onConfirm}
            >
              {materialTypeChangeConfirmationModal.confirmLabel}
            </WaflButton>
          </>
        )}
      >
        <p className="text-sm leading-6 pbp-text-muted">
          변경 후에는 새 자재 종류에 맞춰 공급처와 품목을 다시 선택해야 합니다.
        </p>
      </ModalShell>
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
      onChangeDueDate={changeDueDate}
      onChangeMaterialType={changeMaterialType}
      onChangeSupplierPartnerId={changeSupplierPartnerId}
      onRetrySuppliers={() => void refreshSuppliers(materialType)}
      statusChanging={statusChanging}
      headerSaving={headerSaving}
      headerSaveStatus={headerSaveStatus}
      headerSaveMessage={headerSaveMessage}
      onChangeLine={updateLine}
      onRemoveLine={removeLine}
      onChangeStatus={(status) => void changeSelectedOrderStatus(status)}
      canRequestMaterialOrder={canRequestMaterialOrder}
      canPlaceMaterialOrder={canPlaceMaterialOrder}
      isAdmin={isAdmin}
      workOrderCandidates={workOrderCandidates}
      mobile={useDrawerNavigation}
      mobileSurface={useDrawerNavigation && !useTabletTwoPanel}
      progressLayout={useStackedProgress ? "vertical" : "horizontal"}
      loading={ordersLoading}
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
      editable={selectedOrder?.status === "draft" || selectedOrder?.status === "rejected"}
      loading={workOrdersLoading}
      workspaceLoading={ordersLoading}
      errorMessage={workOrdersError}
      onAddMaterialToOrder={handleAddMaterialToOrder}
      onRetry={() => void refreshWorkOrderCandidates()}
      mobile={deviceType === "mobile"}
    />
  );

  if (useTabletTwoPanel) {
    return (
      <>
        {validationModal}
        <WaflTabletWorkspaceFrame
          topbar={topbar}
          listDrawerOpen={mobileOrderListDrawerOpen}
          onCloseListDrawer={() => setMobileOrderListDrawerOpen(false)}
          listDrawerTitle="발주서 목록"
          listDrawerTitleId="material-order-tablet-drawer-title"
          listDrawerCloseAria="발주서 목록 드로어 닫기"
          list={(
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
          )}
          detail={detailPanel}
          side={allocationPanel}
          scrollResetKey={selectedOrderId}
          workspaceOverlay={statusToast}
        />
      </>
    );
  }

  if (useDrawerNavigation) {
    const mobileToolTabs: Array<
      AppSegmentedTabItem<MaterialOrderMobileToolKey>
    > = [
      { key: "workorders", label: "작업지시서" },
      { key: "schedule", label: "PDF·납기" },
    ];

    return (
      <>
        {validationModal}
        <WaflMobileWorkspaceFrame
          topbar={topbar}
          drawer={(
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
          )}
          detail={detailPanel}
          workspaceOverlay={statusToast}
          scrollResetKey={selectedOrderId}
          hasSelection={Boolean(selectedOrderId)}
          actionAriaLabel="발주 대상 선택 열기"
          actionTitle="발주 대상 작업지시서와 자재 선택 도구를 엽니다."
          actionLabel="발주 대상"
          actionIcon={<SearchIcon />}
          toolTitle="발주 대상"
          toolTabs={mobileToolTabs}
          defaultTool="workorders"
          toolAriaLabel="원단·부자재 작업지시서 및 자재 선택 도구"
          toolOpen={mobileToolSheetOpen}
          onToolOpenChange={setMobileToolSheetOpen}
          activeTool={mobileActiveTool}
          onActiveToolChange={setMobileActiveTool}
          presentation={deviceType === "tablet" ? "modal" : "sheet"}
          sheetContentClassName={deviceType === "tablet" ? "px-5 py-5" : undefined}
          contentClassName="gap-3"
          renderTool={(activeTool: MaterialOrderMobileToolKey) => (
            <>
              {activeTool === "workorders" ? (
                <div className={deviceType === "tablet" ? "min-h-0 min-w-0" : "min-h-[58dvh] min-w-0"}>{allocationPanel}</div>
              ) : null}
              {activeTool === "schedule" ? (
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
            </>
          )}
        />
      </>
    );
  }

  if (useThreePanel) {
    return (
      <>
        {validationModal}
        <WaflDesktopWorkspaceFrame
          topbar={topbar}
          list={listPanel}
          detail={detailPanel}
          side={allocationPanel}
          scrollResetKey={selectedOrderId}
          workspaceOverlay={statusToast}
        />
      </>
    );
  }

  return null;
}
