"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  calculateMaterialOrderDraftTotals,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
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
import type {
  MaterialOrder,
  MaterialOrderStatus,
  MaterialOrderSupplier,
} from "@/lib/material-orders/types";

type SelectedOrderDetailPayload = {
  materialOrderId: string;
  supplierPartnerId: string | null;
  note: string;
  lines: Array<{
    itemName: string;
    itemType: MaterialOrderDraftType;
    unit: string;
    orderQuantity: number;
    unitPrice: number;
    allocations: Array<{
      workOrderId: string;
      allocatedQuantity: number;
      allocationNote: string;
    }>;
  }>;
};

function createDraftLineFromMaterial(
  currentLineCount: number,
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
  material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
): MaterialOrderDraftLine {
  return {
    id: `draft-line-${Date.now()}-${currentLineCount + 1}`,
    itemName: material.itemName,
    unit: material.unit || "마",
    orderQuantity: material.quantity,
    unitPrice: Number.isFinite(material.unitCost ?? 0) ? material.unitCost ?? 0 : 0,
    sourceWorkOrderId: workOrder.id,
    sourceMaterialKey: material.key,
    allocations: [
      {
        workOrderId: workOrder.id,
        allocatedQuantity: material.quantity,
        allocationNote: "",
      },
    ],
  };
}

function mapSelectedOrderToDraftLines(selectedOrder: MaterialOrder): MaterialOrderDraftLine[] {
  return selectedOrder.lines.map((line) => ({
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
  }));
}

export function useMaterialOrderDraftEditor() {
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
  const [lines, setLines] = useState<MaterialOrderDraftLine[]>([]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const totals = useMemo(() => calculateMaterialOrderDraftTotals(lines), [lines]);
  const selectedDraftSupplierName = useMemo(
    () => suppliers.find((supplier) => supplier.id === supplierPartnerId)?.name ?? null,
    [supplierPartnerId, suppliers],
  );

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
      setLines([]);
      return;
    }

    setMaterialType(resolveMaterialOrderType(selectedOrder) ?? "fabric");
    setSupplierPartnerId(selectedOrder.supplierPartnerId ?? null);
    setStatusMessage(null);
    setLines(mapSelectedOrderToDraftLines(selectedOrder));
  }, [selectedOrder]);

  const createOrder = useCallback(async () => {
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
  }, []);

  const changeMaterialType = useCallback((nextMaterialType: MaterialOrderDraftType) => {
    setMaterialType(nextMaterialType);
    setSupplierPartnerId(null);
  }, []);

  const buildSelectedOrderDetailPayload = useCallback((): SelectedOrderDetailPayload | null => {
    if (!selectedOrder) return null;

    return {
      materialOrderId: selectedOrder.id,
      supplierPartnerId,
      note: selectedOrder.note ?? "",
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
  }, [lines, materialType, selectedOrder, supplierPartnerId]);

  const changeSelectedOrderStatus = useCallback(async (status: MaterialOrderStatus) => {
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
  }, [buildSelectedOrderDetailPayload, selectedOrder]);

  const updateLine = useCallback((lineId: string, patch: Partial<MaterialOrderDraftLine>) => {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }, []);

  const addWorkOrderMaterialLine = useCallback((
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => {
    if (!selectedOrder || selectedOrder.status !== "draft") return;

    setLines((current) => {
      const existingLine = current.find((line) => (
        line.sourceWorkOrderId === workOrder.id
        && line.sourceMaterialKey === material.key
      ));

      if (existingLine) return current;

      return [
        ...current,
        createDraftLineFromMaterial(current.length, workOrder, material),
      ];
    });
  }, [selectedOrder]);

  const removeLine = useCallback((lineId: string) => {
    setLines((current) => current.filter((line) => line.id !== lineId));
  }, []);

  return {
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
  };
}
