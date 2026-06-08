"use client";

import { useEffect, useRef, useState } from "react";

import ToastMessage from "@/components/common/ToastMessage";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { AppButton, AppResponsiveWorkspace, AppSegmentedTabs, AppSheet, WaflMobileContentSection, WaflMobileFloatingActionButton, WaflMobileShell, type AppSegmentedTabItem } from "@/components/common/ui";
import MobileTopBar from "@/components/layout/MobileTopBar";
import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";
import { APP_VERSION } from "@/lib/constants/version";
import { useResponsiveDeviceType } from "@/lib/responsive/useResponsiveDeviceType";

const MATERIAL_ORDER_PANEL_GRID_STYLE = {
  gridTemplateColumns: "minmax(220px, 0.7fr) minmax(640px, 1fr) minmax(220px, 0.7fr)",
} as const;

const MATERIAL_ORDER_TABLET_GRID_STYLE = {
  gridTemplateColumns: "minmax(240px, 0.72fr) minmax(0, 1fr)",
} as const;

type MaterialOrderMobileToolKey = "workorders" | "schedule";

const MATERIAL_ORDER_MOBILE_HOME_NAVIGATION = {
  href: "/workspace" as const,
  target: "member" as const,
  label: "업무 홈",
  ariaLabel: "업무 홈으로 이동",
};

export default function MaterialOrderDraftEditor() {
  const deviceType = useResponsiveDeviceType();
  const mobileOrderListDrawerRef = useRef<HTMLDivElement | null>(null);
  const [mobileOrderListDrawerOpen, setMobileOrderListDrawerOpen] = useState(false);
  const [mobileToolSheetOpen, setMobileToolSheetOpen] = useState(false);
  const [mobileActiveTool, setMobileActiveTool] = useState<MaterialOrderMobileToolKey>("workorders");
  const [tabletMaterialSheetOpen, setTabletMaterialSheetOpen] = useState(false);

  useModalEnvironment({
    open: mobileOrderListDrawerOpen,
    dialogRef: mobileOrderListDrawerRef,
    onClose: () => setMobileOrderListDrawerOpen(false),
  });

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
      setMobileToolSheetOpen(false);
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
    const mobileToolTabs: Array<AppSegmentedTabItem<MaterialOrderMobileToolKey>> = [
      { key: "workorders", label: "작업지시서" },
      { key: "schedule", label: "PDF·납기" },
    ];

    const actionBar = (
      <WaflMobileFloatingActionButton
        ariaLabel="발주 도구 열기"
        title="작업지시서 선택과 PDF·납기 도구를 엽니다."
        disabled={!selectedOrderId}
        onClick={() => setMobileToolSheetOpen(true)}
      >
        <span aria-hidden="true">＋</span>
        <span>발주 도구</span>
      </WaflMobileFloatingActionButton>
    );

    return (
      <WaflMobileShell
        topBar={(
          <MobileTopBar
            companyName="WAFL"
            version={APP_VERSION}
            onOpen={() => setMobileOrderListDrawerOpen(true)}
            onOpenSettings={() => undefined}
            homeNavigation={MATERIAL_ORDER_MOBILE_HOME_NAVIGATION}
          />
        )}
        actionBar={actionBar}
        drawer={mobileOrderListDrawerOpen ? (
          <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog" aria-labelledby="material-order-mobile-drawer-title">
            <button
              type="button"
              aria-label="발주서 목록 드로어 닫기"
              className="absolute inset-0 bg-stone-950/45 pbp-overlay-enter"
              onClick={() => setMobileOrderListDrawerOpen(false)}
            />
            <div
              ref={mobileOrderListDrawerRef}
              tabIndex={-1}
              className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl focus:outline-none pbp-drawer-enter"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/95 px-3 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
                <div>
                  <div id="material-order-mobile-drawer-title" className="text-sm font-semibold leading-5 text-stone-900">발주서 목록</div>
                  <div className="text-[11px] text-stone-500">모바일 드로어</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOrderListDrawerOpen(false)}
                  className="pbp-touch-target pbp-interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                >
                  닫기
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <div className="min-h-[72dvh] min-w-0">{listPanel}</div>
              </div>
            </div>
          </div>
        ) : null}
        contentClassName="gap-3"
      >
        {statusToast}
        <WaflMobileContentSection>{detailPanel}</WaflMobileContentSection>
        <AppSheet
          open={mobileToolSheetOpen}
          onOpenChange={setMobileToolSheetOpen}
          title="발주 도구"
          side="bottom"
          size="full"
          contentClassName="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
        >
          <div className="space-y-3">
            <AppSegmentedTabs
              items={mobileToolTabs}
              value={mobileActiveTool}
              onChange={setMobileActiveTool}
              ariaLabel="원단·부자재 발주 보조 도구"
              itemClassName="text-xs"
            />
            {mobileActiveTool === "workorders" ? (
              <div className="min-h-[58dvh] min-w-0">{allocationPanel}</div>
            ) : null}
            {mobileActiveTool === "schedule" ? (
              <div className="min-h-[42dvh] rounded-3xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
                <p className="text-sm font-bold pbp-text-primary">PDF·납기</p>
                <p className="mt-2 text-xs leading-5 pbp-text-muted">PDF 생성과 납기 입력 액션은 후속 기능 연결 시 이 탭에 배치합니다.</p>
              </div>
            ) : null}
          </div>
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
