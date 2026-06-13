"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  calculateMaterialOrderDraftTotals,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftSelectionType,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  cancelMaterialOrder,
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
import { MATERIAL_ORDER_STATUS, type MaterialOrder, type MaterialOrderStatus, type MaterialOrderSupplier } from "@/lib/material-orders/types";
import {
  buildMaterialRequestQuantityMap,
  calculateMaterialRequestRemainingQuantity,
} from "@/features/material-orders/materialOrderPanelUtils";
import { shouldPersistMaterialOrderDetailBeforeStatusChange } from "@/lib/material-orders/statusFlow";
import type { WorkflowValidationIssue } from "@/lib/workorder/workflowValidationIssues";

type MaterialOrderStatusToastTone =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "loading";

type SelectedOrderDetailPayload = {
  materialOrderId: string;
  supplierPartnerId: string | null;
  note: string;
  dueDate: string | null;
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

function getMaterialOrderStatusValidationIssues({
  materialType,
  supplierPartnerId,
  lines,
  dueDate,
}: {
  materialType: MaterialOrderDraftSelectionType;
  supplierPartnerId: string | null;
  lines: MaterialOrderDraftLine[];
  dueDate: string;
}): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];

  if (!materialType) {
    issues.push({
      id: "missing_material_type",
      level: "blocking",
      message: "자재 종류를 선택한 뒤 진행해주세요.",
    });
  }

  if (!supplierPartnerId) {
    issues.push({
      id: "missing_supplier",
      level: "blocking",
      message: "공급처를 선택한 뒤 진행해주세요.",
    });
  }

  if (lines.length === 0) {
    issues.push({
      id: "missing_order_lines",
      level: "blocking",
      message: "발주 품목을 추가한 뒤 진행해주세요.",
    });
  }

  const hasInvalidQuantity = lines.some((line) => Number(line.orderQuantity) <= 0);
  if (hasInvalidQuantity) {
    issues.push({
      id: "invalid_order_quantity",
      level: "blocking",
      message: "수량이 0 이하인 발주 품목을 수정해주세요.",
    });
  }

  if (!dueDate) {
    issues.push({ id: "missing_due_date", level: "warning", message: "납기일이 입력되지 않았습니다. 필요하면 날짜를 선택한 뒤 진행해주세요." });
  }

  const hasZeroUnitPrice = lines.some((line) => Number(line.unitPrice) <= 0);
  if (hasZeroUnitPrice) {
    issues.push({
      id: "zero_unit_price",
      level: "warning",
      message: "단가가 0원인 발주 품목이 있습니다. 필요하면 단가를 입력한 뒤 진행해주세요.",
    });
  }

  return issues;
}

function createDraftLineFromMaterial(
  currentLineCount: number,
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
  material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  orderQuantity: number,
  allocatedQuantity = orderQuantity,
  unitPrice = material.unitCost ?? 0,
): MaterialOrderDraftLine {
  return {
    id: `draft-line-${Date.now()}-${currentLineCount + 1}`,
    itemName: material.itemName,
    unit: material.unit || "마",
    orderQuantity,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    sourceWorkOrderId: workOrder.id,
    sourceMaterialKey: material.key,
    allocations: [
      {
        workOrderId: workOrder.id,
        sourceMaterialKey: material.key,
        allocatedQuantity,
        allocationNote: "",
      },
    ],
  };
}

