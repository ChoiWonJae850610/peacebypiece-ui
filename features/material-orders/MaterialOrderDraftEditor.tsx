"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import {
  calculateMaterialOrderDraftTotals,
  type MaterialOrderDraftAllocation,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import { createMaterialOrderDraftLine } from "@/lib/material-orders/materialOrderDraftWorkspace";
import {
  createEmptyMaterialOrder,
  fetchAllocationCandidateWorkOrders,
  fetchMaterialOrderSuppliers,
  fetchMaterialOrders,
  resolveMaterialOrderType,
  toMaterialOrderWorkspaceError,
  updateMaterialOrderDetail,
  updateMaterialOrderStatus,
  type MaterialOrderWorkspaceWorkOrderCandidate,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder, MaterialOrderStatus, MaterialOrderSupplier } from "@/lib/material-orders/types";
import type { MaterialOrderDraftGuideItem } from "@/lib/material-orders/materialOrderWorkspaceViewModel";

type MaterialOrderDraftEditorProps = {
  guideItems: MaterialOrderDraftGuideItem[];
};

const MATERIAL_ORDER_PANEL_GRID_STYLE = {
  gridTemplateColumns: "minmax(220px, 0.7fr) minmax(640px, 1fr) minmax(220px, 0.7fr)",
} as const;

