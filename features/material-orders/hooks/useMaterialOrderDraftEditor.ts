"use client";

import { normalizePbpLocalDateValue } from "@/lib/date/localDate";
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
  updateMaterialOrderHeader,
  updateMaterialOrderStatus,
  type MaterialOrderWorkspaceWorkOrderCandidate,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import {
  MATERIAL_ORDER_STATUS,
  type MaterialOrder,
  type MaterialOrderStatus,
  type MaterialOrderSupplier,
} from "@/lib/material-orders/types";
import {
  buildMaterialRequestQuantityMap,
  calculateMaterialRequestRemainingQuantity,
} from "@/features/material-orders/materialOrderPanelUtils";
import {
  canEditMaterialOrderCoreFields,
  shouldPersistMaterialOrderDetailBeforeStatusChange,
} from "@/lib/material-orders/statusFlow";
import {
  createDraftLineFromMaterial,
  getMaterialOrderStatusValidationIssues,
  mapSelectedOrderToDraftLines,
  applyMaterialOrderPatchResult,
  type PendingMaterialOrderStatusValidation,
  type SelectedOrderDetailPayload,
} from "@/features/material-orders/hooks/materialOrderDraftEditorUtils";
import {
  WAFL_CHANGE_TARGET,
  getWaflChangeFeedbackMessage,
} from "@/components/common/ui";
import { useMaterialOrderFeedback } from "@/features/material-orders/hooks/useMaterialOrderFeedback";