function mapSelectedOrderToDraftLines(
  selectedOrder: MaterialOrder,
): MaterialOrderDraftLine[] {
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
  const [statusToastMessage, setStatusToastMessage] = useState<string | null>(
    null,
  );
  const [statusToastTone, setStatusToastTone] =
    useState<MaterialOrderStatusToastTone>("info");
  const [statusToastEventKey, setStatusToastEventKey] = useState(0);
  const [workOrderCandidates, setWorkOrderCandidates] = useState<
    MaterialOrderWorkspaceWorkOrderCandidate[]
  >([]);
  const [suppliers, setSuppliers] = useState<MaterialOrderSupplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(true);
  const [workOrdersError, setWorkOrdersError] = useState<string | null>(null);
  const [materialType, setMaterialType] =
    useState<MaterialOrderDraftSelectionType>("");
  const [supplierPartnerId, setSupplierPartnerId] = useState<string | null>(
    null,
  );
  const [lines, setLines] = useState<MaterialOrderDraftLine[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [pendingLineAddition, setPendingLineAddition] = useState<{
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number];
    requiredQuantity: number;
    orderQuantity: number;
    unitPrice: number;
  } | null>(null);
  const [pendingStatusValidation, setPendingStatusValidation] = useState<{
    nextStatus: MaterialOrderStatus;
    issues: WorkflowValidationIssue[];
  } | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const totals = useMemo(
    () => calculateMaterialOrderDraftTotals(lines),
    [lines],
  );
  const selectedDraftOrderId =
    selectedOrder?.status === "draft" ? selectedOrder.id : null;
  const selectedDraftLines = useMemo(
    () => (selectedDraftOrderId ? lines : []),
    [lines, selectedDraftOrderId],
  );
  const materialRequestQuantityMap = useMemo(
    () =>
      buildMaterialRequestQuantityMap({
        orders,
        excludedOrderId: selectedDraftOrderId,
        draftLines: selectedDraftLines,
        quantityScope: "active",
      }),
    [orders, selectedDraftLines, selectedDraftOrderId],
  );
  const materialRequestCompletionMap = useMemo(
    () =>
      buildMaterialRequestQuantityMap({
        orders,
        excludedOrderId: selectedDraftOrderId,
        draftLines: selectedDraftLines,
        quantityScope: "completed",
      }),
    [orders, selectedDraftLines, selectedDraftOrderId],
  );
  const selectedDraftSupplierName = useMemo(
    () =>
      suppliers.find((supplier) => supplier.id === supplierPartnerId)?.name ??
      null,
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
        if (
          currentSelectedOrderId &&
          nextOrders.some((order) => order.id === currentSelectedOrderId)
        )
          return currentSelectedOrderId;
        return "";
      });
    } catch (error) {
      setOrdersError(
        toMaterialOrderWorkspaceError(
          error,
          "발주서 목록을 불러오지 못했습니다.",
        ),
      );
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
      setWorkOrdersError(
        toMaterialOrderWorkspaceError(
          error,
          "작업지시서 목록을 불러오지 못했습니다.",
        ),
      );
      setWorkOrderCandidates([]);
    } finally {
      setWorkOrdersLoading(false);
    }
  }, []);

  const refreshSuppliers = useCallback(
    async (nextMaterialType: MaterialOrderDraftSelectionType) => {
      setSuppliersError(null);

      if (!nextMaterialType) {
        setSuppliers([]);
        setSuppliersLoading(false);
        return;
      }

      setSuppliersLoading(true);

      try {
        setSuppliers(await fetchMaterialOrderSuppliers(nextMaterialType));
      } catch (error) {
        setSuppliersError(
          toMaterialOrderWorkspaceError(
            error,
            "공급처 목록을 불러오지 못했습니다.",
          ),
        );
        setSuppliers([]);
      } finally {
        setSuppliersLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refreshOrders();
    void refreshWorkOrderCandidates();
  }, [refreshOrders, refreshWorkOrderCandidates]);

  useEffect(() => {
    void refreshSuppliers(materialType);
  }, [materialType, refreshSuppliers]);

  useEffect(() => {
    if (!selectedOrder) {
      setMaterialType("");
      setSupplierPartnerId(null);
      setLines([]);
      setDueDate("");
      return;
    }

    setMaterialType(resolveMaterialOrderType(selectedOrder) ?? "");
    setSupplierPartnerId(selectedOrder.supplierPartnerId ?? null);
    setStatusToastMessage(null);
    setDueDate(selectedOrder.dueDate ?? "");
    setLines(mapSelectedOrderToDraftLines(selectedOrder));
  }, [selectedOrder]);

  const showStatusToast = useCallback(
    (message: string, tone: MaterialOrderStatusToastTone) => {
      setStatusToastMessage(message);
      setStatusToastTone(tone);
      setStatusToastEventKey((currentKey) => currentKey + 1);
    },
    [],
  );

  const createOrder = useCallback(async () => {
    setCreatingOrder(true);
    setOrdersError(null);

    try {
      const result = await createEmptyMaterialOrder();
      setOrders(result.materialOrders);
      setSelectedOrderId(
        result.materialOrder?.id ?? result.materialOrders[0]?.id ?? "",
      );
    } catch (error) {
      setOrdersError(
        toMaterialOrderWorkspaceError(error, "새 발주서를 만들지 못했습니다."),
      );
    } finally {
      setCreatingOrder(false);
    }
  }, []);

  const changeMaterialType = useCallback(
    (nextMaterialType: MaterialOrderDraftSelectionType) => {
      setMaterialType((currentMaterialType) => {
        if (currentMaterialType !== nextMaterialType) {
          setLines([]);
        }
        return nextMaterialType;
      });
      setSupplierPartnerId(null);
    },
    [],
  );

  const buildSelectedOrderDetailPayload =
    useCallback((): SelectedOrderDetailPayload | null => {
      if (!selectedOrder) return null;
      if (!materialType && lines.length > 0) return null;

      return {
        materialOrderId: selectedOrder.id,
        supplierPartnerId,
        note: selectedOrder.note ?? "",
        dueDate: dueDate || null,
        lines: lines.map((line) => ({
          itemName: line.itemName,
          itemType: (materialType || "fabric") as MaterialOrderDraftType,
          unit: line.unit,
          orderQuantity: line.orderQuantity,
          unitPrice: line.unitPrice,
          allocations: line.allocations.map((allocation) => ({
            workOrderId: allocation.workOrderId,
            sourceMaterialKey:
              allocation.sourceMaterialKey ?? line.sourceMaterialKey ?? null,
            allocatedQuantity: allocation.allocatedQuantity,
            allocationNote: allocation.allocationNote,
          })),
        })),
      };
    }, [dueDate, lines, materialType, selectedOrder, supplierPartnerId]);

  const applySelectedOrderStatusChange = useCallback(
    async (status: MaterialOrderStatus) => {
      if (!selectedOrder) return;

      setStatusChanging(true);
      showStatusToast("상태를 변경하는 중입니다.", "loading");

      try {
        let nextSelectedOrderId = selectedOrder.id;

        if (
          shouldPersistMaterialOrderDetailBeforeStatusChange(
            selectedOrder.status,
          )
        ) {
          const detailPayload = buildSelectedOrderDetailPayload();
          if (detailPayload) {
            const detailResult = await updateMaterialOrderDetail(detailPayload);
            nextSelectedOrderId =
              detailResult.materialOrder?.id ?? selectedOrder.id;
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
        showStatusToast(
          toMaterialOrderWorkspaceError(
            error,
            "발주서 상태를 변경하지 못했습니다.",
          ),
          "danger",
        );
      } finally {
        setStatusChanging(false);
      }
    },
    [
      buildSelectedOrderDetailPayload,
      refreshWorkOrderCandidates,
      selectedOrder,
      showStatusToast,
    ],
  );

  const changeSelectedOrderStatus = useCallback(
    (status: MaterialOrderStatus) => {
      if (!selectedOrder) return;

      if (selectedOrder.status === MATERIAL_ORDER_STATUS.draft) {
        const issues = getMaterialOrderStatusValidationIssues({
          materialType,
          supplierPartnerId,
          lines,
          dueDate,
        });
        if (issues.length > 0) {
          setPendingStatusValidation({ nextStatus: status, issues });
          return;
        }
      }

      void applySelectedOrderStatusChange(status);
    },
    [
      applySelectedOrderStatusChange,
      lines,
      materialType,
      selectedOrder,
      supplierPartnerId,
    ],
  );

  const closeMaterialOrderValidation = useCallback(() => {
    setPendingStatusValidation(null);
  }, []);

  const confirmMaterialOrderValidation = useCallback(() => {
    const pending = pendingStatusValidation;
    if (!pending) return;
    setPendingStatusValidation(null);
    void applySelectedOrderStatusChange(pending.nextStatus);
  }, [applySelectedOrderStatusChange, pendingStatusValidation]);

  const cancelOrder = useCallback(
    async (materialOrderId: string) => {
      const targetOrder = orders.find((order) => order.id === materialOrderId);
      if (!targetOrder || targetOrder.status !== "draft") return;

      setStatusChanging(true);
      showStatusToast("발주서를 삭제하는 중입니다.", "loading");

      try {
        const result = await cancelMaterialOrder({ materialOrderId });
        setOrders(result.materialOrders);
        setSelectedOrderId((currentSelectedOrderId) =>
          currentSelectedOrderId === materialOrderId ? "" : currentSelectedOrderId,
        );
        await refreshWorkOrderCandidates();
        showStatusToast("발주서를 삭제했습니다.", "success");
      } catch (error) {
        showStatusToast(
          toMaterialOrderWorkspaceError(error, "발주서를 삭제하지 못했습니다."),
          "danger",
        );
      } finally {
        setStatusChanging(false);
      }
    },
    [orders, refreshWorkOrderCandidates, showStatusToast],
  );

  const updateLine = useCallback(
    (lineId: string, patch: Partial<MaterialOrderDraftLine>) => {
      setLines((current) =>
        current.map((line) => {
          if (line.id !== lineId) return line;
          const nextLine = { ...line, ...patch };
          if (patch.orderQuantity == null || line.allocations.length === 0) return nextLine;

          const candidate = workOrderCandidates.find((item) => item.id === line.sourceWorkOrderId);
          const material = candidate?.materialItems.find((item) => item.key === line.sourceMaterialKey);
          const requiredQuantity = Number(material?.quantity ?? 0);
          if (!(requiredQuantity > 0)) return nextLine;

          let remainingAllocation = Math.min(Math.max(0, patch.orderQuantity), requiredQuantity);
          return {
            ...nextLine,
            allocations: line.allocations.map((allocation) => {
              const allocatedQuantity = Math.min(remainingAllocation, requiredQuantity);
              remainingAllocation = Math.max(0, remainingAllocation - allocatedQuantity);
              return { ...allocation, allocatedQuantity };
            }),
          };
        }),
      );
    },
    [workOrderCandidates],
  );

  const addWorkOrderMaterialLine = useCallback(
    (
      workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
      material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
    ) => {
      if (!selectedOrder || selectedOrder.status !== "draft") return;

      setLines((current) => {
        const existingLine = current.find(
          (line) =>
            line.sourceWorkOrderId === workOrder.id &&
            line.sourceMaterialKey === material.key,
        );

        if (existingLine) {
          return current.filter((line) => line.id !== existingLine.id);
        }

        const remainingQuantity = calculateMaterialRequestRemainingQuantity({
          quantityMap: materialRequestQuantityMap,
          workOrderId: workOrder.id,
          materialKey: material.key,
          requiredQuantity: material.quantity,
        });

        if (remainingQuantity <= 0) return current;

        setPendingLineAddition({
          workOrder,
          material,
          requiredQuantity: remainingQuantity,
          orderQuantity: remainingQuantity,
          unitPrice: Number.isFinite(material.unitCost ?? 0) ? (material.unitCost ?? 0) : 0,
        });
        return current;
      });
    },
    [materialRequestQuantityMap, selectedOrder],
  );

  const updatePendingLineAddition = useCallback((patch: Partial<{ orderQuantity: number; unitPrice: number }>) => {
    setPendingLineAddition((current) => current ? { ...current, ...patch } : current);
  }, []);

  const closePendingLineAddition = useCallback(() => setPendingLineAddition(null), []);

  const confirmPendingLineAddition = useCallback(() => {
    const pending = pendingLineAddition;
    if (!pending) return;

    const orderQuantity = Number.isFinite(pending.orderQuantity)
      ? Math.max(0, pending.orderQuantity)
      : 0;
    const unitPrice = Number.isFinite(pending.unitPrice)
      ? Math.max(0, pending.unitPrice)
      : 0;

    if (orderQuantity < 1) return;

    setLines((current) => [
      ...current,
      createDraftLineFromMaterial(
        current.length,
        pending.workOrder,
        pending.material,
        orderQuantity,
        Math.min(orderQuantity, pending.requiredQuantity),
        unitPrice,
      ),
    ]);
    setPendingLineAddition(null);
  }, [pendingLineAddition]);

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
    dueDate,
    totals,
    selectedDraftSupplierName,
    materialRequestQuantityMap,
    materialRequestCompletionMap,
    materialOrderLineAddModal: {
      open: pendingLineAddition !== null,
      itemName: pendingLineAddition?.material.itemName ?? "",
      unit: pendingLineAddition?.material.unit || "마",
      requiredQuantity: pendingLineAddition?.requiredQuantity ?? 0,
      orderQuantity: pendingLineAddition?.orderQuantity ?? 0,
      unitPrice: pendingLineAddition?.unitPrice ?? 0,
      onChange: updatePendingLineAddition,
      onClose: closePendingLineAddition,
      onConfirm: confirmPendingLineAddition,
    },
    materialOrderValidationModal: {
      open: pendingStatusValidation !== null,
      issues: pendingStatusValidation?.issues ?? [],
      title: "진행 전 확인이 필요합니다",
      description: pendingStatusValidation?.issues.some((issue) => issue.level === "blocking")
        ? "아래 항목은 먼저 수정해야 다음 단계로 진행할 수 있습니다."
        : "확인이 필요한 항목이 있습니다. 그대로 진행할 수 있지만 먼저 확인하는 것이 좋습니다.",
      blockingLabel: "진행 차단 항목",
      warningLabel: "확인 필요 항목",
      confirmLabel: "그대로 진행",
      fixLabel: "확인 후 수정",
      onClose: closeMaterialOrderValidation,
      onConfirm: confirmMaterialOrderValidation,
    },
    setSelectedOrderId,
    setSupplierPartnerId,
    setDueDate,
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
  };
}