export default function MaterialOrderDraftEditor({ guideItems }: MaterialOrderDraftEditorProps) {
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [workOrderCandidates, setWorkOrderCandidates] = useState<MaterialOrderWorkspaceWorkOrderCandidate[]>([]);
  const [suppliers, setSuppliers] = useState<MaterialOrderSupplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(true);
  const [workOrdersError, setWorkOrdersError] = useState<string | null>(null);
  const [materialType, setMaterialType] = useState<MaterialOrderDraftType>("fabric");
  const [supplierPartnerId, setSupplierPartnerId] = useState<string | null>(null);
  const [destinationMemo, setDestinationMemo] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [lines, setLines] = useState<MaterialOrderDraftLine[]>([]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const totals = useMemo(() => calculateMaterialOrderDraftTotals(lines), [lines]);

  const refreshOrders = useCallback(async (nextSelectedOrderId?: string) => {
    setOrdersLoading(true);
    setOrdersError(null);

    try {
      const nextOrders = await fetchMaterialOrders();
      setOrders(nextOrders);
      setSelectedOrderId((currentSelectedOrderId) => {
        if (nextSelectedOrderId) return nextSelectedOrderId;
        if (nextOrders.some((order) => order.id === currentSelectedOrderId)) return currentSelectedOrderId;
        return nextOrders[0]?.id ?? "";
      });
    } catch (error) {
      setOrdersError(toMaterialOrderWorkspaceError(error, "발주서 목록을 불러오지 못했습니다."));
      setOrders([]);
      setSelectedOrderId("");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const refreshWorkOrderCandidates = useCallback(async () => {
    setWorkOrdersLoading(true);
    setWorkOrdersError(null);

    try {
      setWorkOrderCandidates(await fetchAllocationCandidateWorkOrders());
    } catch (error) {
      setWorkOrdersError(toMaterialOrderWorkspaceError(error, "작업지시서 목록을 불러오지 못했습니다."));
      setWorkOrderCandidates([]);
    } finally {
      setWorkOrdersLoading(false);
    }
  }, []);

  const refreshSuppliers = useCallback(async (nextMaterialType: MaterialOrderDraftType) => {
    setSuppliersLoading(true);
    setSuppliersError(null);

    try {
      setSuppliers(await fetchMaterialOrderSuppliers(nextMaterialType));
    } catch (error) {
      setSuppliersError(toMaterialOrderWorkspaceError(error, "공급처 목록을 불러오지 못했습니다."));
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshOrders();
    void refreshWorkOrderCandidates();
  }, [refreshOrders, refreshWorkOrderCandidates]);

  useEffect(() => {
    void refreshSuppliers(materialType);
  }, [materialType, refreshSuppliers]);

  useEffect(() => {
    if (!selectedOrder) {
      setMaterialType("fabric");
      setSupplierPartnerId(null);
      setDestinationMemo("");
      setOrderNote("");
      setLines([]);
      return;
    }

    setMaterialType(resolveMaterialOrderType(selectedOrder) ?? "fabric");
    setSupplierPartnerId(selectedOrder.supplierPartnerId ?? null);
    setStatusMessage(null);
    setDestinationMemo("");
    setOrderNote(selectedOrder.note ?? "");
    setLines(selectedOrder.lines.map((line) => ({
      id: line.id,
      itemName: line.itemName,
      unit: line.unit,
      orderQuantity: line.orderQuantity,
      unitPrice: line.unitPrice,
      allocations: line.allocations.map((allocation) => ({
        workOrderId: allocation.workOrderId,
        allocatedQuantity: allocation.allocatedQuantity,
        allocationNote: allocation.allocationNote ?? "",
      })),
    })));
  }, [selectedOrder]);

  async function createOrder() {
    setCreatingOrder(true);
    setOrdersError(null);

    try {
      const result = await createEmptyMaterialOrder();
      setOrders(result.materialOrders);
      setSelectedOrderId(result.materialOrder?.id ?? result.materialOrders[0]?.id ?? "");
    } catch (error) {
      setOrdersError(toMaterialOrderWorkspaceError(error, "새 발주서를 만들지 못했습니다."));
    } finally {
      setCreatingOrder(false);
    }
  }


  function changeMaterialType(nextMaterialType: MaterialOrderDraftType) {
    setMaterialType(nextMaterialType);
    setSupplierPartnerId(null);
  }

  function buildSelectedOrderDetailPayload() {
    if (!selectedOrder) return null;

    return {
      materialOrderId: selectedOrder.id,
      supplierPartnerId,
      note: orderNote,
      lines: lines.map((line) => ({
        itemName: line.itemName,
        itemType: materialType,
        unit: line.unit,
        orderQuantity: line.orderQuantity,
        unitPrice: line.unitPrice,
        allocations: line.allocations.map((allocation) => ({
          workOrderId: allocation.workOrderId,
          allocatedQuantity: allocation.allocatedQuantity,
          allocationNote: allocation.allocationNote,
        })),
      })),
    };
  }


  async function changeSelectedOrderStatus(status: MaterialOrderStatus) {
    if (!selectedOrder) return;

    setStatusChanging(true);
    setStatusMessage(null);

    try {
      let nextSelectedOrderId = selectedOrder.id;

      if (selectedOrder.status === "draft") {
        const detailPayload = buildSelectedOrderDetailPayload();
        if (detailPayload) {
          const detailResult = await updateMaterialOrderDetail(detailPayload);
          nextSelectedOrderId = detailResult.materialOrder?.id ?? selectedOrder.id;
          setOrders(detailResult.materialOrders);
        }
      }

      const result = await updateMaterialOrderStatus({
        materialOrderId: nextSelectedOrderId,
        status,
      });

      setOrders(result.materialOrders);
      setSelectedOrderId(result.materialOrder?.id ?? nextSelectedOrderId);
      setStatusMessage("상태가 변경되었습니다.");
    } catch (error) {
      setStatusMessage(toMaterialOrderWorkspaceError(error, "발주서 상태를 변경하지 못했습니다."));
    } finally {
      setStatusChanging(false);
    }
  }

  function updateLine(lineId: string, patch: Partial<MaterialOrderDraftLine>) {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, createMaterialOrderDraftLine(current.length + 1)]);
  }

  function removeLine(lineId: string) {
    setLines((current) => current.filter((line) => line.id !== lineId));
  }

  function updateLineAllocation(lineId: string, workOrderId: string, patch: Partial<MaterialOrderDraftAllocation>) {
    setLines((current) => current.map((line) => {
      if (line.id !== lineId) return line;

      const existingAllocation = line.allocations.find((allocation) => allocation.workOrderId === workOrderId);
      const nextAllocations = existingAllocation
        ? line.allocations.map((allocation) => (
            allocation.workOrderId === workOrderId ? { ...allocation, ...patch } : allocation
          ))
        : [
            ...line.allocations,
            {
              workOrderId,
              allocatedQuantity: 0,
              allocationNote: "",
              ...patch,
            },
          ];

      return { ...line, allocations: nextAllocations };
    }));
  }

  function removeLineAllocation(lineId: string, workOrderId: string) {
    setLines((current) => current.map((line) => (
      line.id === lineId
        ? { ...line, allocations: line.allocations.filter((allocation) => allocation.workOrderId !== workOrderId) }
        : line
    )));
  }

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
        />
        <MaterialOrderDetailPanel
          selectedOrder={selectedOrder}
          materialType={materialType}
          supplierPartnerId={supplierPartnerId}
          suppliers={suppliers}
          suppliersLoading={suppliersLoading}
          suppliersError={suppliersError}
          destinationMemo={destinationMemo}
          orderNote={orderNote}
          lines={lines}
          totals={totals}
          onChangeMaterialType={changeMaterialType}
          onChangeSupplierPartnerId={setSupplierPartnerId}
          onRetrySuppliers={() => void refreshSuppliers(materialType)}
          onChangeDestinationMemo={setDestinationMemo}
          onChangeOrderNote={setOrderNote}
          statusChanging={statusChanging}
          statusMessage={statusMessage}
          onChangeLine={updateLine}
          onAddLine={addLine}
          onRemoveLine={removeLine}
          onChangeStatus={(status) => void changeSelectedOrderStatus(status)}
        />
        <MaterialOrderAllocationPanel
          guideItems={guideItems}
          candidates={workOrderCandidates}
          lines={lines}
          editable={selectedOrder?.status === "draft"}
          loading={workOrdersLoading}
          errorMessage={workOrdersError}
          onChangeAllocation={updateLineAllocation}
          onRemoveAllocation={removeLineAllocation}
          onRetry={() => void refreshWorkOrderCandidates()}
        />
      </div>
    </div>
  );
}
