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
import {
  buildMaterialRequestQuantityMap,
  calculateMaterialRequestRemainingQuantity,
} from "@/features/material-orders/materialOrderPanelUtils";
import { shouldPersistMaterialOrderDetailBeforeStatusChange } from "@/lib/material-orders/statusFlow";

type MaterialOrderStatusToastTone = "info" | "success" | "warning" | "danger" | "loading";

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
      sourceMaterialKey: string | null;
      allocatedQuantity: number;
      allocationNote: string;
    }>;
  }>;
};

function createDraftLineFromMaterial(
  currentLineCount: number,
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
  material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  orderQuantity: number,
): MaterialOrderDraftLine {
  return {
    id: `draft-line-${Date.now()}-${currentLineCount + 1}`,
    itemName: material.itemName,
    unit: material.unit || "마",
    orderQuantity,
    unitPrice: Number.isFinite(material.unitCost ?? 0) ? material.unitCost ?? 0 : 0,
    sourceWorkOrderId: workOrder.id,
    sourceMaterialKey: material.key,
    allocations: [
      {
        workOrderId: workOrder.id,
        sourceMaterialKey: material.key,
        allocatedQuantity: orderQuantity,
        allocationNote: "",
      },
    ],
  };
}

function mapSelectedOrderToDraftLines(selectedOrder: MaterialOrder): MaterialOrderDraftLine[] {
  return selectedOrder.lines.map((line) => {
    const primaryAllocation = line.allocations[0] ?? null;

    return {
    id: line.id,
    itemName: line.itemName,
    unit: line.unit,
    orderQuantity: line.orderQuantity,
    unitPrice: line.unitPrice,
    sourceWorkOrderId: primaryAllocation?.workOrderId,
    sourceMaterialKey: primaryAllocation?.sourceMaterialKey ?? undefined,
    allocations: line.allocations.map((allocation) => ({
      workOrderId: allocation.workOrderId,
      sourceMaterialKey: allocation.sourceMaterialKey,
      allocatedQuantity: allocation.allocatedQuantity,
      allocationNote: allocation.allocationNote ?? "",
    })),
  };
  });
}

export function useMaterialOrderDraftEditor() {
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [statusToastMessage, setStatusToastMessage] = useState<string | null>(null);
  const [statusToastTone, setStatusToastTone] = useState<MaterialOrderStatusToastTone>("info");
  const [statusToastEventKey, setStatusToastEventKey] = useState(0);
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
  const materialRequestQuantityMap = useMemo(() => buildMaterialRequestQuantityMap({
    orders,
    excludedOrderId: selectedOrder?.id,
    draftLines: lines,
    quantityScope: "active",
  }), [lines, orders, selectedOrder?.id]);
  const materialRequestCompletionMap = useMemo(() => buildMaterialRequestQuantityMap({
    orders,
    excludedOrderId: selectedOrder?.id,
    draftLines: lines,
    quantityScope: "completed",
  }), [lines, orders, selectedOrder?.id]);
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
    setStatusToastMessage(null);
    setLines(mapSelectedOrderToDraftLines(selectedOrder));
  }, [selectedOrder]);

  const showStatusToast = useCallback((message: string, tone: MaterialOrderStatusToastTone) => {
    setStatusToastMessage(message);
    setStatusToastTone(tone);
    setStatusToastEventKey((currentKey) => currentKey + 1);
  }, []);

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
          sourceMaterialKey: allocation.sourceMaterialKey ?? line.sourceMaterialKey ?? null,
          allocatedQuantity: allocation.allocatedQuantity,
          allocationNote: allocation.allocationNote,
        })),
      })),
    };
  }, [lines, materialType, selectedOrder, supplierPartnerId]);

  const changeSelectedOrderStatus = useCallback(async (status: MaterialOrderStatus) => {
    if (!selectedOrder) return;

    setStatusChanging(true);
    showStatusToast("상태를 변경하는 중입니다.", "loading");

    try {
      let nextSelectedOrderId = selectedOrder.id;

      if (shouldPersistMaterialOrderDetailBeforeStatusChange(selectedOrder.status)) {
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
      await refreshWorkOrderCandidates();
      showStatusToast("상태가 변경되었습니다.", "success");
    } catch (error) {
      showStatusToast(toMaterialOrderWorkspaceError(error, "발주서 상태를 변경하지 못했습니다."), "danger");
    } finally {
      setStatusChanging(false);
    }
  }, [buildSelectedOrderDetailPayload, refreshWorkOrderCandidates, selectedOrder, showStatusToast]);

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

      const remainingQuantity = calculateMaterialRequestRemainingQuantity({
        quantityMap: materialRequestQuantityMap,
        workOrderId: workOrder.id,
        materialKey: material.key,
        requiredQuantity: material.quantity,
      });

      if (remainingQuantity <= 0) return current;

      return [
        ...current,
        createDraftLineFromMaterial(current.length, workOrder, material, remainingQuantity),
      ];
    });
  }, [materialRequestQuantityMap, selectedOrder]);

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
  };
}
