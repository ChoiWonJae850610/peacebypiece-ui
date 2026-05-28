"use client";

import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";

const MATERIAL_ORDER_PANEL_GRID_STYLE = {
  gridTemplateColumns: "minmax(220px, 0.7fr) minmax(640px, 1fr) minmax(220px, 0.7fr)",
} as const;

export default function MaterialOrderDraftEditor() {
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

  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
      <div
        className="grid h-full min-h-0 min-w-[1080px] gap-3"
        style={MATERIAL_ORDER_PANEL_GRID_STYLE}
      >
        <MaterialOrderListPanel
          orders={orders}
          selectedOrderId={selectedOrderId}
          loading={ordersLoading}
          errorMessage={ordersError}
          creating={creatingOrder}
          onSelectOrder={setSelectedOrderId}
          onCreateOrder={createOrder}
          onRetry={() => void refreshOrders()}
          selectedDraftMaterialType={materialType}
          selectedDraftSupplierName={selectedDraftSupplierName}
          selectedDraftLines={lines}
        />
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
        <MaterialOrderAllocationPanel
          candidates={workOrderCandidates}
          lines={lines}
          materialRequestQuantityMap={materialRequestQuantityMap}
          editable={selectedOrder?.status === "draft"}
          loading={workOrdersLoading}
          errorMessage={workOrdersError}
          onAddMaterialToOrder={addWorkOrderMaterialLine}
          onRetry={() => void refreshWorkOrderCandidates()}
        />
      </div>
    </div>
  );
}
