"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import {
  calculateMaterialOrderDraftTotals,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import { createMaterialOrderDraftLine } from "@/lib/material-orders/materialOrderDraftWorkspace";
import {
  createEmptyMaterialOrder,
  fetchAllocationCandidateWorkOrders,
  fetchMaterialOrders,
  resolveMaterialOrderType,
  toMaterialOrderWorkspaceError,
  type MaterialOrderWorkspaceWorkOrderCandidate,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder } from "@/lib/material-orders/types";
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
  const [workOrderCandidates, setWorkOrderCandidates] = useState<MaterialOrderWorkspaceWorkOrderCandidate[]>([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(true);
  const [workOrdersError, setWorkOrdersError] = useState<string | null>(null);
  const [materialType, setMaterialType] = useState<MaterialOrderDraftType>("fabric");
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

  useEffect(() => {
    void refreshOrders();
    void refreshWorkOrderCandidates();
  }, [refreshOrders, refreshWorkOrderCandidates]);

  useEffect(() => {
    if (!selectedOrder) {
      setMaterialType("fabric");
      setDestinationMemo("");
      setOrderNote("");
      setLines([]);
      return;
    }

    setMaterialType(resolveMaterialOrderType(selectedOrder) ?? "fabric");
    setDestinationMemo("");
    setOrderNote(selectedOrder.note ?? "");
    setLines(selectedOrder.lines.map((line) => ({
      id: line.id,
      itemName: line.itemName,
      unit: line.unit,
      orderQuantity: line.orderQuantity,
      unitPrice: line.unitPrice,
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

  function updateLine(lineId: string, patch: Partial<MaterialOrderDraftLine>) {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, createMaterialOrderDraftLine(current.length + 1)]);
  }

  function removeLine(lineId: string) {
    setLines((current) => current.filter((line) => line.id !== lineId));
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
          destinationMemo={destinationMemo}
          orderNote={orderNote}
          lines={lines}
          totals={totals}
          onChangeMaterialType={setMaterialType}
          onChangeDestinationMemo={setDestinationMemo}
          onChangeOrderNote={setOrderNote}
          onChangeLine={updateLine}
          onAddLine={addLine}
          onRemoveLine={removeLine}
        />
        <MaterialOrderAllocationPanel
          guideItems={guideItems}
          candidates={workOrderCandidates}
          loading={workOrdersLoading}
          errorMessage={workOrdersError}
          onRetry={() => void refreshWorkOrderCandidates()}
        />
      </div>
    </div>
  );
}
