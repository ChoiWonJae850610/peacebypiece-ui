"use client";

import { useEffect, useState } from "react";

import ToastMessage from "@/components/common/ToastMessage";
import { AppSegmentedTabs } from "@/components/common/ui";
import { AppButton, AppResponsiveWorkspace, AppSheet } from "@/components/common/ui";
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

type MaterialOrderPanelKey = "orders" | "detail" | "materials";

const MATERIAL_ORDER_PANEL_TABS: Array<{ key: MaterialOrderPanelKey; label: string }> = [
  { key: "orders", label: "발주서" },
  { key: "detail", label: "상세 입력" },
  { key: "materials", label: "자재 선택" },
];

export default function MaterialOrderDraftEditor() {
  const deviceType = useResponsiveDeviceType();
  const [mobilePanel, setMobilePanel] = useState<Exclude<MaterialOrderPanelKey, "materials">>("orders");
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
      setMobilePanel("orders");
      setMobileMaterialSheetOpen(false);
      setTabletMaterialSheetOpen(false);
    }
  }, [selectedOrderId]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setMobilePanel("detail");
    setTabletMaterialSheetOpen(false);
  };

  const handleMobilePanelChange = (panel: MaterialOrderPanelKey) => {
    if (panel === "materials") {
      setMobileMaterialSheetOpen(true);
      return;
    }

    setMobilePanel(panel);
  };

  const statusToast = (
    <ToastMessage
      message={statusToastMessage}
      tone={statusToastTone}
      eventKey={statusToastEventKey}
    />
  );

  const mobilePanelTabs = (
    <AppSegmentedTabs
      items={MATERIAL_ORDER_PANEL_TABS}
      value={mobilePanel}
      onChange={handleMobilePanelChange}
      className="-mx-1 mb-3 bg-[var(--pbp-surface)]/95"
      sticky
      ariaLabel="원단·부자재 발주 화면 전환"
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
    />
  );

  if (deviceType === "mobile") {
    return (
      <AppResponsiveWorkspace device="mobile">
        {statusToast}
        {mobilePanelTabs}
        <div className="min-h-0 min-w-0">
          {mobilePanel === "orders" ? <section className="min-h-[520px] min-w-0">{listPanel}</section> : null}
          {mobilePanel === "detail" ? (
            <section className="min-h-[620px] min-w-0 space-y-3">
              <div className="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 flex justify-end rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)]/95 p-2 shadow-[0_-10px_26px_rgba(28,25,23,0.10)] backdrop-blur">
                <AppButton
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  title="이번 발주서에 담을 작업지시서 자재를 선택합니다."
                  aria-label="작업지시서 자재 선택 패널 열기"
                  onClick={() => setMobileMaterialSheetOpen(true)}
                >
                  자재 선택
                </AppButton>
              </div>
              {detailPanel}
            </section>
          ) : null}
        </div>
        <AppSheet
          open={mobileMaterialSheetOpen}
          onOpenChange={setMobileMaterialSheetOpen}
          title="작업지시서 자재 선택"
          description="자재 발주 대기 상태의 작업지시서에서 이번 발주서에 담을 품목을 선택합니다."
          side="bottom"
          size="full"
          contentClassName="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
        >
          <div className="min-h-[62dvh] min-w-0">{allocationPanel}</div>
        </AppSheet>
      </AppResponsiveWorkspace>
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
          description="자재 발주 대기 상태의 작업지시서에서 이번 발주서에 담을 품목을 선택합니다."
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
