"use client";

import { useEffect, useState } from "react";

import ToastMessage from "@/components/common/ToastMessage";
import { AppButton, AppResponsiveWorkspace, AppSheet, WaflMobileContentSection, WaflMobileFixedActionBar, WaflMobileShell } from "@/components/common/ui";
import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";
import { useResponsiveDeviceType } from "@/lib/responsive/useResponsiveDeviceType";

const MATERIAL_ORDER_PANEL_GRID_STYLE = {
  gridTemplateColumns: "minmax(220px, 0.7fr) minmax(640px, 1fr) minmax(220px, 0.7fr)",
} as const;

const MATERIAL_ORDER_TABLET_GRID_STYLE = {
  gridTemplateColumns: "minmax(240px, 0.72fr) minmax(0, 1fr)",
} as const;

export default function MaterialOrderDraftEditor() {
  const deviceType = useResponsiveDeviceType();
  const [mobileOrderListDrawerOpen, setMobileOrderListDrawerOpen] = useState(false);
  const [mobileMaterialSheetOpen, setMobileMaterialSheetOpen] = useState(false);
  const [tabletMaterialSheetOpen, setTabletMaterialSheetOpen] = useState(false);

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
    totals,
    selectedDraftSupplierName,
    materialRequestQuantityMap,
    materialRequestCompletionMap,
    setSelectedOrderId,
    setSupplierPartnerId,
    refreshOrders,
    refreshWorkOrderCandidates,
    refreshSuppliers,
    createOrder,
    changeMaterialType,
    changeSelectedOrderStatus,
    updateLine,
    addWorkOrderMaterialLine,
    removeLine,
  } = useMaterialOrderDraftEditor();

  useEffect(() => {
    if (!selectedOrderId) {
      setMobileOrderListDrawerOpen(false);
      setMobileMaterialSheetOpen(false);
      setTabletMaterialSheetOpen(false);
    }
  }, [selectedOrderId]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setMobileOrderListDrawerOpen(false);
    setTabletMaterialSheetOpen(false);
  };

  const statusToast = (
    <ToastMessage
      message={statusToastMessage}
      tone={statusToastTone}
      eventKey={statusToastEventKey}
    />
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
      onRetry={() => void refreshOrders()}
      selectedDraftMaterialType={materialType}
      selectedDraftSupplierName={selectedDraftSupplierName}
      selectedDraftLines={lines}
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
      onChangeMaterialType={changeMaterialType}
      onChangeSupplierPartnerId={setSupplierPartnerId}
      onRetrySuppliers={() => void refreshSuppliers(materialType)}
      statusChanging={statusChanging}
      onChangeLine={updateLine}
      onRemoveLine={removeLine}
      onChangeStatus={(status) => void changeSelectedOrderStatus(status)}
      mobile={deviceType === "mobile"}
    />
  );

  const allocationPanel = (
    <MaterialOrderAllocationPanel
      candidates={workOrderCandidates}
      lines={lines}
      materialRequestQuantityMap={materialRequestQuantityMap}
      materialRequestCompletionMap={materialRequestCompletionMap}
      editable={selectedOrder?.status === "draft"}
      loading={workOrdersLoading}
      errorMessage={workOrdersError}
      onAddMaterialToOrder={addWorkOrderMaterialLine}
      onRetry={() => void refreshWorkOrderCandidates()}
      mobile={deviceType === "mobile"}
    />
  );

  if (deviceType === "mobile") {
    const actionBar = (
      <WaflMobileFixedActionBar>
        <div className="grid grid-cols-3 gap-2">
          <AppButton
            type="button"
            variant="secondary"
            size="md"
            width="full"
            aria-label="발주서 목록 드로어 열기"
            title="상세 화면을 유지한 채 발주서 목록을 엽니다."
            onClick={() => setMobileOrderListDrawerOpen(true)}
          >
            발주서
          </AppButton>
          <AppButton
            type="button"
            variant="primary"
            size="md"
            width="full"
            disabled={!selectedOrderId}
            title="이번 발주서에 담을 작업지시서 자재를 선택합니다."
            aria-label="작업지시서 자재 선택 패널 열기"
            onClick={() => setMobileMaterialSheetOpen(true)}
          >
            자재
          </AppButton>
          <AppButton
            type="button"
            variant="ghost"
            size="md"
            width="full"
            disabled
            title="PDF 생성과 납기 입력은 후속 기능 연결 시 같은 위치에 배치합니다."
            aria-label="PDF 및 납기 액션 준비 중"
          >
            PDF·납기
          </AppButton>
        </div>
      </WaflMobileFixedActionBar>
    );

    return (
      <WaflMobileShell actionBar={actionBar} contentClassName="gap-3">
        {statusToast}
        <WaflMobileContentSection>{detailPanel}</WaflMobileContentSection>
        <AppSheet
          open={mobileOrderListDrawerOpen}
          onOpenChange={setMobileOrderListDrawerOpen}
          title="발주서 목록"
          description="현재 상세 화면을 유지한 채 다른 발주서를 선택합니다."
          side="left"
          size="md"
          className="w-[86%] max-w-sm rounded-r-3xl"
          contentClassName="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
        >
          <div className="min-h-[72dvh] min-w-0">{listPanel}</div>
        </AppSheet>
        <AppSheet
          open={mobileMaterialSheetOpen}
          onOpenChange={setMobileMaterialSheetOpen}
          title="작업지시서 자재 선택"
          description="남은 자재와 진행 상태를 확인한 뒤 이번 발주서에 담을 품목을 선택합니다."
          side="bottom"
          size="full"
          contentClassName="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
        >
          <div className="min-h-[62dvh] min-w-0">{allocationPanel}</div>
        </AppSheet>
      </WaflMobileShell>
    );
  }

  if (deviceType === "tablet") {
    return (
      <AppResponsiveWorkspace device="tablet">
        {statusToast}
        <div className="grid min-h-0 min-w-0 gap-3" style={MATERIAL_ORDER_TABLET_GRID_STYLE}>
          <section className="min-h-[680px] min-w-0">{listPanel}</section>
          <div className="min-w-0 space-y-3">
            <div className="flex justify-end">
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                title="이번 발주서에 담을 작업지시서 자재를 선택합니다."
                aria-label="작업지시서 자재 선택 패널 열기"
                onClick={() => setTabletMaterialSheetOpen(true)}
              >
                자재 선택
              </AppButton>
            </div>
            <section className="min-h-[680px] min-w-0">{detailPanel}</section>
          </div>
        </div>
        <AppSheet
          open={tabletMaterialSheetOpen}
          onOpenChange={setTabletMaterialSheetOpen}
          title="작업지시서 자재 선택"
          description="남은 자재와 진행 상태를 확인한 뒤 이번 발주서에 담을 품목을 선택합니다."
          side="right"
          size="lg"
          contentClassName="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
        >
          <div className="min-h-[72vh] min-w-0">{allocationPanel}</div>
        </AppSheet>
      </AppResponsiveWorkspace>
    );
  }

  return (
    <AppResponsiveWorkspace device="desktop">
      {statusToast}
      <div
        className="grid h-full min-h-0 min-w-[1080px] gap-3"
        style={MATERIAL_ORDER_PANEL_GRID_STYLE}
      >
        {listPanel}
        {detailPanel}
        {allocationPanel}
      </div>
    </AppResponsiveWorkspace>
  );
}
