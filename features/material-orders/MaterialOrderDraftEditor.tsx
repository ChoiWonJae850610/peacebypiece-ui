"use client";

import { useEffect, useState } from "react";

import AppButton from "@/components/common/ui/AppButton";
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
  { key: "detail", label: "상세" },
  { key: "materials", label: "자재" },
];

const MATERIAL_ORDER_TABLET_TABS: Array<{ key: Exclude<MaterialOrderPanelKey, "orders">; label: string }> = [
  { key: "detail", label: "발주 상세" },
  { key: "materials", label: "자재 선택" },
];

export default function MaterialOrderDraftEditor() {
  const deviceType = useResponsiveDeviceType();
  const [mobilePanel, setMobilePanel] = useState<MaterialOrderPanelKey>("orders");
  const [tabletPanel, setTabletPanel] = useState<Exclude<MaterialOrderPanelKey, "orders">>("detail");

  const {
    orders,
    selectedOrderId,
    selectedOrder,
    ordersLoading,
    ordersError,
    creatingOrder,
    statusChanging,
    statusMessage,
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
      setTabletPanel("detail");
    }
  }, [selectedOrderId]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setMobilePanel("detail");
    setTabletPanel("detail");
  };

  const mobilePanelTabs = (
    <div className="sticky top-0 z-10 -mx-1 mb-3 flex gap-2 bg-[var(--pbp-surface)]/95 px-1 py-2 backdrop-blur">
      {MATERIAL_ORDER_PANEL_TABS.map((tab) => (
        <AppButton
          key={tab.key}
          variant={mobilePanel === tab.key ? "primary" : "secondary"}
          size="sm"
          width="full"
          onClick={() => setMobilePanel(tab.key)}
        >
          {tab.label}
        </AppButton>
      ))}
    </div>
  );

  const tabletPanelTabs = (
    <div className="mb-3 grid grid-cols-2 gap-2">
      {MATERIAL_ORDER_TABLET_TABS.map((tab) => (
        <AppButton
          key={tab.key}
          variant={tabletPanel === tab.key ? "primary" : "secondary"}
          size="sm"
          width="full"
          onClick={() => setTabletPanel(tab.key)}
        >
          {tab.label}
        </AppButton>
      ))}
    </div>
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
      statusMessage={statusMessage}
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
      <div className="min-h-0 flex-1 overflow-y-auto pb-1">
        {mobilePanelTabs}
        <div className="min-h-0 min-w-0">
          {mobilePanel === "orders" ? <section className="min-h-[520px] min-w-0">{listPanel}</section> : null}
          {mobilePanel === "detail" ? <section className="min-h-[620px] min-w-0">{detailPanel}</section> : null}
          {mobilePanel === "materials" ? <section className="min-h-[620px] min-w-0">{allocationPanel}</section> : null}
        </div>
      </div>
    );
  }

  if (deviceType === "tablet") {
    return (
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-1">
        <div className="grid min-h-0 min-w-0 gap-3" style={MATERIAL_ORDER_TABLET_GRID_STYLE}>
          <section className="min-h-[680px] min-w-0">{listPanel}</section>
          <div className="min-w-0">
            {tabletPanelTabs}
            {tabletPanel === "detail" ? <section className="min-h-[680px] min-w-0">{detailPanel}</section> : null}
            {tabletPanel === "materials" ? <section className="min-h-[680px] min-w-0">{allocationPanel}</section> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
      <div
        className="grid h-full min-h-0 min-w-[1080px] gap-3"
        style={MATERIAL_ORDER_PANEL_GRID_STYLE}
      >
        {listPanel}
        {detailPanel}
        {allocationPanel}
      </div>
    </div>
  );
}