export function useMaterialOrderDraftEditor({ isAdmin }: { isAdmin: boolean }) {
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [headerSaving, setHeaderSaving] = useState(false);
  const {
    operation: statusToastOperation,
    isLocked: materialOrderMutationLocked,
    isLockActive: isMaterialOrderLockActive,
    clearOperationToast: clearStatusToast,
    runChangeOperation,
    runMutation: runMaterialOrderMutation,
  } = useMaterialOrderFeedback();

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
  const [pendingMaterialTypeChange, setPendingMaterialTypeChange] =
    useState<MaterialOrderDraftSelectionType | null>(null);
  const [pendingStatusValidation, setPendingStatusValidation] =
    useState<PendingMaterialOrderStatusValidation | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const totals = useMemo(
    () => calculateMaterialOrderDraftTotals(lines),
    [lines],
  );
  const selectedDraftOrderId =
    selectedOrder &&
    canEditMaterialOrderCoreFields(selectedOrder.status, isAdmin)
      ? selectedOrder.id
      : null;
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
    clearStatusToast();
    setDueDate(normalizePbpLocalDateValue(selectedOrder.dueDate));
    setLines(mapSelectedOrderToDraftLines(selectedOrder));
  }, [clearStatusToast, selectedOrder]);

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

  const persistMaterialTypeChange = useCallback(
    async (nextMaterialType: MaterialOrderDraftSelectionType) => {
      if (
        !selectedOrder ||
        !canEditMaterialOrderCoreFields(selectedOrder.status, isAdmin) ||
        !nextMaterialType
      ) {
        return;
      }

      const previousMaterialType = materialType;
      const previousSupplierPartnerId = supplierPartnerId;
      const previousLines = lines;
      const lockKey = `material-order:${selectedOrder.id}`;
      if (isMaterialOrderLockActive(lockKey)) return;

      setHeaderSaving(true);
      setMaterialType(nextMaterialType);
      setSupplierPartnerId(null);
      setLines([]);
      setPendingLineAddition(null);

      try {
        await runChangeOperation(
          WAFL_CHANGE_TARGET.materialOrderMaterialType,
          `${lockKey}:material-type`,
          async () => {
            const result = await updateMaterialOrderHeader({
              materialOrderId: selectedOrder.id,
              materialType: nextMaterialType,
              supplierPartnerId: null,
            });
            setOrders((current) =>
              applyMaterialOrderPatchResult(current, result.result),
            );
            setSelectedOrderId(result.result.resourceId);
            await refreshWorkOrderCandidates();
            return result;
          },
          lockKey,
          {
            rollback: () => {
              setMaterialType(previousMaterialType);
              setSupplierPartnerId(previousSupplierPartnerId);
              setLines(previousLines);
            },
            getErrorMessage: (error) =>
              toMaterialOrderWorkspaceError(
                error,
                getWaflChangeFeedbackMessage(
                  WAFL_CHANGE_TARGET.materialOrderMaterialType,
                  "error",
                ),
              ),
          },
        );
      } finally {
        setHeaderSaving(false);
      }
    },
    [
      lines,
      materialType,
      refreshWorkOrderCandidates,
      isMaterialOrderLockActive,
      runChangeOperation,
      selectedOrder,
      supplierPartnerId,
      isAdmin,
    ],
  );

  const changeMaterialType = useCallback(
    (nextMaterialType: MaterialOrderDraftSelectionType) => {
      if (materialOrderMutationLocked) return;
      if (!nextMaterialType || nextMaterialType === materialType) return;

      if (lines.length > 0 || supplierPartnerId) {
        setPendingMaterialTypeChange(nextMaterialType);
        return;
      }

      void persistMaterialTypeChange(nextMaterialType);
    },
    [
      lines.length,
      materialOrderMutationLocked,
      materialType,
      persistMaterialTypeChange,
      supplierPartnerId,
    ],
  );

  const closeMaterialTypeChangeConfirmation = useCallback(() => {
    setPendingMaterialTypeChange(null);
  }, []);

  const confirmMaterialTypeChange = useCallback(() => {
    if (materialOrderMutationLocked) return;
    const nextMaterialType = pendingMaterialTypeChange;
    if (!nextMaterialType) return;
    setPendingMaterialTypeChange(null);
    void persistMaterialTypeChange(nextMaterialType);
  }, [
    materialOrderMutationLocked,
    pendingMaterialTypeChange,
    persistMaterialTypeChange,
  ]);

  const changeSupplierPartnerId = useCallback(
    async (nextSupplierPartnerId: string | null) => {
      if (
        !selectedOrder ||
        !canEditMaterialOrderCoreFields(selectedOrder.status, isAdmin)
      ) {
        return;
      }

      const previousSupplierPartnerId = supplierPartnerId;
      const lockKey = `material-order:${selectedOrder.id}`;
      if (isMaterialOrderLockActive(lockKey)) return;
      setSupplierPartnerId(nextSupplierPartnerId);
      setHeaderSaving(true);

      try {
        await runChangeOperation(
          WAFL_CHANGE_TARGET.materialOrderSupplier,
          `${lockKey}:supplier`,
          async () => {
            const result = await updateMaterialOrderHeader({
              materialOrderId: selectedOrder.id,
              supplierPartnerId: nextSupplierPartnerId,
            });
            setOrders((current) =>
              applyMaterialOrderPatchResult(current, result.result),
            );
            setSelectedOrderId(result.result.resourceId);
            return result;
          },
          lockKey,
          {
            rollback: () => setSupplierPartnerId(previousSupplierPartnerId),
            getErrorMessage: (error) =>
              toMaterialOrderWorkspaceError(
                error,
                getWaflChangeFeedbackMessage(
                  WAFL_CHANGE_TARGET.materialOrderSupplier,
                  "error",
                ),
              ),
          },
        );
      } finally {
        setHeaderSaving(false);
      }
    },
    [
      isAdmin,
      isMaterialOrderLockActive,
      runChangeOperation,
      selectedOrder,
      supplierPartnerId,
    ],
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

  const changeDueDate = useCallback(
    async (nextDueDate: string) => {
      const normalizedDueDate = normalizePbpLocalDateValue(nextDueDate);
      if (
        !selectedOrder ||
        !canEditMaterialOrderCoreFields(selectedOrder.status, isAdmin)
      ) {
        return;
      }

      const previousDueDate = dueDate;
      const lockKey = `material-order:${selectedOrder.id}`;
      if (isMaterialOrderLockActive(lockKey)) return;
      setDueDate(normalizedDueDate);
      setHeaderSaving(true);

      try {
        await runChangeOperation(
          WAFL_CHANGE_TARGET.materialOrderDueDate,
          `${lockKey}:due-date`,
          async () => {
            const result = await updateMaterialOrderHeader({
              materialOrderId: selectedOrder.id,
              dueDate: normalizedDueDate || null,
            });
            setOrders((current) =>
              applyMaterialOrderPatchResult(current, result.result),
            );
            setSelectedOrderId(result.result.resourceId);
            return result;
          },
          lockKey,
          {
            rollback: () => setDueDate(previousDueDate),
            getErrorMessage: (error) =>
              toMaterialOrderWorkspaceError(
                error,
                getWaflChangeFeedbackMessage(
                  WAFL_CHANGE_TARGET.materialOrderDueDate,
                  "error",
                ),
              ),
          },
        );
      } finally {
        setHeaderSaving(false);
      }
    },
    [
      dueDate,
      isAdmin,
      isMaterialOrderLockActive,
      runChangeOperation,
      selectedOrder,
    ],
  );

  const applySelectedOrderStatusChange = useCallback(
    async (status: MaterialOrderStatus) => {
      if (!selectedOrder) return;

      const lockKey = `material-order:${selectedOrder.id}`;
      if (isMaterialOrderLockActive(lockKey)) return;
      setStatusChanging(true);

      try {
        await runChangeOperation(
          WAFL_CHANGE_TARGET.materialOrderStatus,
          `${lockKey}:status`,
          async () => {
            let nextSelectedOrderId = selectedOrder.id;

            if (
              shouldPersistMaterialOrderDetailBeforeStatusChange(
                selectedOrder.status,
              )
            ) {
              const detailPayload = buildSelectedOrderDetailPayload();
              if (detailPayload) {
                const detailResult =
                  await updateMaterialOrderDetail(detailPayload);
                nextSelectedOrderId = detailResult.result.resourceId;
                setOrders((current) =>
                  applyMaterialOrderPatchResult(current, detailResult.result),
                );
              }
            }

            const result = await updateMaterialOrderStatus({
              materialOrderId: nextSelectedOrderId,
              status,
            });

            setOrders((current) =>
              applyMaterialOrderPatchResult(current, result.result),
            );
            setSelectedOrderId(result.result.resourceId);
            await refreshWorkOrderCandidates();
            return result;
          },
          lockKey,
          {
            getErrorMessage: (error) =>
              toMaterialOrderWorkspaceError(
                error,
                getWaflChangeFeedbackMessage(
                  WAFL_CHANGE_TARGET.materialOrderStatus,
                  "error",
                ),
              ),
          },
        );
      } finally {
        setStatusChanging(false);
      }
    },
    [
      buildSelectedOrderDetailPayload,
      refreshWorkOrderCandidates,
      isMaterialOrderLockActive,
      runChangeOperation,
      selectedOrder,
    ],
  );

  const changeSelectedOrderStatus = useCallback(
    (status: MaterialOrderStatus) => {
      if (materialOrderMutationLocked || !selectedOrder) return;

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
      materialOrderMutationLocked,
      materialType,
      selectedOrder,
      supplierPartnerId,
    ],
  );

  const closeMaterialOrderValidation = useCallback(() => {
    setPendingStatusValidation(null);
  }, []);

  const confirmMaterialOrderValidation = useCallback(() => {
    if (materialOrderMutationLocked) return;
    const pending = pendingStatusValidation;
    if (!pending) return;
    setPendingStatusValidation(null);
    void applySelectedOrderStatusChange(pending.nextStatus);
  }, [
    applySelectedOrderStatusChange,
    materialOrderMutationLocked,
    pendingStatusValidation,
  ]);

  const cancelOrder = useCallback(
    async (materialOrderId: string) => {
      const targetOrder = orders.find((order) => order.id === materialOrderId);
      if (!targetOrder || targetOrder.status !== MATERIAL_ORDER_STATUS.draft)
        return;

      const lockKey = `material-order:${materialOrderId}`;
      if (isMaterialOrderLockActive(lockKey)) return;
      const previousOrders = orders;
      const previousSelectedOrderId = selectedOrderId;
      setStatusChanging(true);

      try {
        await runMaterialOrderMutation({
          lockKey,
          operationId: `${lockKey}:delete`,
          messages: {
            loading: "발주서를 삭제하는 중입니다.",
            success: "발주서를 삭제했습니다.",
            error: "발주서를 삭제하지 못했습니다.",
          },
          mutation: async () => {
            await cancelMaterialOrder({ materialOrderId });
            setOrders((current) =>
              current.filter((order) => order.id !== materialOrderId),
            );
            setSelectedOrderId((currentSelectedOrderId) =>
              currentSelectedOrderId === materialOrderId
                ? ""
                : currentSelectedOrderId,
            );
            await refreshWorkOrderCandidates();
          },
          rollback: () => {
            setOrders(previousOrders);
            setSelectedOrderId(previousSelectedOrderId);
          },
          getErrorMessage: (error) =>
            toMaterialOrderWorkspaceError(
              error,
              "발주서를 삭제하지 못했습니다.",
            ),
        });
      } finally {
        setStatusChanging(false);
      }
    },
    [
      isMaterialOrderLockActive,
      orders,
      refreshWorkOrderCandidates,
      runMaterialOrderMutation,
      selectedOrderId,
    ],
  );

  const updateLine = useCallback(
    (lineId: string, patch: Partial<MaterialOrderDraftLine>) => {
      if (materialOrderMutationLocked) return;
      setLines((current) =>
        current.map((line) => {
          if (line.id !== lineId) return line;
          const nextLine = { ...line, ...patch };
          if (patch.orderQuantity == null || line.allocations.length === 0)
            return nextLine;

          const candidate = workOrderCandidates.find(
            (item) => item.id === line.sourceWorkOrderId,
          );
          const material = candidate?.materialItems.find(
            (item) => item.key === line.sourceMaterialKey,
          );
          const requiredQuantity = Number(material?.quantity ?? 0);
          if (!(requiredQuantity > 0)) return nextLine;

          let remainingAllocation = Math.min(
            Math.max(0, patch.orderQuantity),
            requiredQuantity,
          );
          return {
            ...nextLine,
            allocations: line.allocations.map((allocation) => {
              const allocatedQuantity = Math.min(
                remainingAllocation,
                requiredQuantity,
              );
              remainingAllocation = Math.max(
                0,
                remainingAllocation - allocatedQuantity,
              );
              return { ...allocation, allocatedQuantity };
            }),
          };
        }),
      );
    },
    [materialOrderMutationLocked, workOrderCandidates],
  );

  const addWorkOrderMaterialLine = useCallback(
    (
      workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
      material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
    ) => {
      if (
        materialOrderMutationLocked ||
        !selectedOrder ||
        !canEditMaterialOrderCoreFields(selectedOrder.status, isAdmin)
      ) {
        return;
      }

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
          unitPrice: Number.isFinite(material.unitCost ?? 0)
            ? (material.unitCost ?? 0)
            : 0,
        });
        return current;
      });
    },
    [
      isAdmin,
      materialOrderMutationLocked,
      materialRequestQuantityMap,
      selectedOrder,
    ],
  );

  const closePendingLineAddition = useCallback(
    () => setPendingLineAddition(null),
    [],
  );

  const confirmPendingLineAddition = useCallback(
    (override?: { orderQuantity: number; unitPrice: number }) => {
      const pending = pendingLineAddition;
      if (!pending) return;

      const rawOrderQuantity = override?.orderQuantity ?? pending.orderQuantity;
      const rawUnitPrice = override?.unitPrice ?? pending.unitPrice;
      const orderQuantity = Number.isFinite(rawOrderQuantity)
        ? Math.max(0, rawOrderQuantity)
        : 0;
      const unitPrice = Number.isFinite(rawUnitPrice)
        ? Math.max(0, rawUnitPrice)
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
    },
    [pendingLineAddition],
  );

  const removeLine = useCallback(
    (lineId: string) => {
      if (materialOrderMutationLocked) return;
      setLines((current) => current.filter((line) => line.id !== lineId));
    },
    [materialOrderMutationLocked],
  );

  const selectOrder = useCallback(
    (nextOrderId: string) => {
      if (materialOrderMutationLocked || headerSaving || statusChanging) return;
      setSelectedOrderId(nextOrderId);
    },
    [headerSaving, materialOrderMutationLocked, statusChanging],
  );

  return {
    orders,
    selectedOrderId,
    selectedOrder,
    ordersLoading,
    ordersError,
    creatingOrder,
    statusChanging,
    headerSaving: headerSaving || materialOrderMutationLocked,
    materialOrderMutationLocked,
    statusToastOperation,
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
      onClose: closePendingLineAddition,
      onConfirm: confirmPendingLineAddition,
    },
    materialTypeChangeConfirmationModal: {
      open: pendingMaterialTypeChange !== null,
      title: "자재 종류를 변경하시겠습니까?",
      description:
        "자재 종류를 변경하면 현재 선택한 공급처와 작성 중인 주문 품목이 모두 초기화됩니다.",
      confirmLabel: "예, 변경",
      cancelLabel: "아니오",
      onClose: closeMaterialTypeChangeConfirmation,
      onConfirm: confirmMaterialTypeChange,
    },
    materialOrderValidationModal: {
      open: pendingStatusValidation !== null,
      issues: pendingStatusValidation?.issues ?? [],
      title: "진행 전 확인이 필요합니다",
      description: pendingStatusValidation?.issues.some(
        (issue) => issue.level === "blocking",
      )
        ? "아래 항목은 먼저 수정해야 다음 단계로 진행할 수 있습니다."
        : "확인이 필요한 항목이 있습니다. 그대로 진행할 수 있지만 먼저 확인하는 것이 좋습니다.",
      blockingLabel: "진행 차단 항목",
      warningLabel: "확인 필요 항목",
      confirmLabel: "그대로 진행",
      fixLabel: "확인 후 수정",
      onClose: closeMaterialOrderValidation,
      onConfirm: confirmMaterialOrderValidation,
    },
    setSelectedOrderId: selectOrder,
    changeSupplierPartnerId,
    changeDueDate,
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
