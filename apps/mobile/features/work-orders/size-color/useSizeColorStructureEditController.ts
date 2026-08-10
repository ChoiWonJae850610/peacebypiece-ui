import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createExplicitMutationController } from "@/application/mutationController";
import { MobileApiError, type SizeColorStructureCommandResult, type WorkOrderSizeColorBundle } from "@/domain/mobileContract";
import { workOrderMutationController } from "@/features/work-orders/workOrderMutationController";
import {
  createImmutableAddSnapshot,
  normalizedPresetKey,
  sortColorRows,
  sortSizeRows,
} from "@/domain/sizeColorStructurePolicy";
import {
  isStructureMutationCommitAllowed,
  sameColorDraft,
  validateColorDraft,
  validateSizeLabel,
  type ColorStructureDraft,
} from "./sizeColorStructureEditPolicy";
import { reconcileQuantityCell } from "./sizeColorReconciliation";

export type SizeColorStructureEditBoundary = {
  readonly canEdit: boolean;
  readonly editing: boolean;
  readonly busy: boolean;
  readonly errorMessage: string | null;
  readonly resetToken: number;
  readonly onBegin: () => void;
  readonly onCancel: () => void;
  readonly onAddSize: (displayLabel: string) => Promise<boolean>;
  readonly onAddSizes: (displayLabels: readonly string[]) => Promise<{ readonly added: number; readonly failed: string | null }>;
  readonly onRenameSize: (sizeRowId: string, displayLabel: string) => Promise<boolean>;
  readonly onDeleteSize: (sizeRowId: string) => Promise<boolean>;
  readonly onAddColor: (draft: ColorStructureDraft) => Promise<boolean>;
  readonly onAddColors: (drafts: readonly ColorStructureDraft[]) => Promise<{ readonly added: number; readonly failed: string | null }>;
  readonly onPatchColor: (colorId: string, draft: ColorStructureDraft) => Promise<boolean>;
  readonly onDeleteColor: (colorId: string) => Promise<boolean>;
  readonly onSetQuantity: (colorId: string, sizeRowId: string, quantity: number) => Promise<boolean>;
};

type LatestProjection = {
  readonly bundle: WorkOrderSizeColorBundle;
  readonly entityVersion: number;
};

type Input = {
  readonly workOrderId: string | null;
  readonly entityVersion: number | null;
  readonly canEdit: boolean;
  readonly bundle: WorkOrderSizeColorBundle | null;
  readonly onReconcile: (updater: (bundle: WorkOrderSizeColorBundle) => WorkOrderSizeColorBundle, nextVersion: number) => void;
  readonly onTotalQuantityReconcile: (totalQuantity: number, nextVersion: number) => void;
  readonly onCommitted: (nextVersion: number) => Promise<void>;
  readonly onConflict: () => Promise<void>;
  readonly onRefreshLatest: () => Promise<LatestProjection | undefined>;
  readonly onAuthenticationError: (error: MobileApiError) => void;
};

function withSizeOrder<T extends { readonly id: string; readonly displayLabel: string; readonly displayOrder: number }>(rows: readonly T[]) {
  return sortSizeRows(rows).map((row, displayOrder) => ({ ...row, displayOrder }));
}

function withColorOrder<T extends { readonly id: string; readonly displayName: string; readonly displayOrder: number }>(rows: readonly T[]) {
  return sortColorRows(rows).map((row, displayOrder) => ({ ...row, displayOrder }));
}

function isConflict(error: unknown) {
  return error instanceof MobileApiError && (error.code === "CONFLICT" || error.status === 409);
}

export function useSizeColorStructureEditController(input: Input) {
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorState, setErrorState] = useState<{ readonly workOrderId: string; readonly message: string } | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const mutation = useRef(createExplicitMutationController()).current;
  const sequence = useRef(0);
  const generation = useRef(0);
  const batchBusy = useRef(false);
  const activeWorkOrderId = useRef(input.workOrderId);
  const current = useRef(input);

  useEffect(() => {
    current.current = input;
    if (activeWorkOrderId.current !== input.workOrderId) {
      generation.current += 1;
      activeWorkOrderId.current = input.workOrderId;
    }
  }, [input]);

  const identity = useCallback(() => {
    sequence.current += 1;
    const suffix = `${Date.now().toString(36)}-${sequence.current.toString(36)}`;
    return { clientRequestId: `mobile-size-color-${suffix}`, idempotencyKey: `mobile-size-color-${suffix}` };
  }, []);

  const reportError = useCallback((workOrderId: string, error: unknown, fallback: string) => {
    if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
      current.current.onAuthenticationError(error);
    }
    setErrorState({ workOrderId, message: error instanceof MobileApiError ? error.message : fallback });
  }, []);

  const run = useCallback(async (
    changed: boolean,
    request: (context: { readonly workOrderId: string; readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string }) => Promise<SizeColorStructureCommandResult>,
    reconcile?: (bundle: WorkOrderSizeColorBundle, result: SizeColorStructureCommandResult) => WorkOrderSizeColorBundle,
    optimistic?: (bundle: WorkOrderSizeColorBundle) => WorkOrderSizeColorBundle,
  ) => {
    const snapshot = current.current;
    if (!snapshot.canEdit || !snapshot.workOrderId || snapshot.entityVersion === null) return false;
    const requestGeneration = generation.current;
    const requestWorkOrderId = snapshot.workOrderId;
    const ids = identity();
    let optimisticApplied = false;
    let conflictRefreshed = false;
    setErrorState(null);
    const result = await mutation.execute(changed, async () => {
      if (optimistic && snapshot.bundle) {
        const optimisticBundle = optimistic(snapshot.bundle);
        snapshot.onReconcile(() => optimisticBundle, snapshot.entityVersion as number);
        snapshot.onTotalQuantityReconcile(Number(optimisticBundle.matrix.matrixTotal), snapshot.entityVersion as number);
        optimisticApplied = true;
      }
      setBusy(true);
      return request({ workOrderId: requestWorkOrderId, expectedVersion: snapshot.entityVersion as number, ...ids });
    }).catch(async (error: unknown) => {
      if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) snapshot.onAuthenticationError(error);
      else if (isConflict(error)) {
        await snapshot.onConflict();
        conflictRefreshed = true;
        setErrorState({ workOrderId: requestWorkOrderId, message: "다른 변경이 먼저 저장되어 최신 값을 다시 불러왔습니다." });
      } else reportError(requestWorkOrderId, error, "변경을 저장하지 못했습니다.");
      setResetToken((value) => value + 1);
      return { kind: "skipped" as const };
    }).finally(() => setBusy(false));
    if (result.kind !== "success") {
      if (optimisticApplied && !conflictRefreshed && snapshot.bundle
        && isStructureMutationCommitAllowed({ requestWorkOrderId, activeWorkOrderId: activeWorkOrderId.current, requestGeneration, activeGeneration: generation.current })) {
        snapshot.onReconcile(() => snapshot.bundle as WorkOrderSizeColorBundle, snapshot.entityVersion as number);
        snapshot.onTotalQuantityReconcile(Number(snapshot.bundle.matrix.matrixTotal), snapshot.entityVersion as number);
      }
      return false;
    }
    if (!isStructureMutationCommitAllowed({ requestWorkOrderId, activeWorkOrderId: activeWorkOrderId.current, requestGeneration, activeGeneration: generation.current })) return false;
    if (reconcile) snapshot.onReconcile((bundle) => reconcile(bundle, result.value), result.value.nextVersion);
    if (result.value.totalQuantity !== undefined) {
      snapshot.onTotalQuantityReconcile(result.value.totalQuantity, result.value.nextVersion);
    }
    await snapshot.onCommitted(result.value.nextVersion);
    setResetToken((value) => value + 1);
    return true;
  }, [identity, mutation, reportError]);

  const addSizesSequentially = useCallback(async (displayLabels: readonly string[]) => {
    const snapshot = current.current;
    if (batchBusy.current || busy || !snapshot.canEdit || !snapshot.workOrderId) return { added: 0, failed: displayLabels[0] ?? null };
    const immutableSelection = Object.freeze(displayLabels.map((label) => label.normalize("NFKC").trim()).filter(Boolean));
    batchBusy.current = true;
    setBusy(true);
    setErrorState(null);
    let added = 0;
    let failed: string | null = null;
    try {
      let latest = await snapshot.onRefreshLatest();
      if (!latest) return { added: 0, failed: immutableSelection[0] ?? null };
      let expectedVersion = latest.entityVersion;
      let sizes = [...latest.bundle.matrix.sizes];
      const queue = createImmutableAddSnapshot(immutableSelection, sizes.map((row) => row.displayLabel)).pending;
      for (const displayLabel of queue) {
        const validated = validateSizeLabel(displayLabel, sizes);
        if (validated.error) { failed = displayLabel; setErrorState({ workOrderId: snapshot.workOrderId, message: validated.error }); break; }
        const ids = identity();
        let result: SizeColorStructureCommandResult | null = null;
        try {
          result = await workOrderMutationController.addSize(snapshot.workOrderId, { clientRequestId: ids.clientRequestId, expectedVersion, displayLabel: validated.value }, ids.idempotencyKey);
        } catch (error) {
          if (!isConflict(error)) { reportError(snapshot.workOrderId, error, `${displayLabel} 추가에 실패했습니다.`); failed = displayLabel; break; }
          latest = await snapshot.onRefreshLatest();
          if (!latest) { failed = displayLabel; break; }
          expectedVersion = latest.entityVersion;
          sizes = [...latest.bundle.matrix.sizes];
          const reconciled = sizes.find((row) => normalizedPresetKey(row.displayLabel) === normalizedPresetKey(validated.value));
          if (reconciled) result = { workOrderId: snapshot.workOrderId as SizeColorStructureCommandResult["workOrderId"], revisionId: latest.bundle.matrix.revisionId, targetKind: "size", targetId: reconciled.id, nextVersion: expectedVersion };
          else {
            try {
              result = await workOrderMutationController.addSize(snapshot.workOrderId, { clientRequestId: ids.clientRequestId, expectedVersion, displayLabel: validated.value }, ids.idempotencyKey);
            } catch (retryError) { reportError(snapshot.workOrderId, retryError, `${displayLabel} 추가에 실패했습니다.`); failed = displayLabel; break; }
          }
        }
        if (!result?.targetId) { failed = displayLabel; break; }
        expectedVersion = result.nextVersion;
        const existing = sizes.find((row) => row.id === result?.targetId);
        if (!existing) sizes = withSizeOrder([...sizes, { id: result.targetId, code: "", displayLabel: validated.value, displayOrder: sizes.length }]);
        else sizes = withSizeOrder(sizes);
        snapshot.onReconcile((bundle) => ({ ...bundle, matrix: { ...bundle.matrix, sizes } }), expectedVersion);
        added += 1;
      }
      await snapshot.onRefreshLatest();
      if (failed) setErrorState({ workOrderId: snapshot.workOrderId, message: `${failed} 추가에 실패했습니다. 앞서 추가된 항목은 유지됩니다.` });
      return { added, failed };
    } finally {
      batchBusy.current = false;
      setBusy(false);
      setResetToken((value) => value + 1);
    }
  }, [busy, identity, reportError]);

  const addColorsSequentially = useCallback(async (drafts: readonly ColorStructureDraft[]) => {
    const snapshot = current.current;
    if (batchBusy.current || busy || !snapshot.canEdit || !snapshot.workOrderId) return { added: 0, failed: drafts[0]?.displayName ?? null };
    const immutableSelection = Object.freeze(drafts.map((draft) => Object.freeze({ displayName: draft.displayName.normalize("NFKC").trim(), hexValue: draft.hexValue.trim().toUpperCase() })));
    batchBusy.current = true;
    setBusy(true);
    setErrorState(null);
    let added = 0;
    let failed: string | null = null;
    try {
      let latest = await snapshot.onRefreshLatest();
      if (!latest) return { added: 0, failed: immutableSelection[0]?.displayName ?? null };
      let expectedVersion = latest.entityVersion;
      let colors = [...latest.bundle.matrix.colors];
      const pendingNames = new Set(createImmutableAddSnapshot(immutableSelection.map((draft) => draft.displayName), colors.map((row) => row.displayName)).pending.map(normalizedPresetKey));
      const queue = immutableSelection.filter((draft) => pendingNames.has(normalizedPresetKey(draft.displayName)));
      for (const draft of queue) {
        const validated = validateColorDraft(draft, colors);
        if (validated.error) { failed = draft.displayName; setErrorState({ workOrderId: snapshot.workOrderId, message: validated.error }); break; }
        const ids = identity();
        let result: SizeColorStructureCommandResult | null = null;
        try {
          result = await workOrderMutationController.addColor(snapshot.workOrderId, { clientRequestId: ids.clientRequestId, expectedVersion, displayName: validated.displayName, hexValue: validated.hexValue }, ids.idempotencyKey);
        } catch (error) {
          if (!isConflict(error)) { reportError(snapshot.workOrderId, error, `${draft.displayName} 추가에 실패했습니다.`); failed = draft.displayName; break; }
          latest = await snapshot.onRefreshLatest();
          if (!latest) { failed = draft.displayName; break; }
          expectedVersion = latest.entityVersion;
          colors = [...latest.bundle.matrix.colors];
          const reconciled = colors.find((row) => normalizedPresetKey(row.displayName) === normalizedPresetKey(validated.displayName));
          if (reconciled) result = { workOrderId: snapshot.workOrderId as SizeColorStructureCommandResult["workOrderId"], revisionId: latest.bundle.matrix.revisionId, targetKind: "color", targetId: reconciled.id, nextVersion: expectedVersion };
          else {
            try {
              result = await workOrderMutationController.addColor(snapshot.workOrderId, { clientRequestId: ids.clientRequestId, expectedVersion, displayName: validated.displayName, hexValue: validated.hexValue }, ids.idempotencyKey);
            } catch (retryError) { reportError(snapshot.workOrderId, retryError, `${draft.displayName} 추가에 실패했습니다.`); failed = draft.displayName; break; }
          }
        }
        if (!result?.targetId) { failed = draft.displayName; break; }
        expectedVersion = result.nextVersion;
        const existing = colors.find((row) => row.id === result?.targetId);
        if (!existing) colors = withColorOrder([...colors, { id: result.targetId, code: "", displayName: validated.displayName, hexValue: validated.hexValue, displayOrder: colors.length }]);
        else colors = withColorOrder(colors);
        snapshot.onReconcile((bundle) => ({ ...bundle, matrix: { ...bundle.matrix, colors } }), expectedVersion);
        added += 1;
      }
      await snapshot.onRefreshLatest();
      if (failed) setErrorState({ workOrderId: snapshot.workOrderId, message: `${failed} 추가에 실패했습니다. 앞서 추가된 항목은 유지됩니다.` });
      return { added, failed };
    } finally {
      batchBusy.current = false;
      setBusy(false);
      setResetToken((value) => value + 1);
    }
  }, [busy, identity, reportError]);

  const boundary = useMemo<SizeColorStructureEditBoundary>(() => ({
    canEdit: input.canEdit,
    editing: input.canEdit && editingWorkOrderId === input.workOrderId,
    busy,
    errorMessage: errorState?.workOrderId === input.workOrderId ? errorState.message : null,
    resetToken,
    onBegin: () => { if (input.canEdit) { setErrorState(null); setEditingWorkOrderId(input.workOrderId); } },
    onCancel: () => { if (!busy) { setEditingWorkOrderId(null); setErrorState(null); setResetToken((value) => value + 1); } },
    onAddSize: async (displayLabel) => (await addSizesSequentially([displayLabel])).failed === null,
    onAddSizes: addSizesSequentially,
    onRenameSize: async (sizeRowId, displayLabel) => {
      const sizes = input.bundle?.matrix.sizes ?? [];
      const currentRow = sizes.find((row) => row.id === sizeRowId);
      if (!currentRow) return false;
      const validated = validateSizeLabel(displayLabel, sizes, sizeRowId);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      return run(validated.value !== currentRow.displayLabel, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.renameSize(workOrderId, sizeRowId, { clientRequestId, expectedVersion, displayLabel: validated.value }, idempotencyKey), (bundle) => ({ ...bundle, matrix: { ...bundle.matrix, sizes: withSizeOrder(bundle.matrix.sizes.map((row) => row.id === sizeRowId ? { ...row, displayLabel: validated.value } : row)) } }));
    },
    onDeleteSize: (sizeRowId) => run(
      true,
      ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.deleteSize(
        workOrderId, sizeRowId, { clientRequestId, expectedVersion }, idempotencyKey,
      ),
      (bundle) => ({
        ...bundle,
        matrix: {
          ...bundle.matrix,
          sizes: withSizeOrder(bundle.matrix.sizes.filter((row) => row.id !== sizeRowId)),
          quantityCells: bundle.matrix.quantityCells.filter((cell) => cell.sizeRowId !== sizeRowId),
        },
      }),
    ),
    onAddColor: async (draft) => (await addColorsSequentially([draft])).failed === null,
    onAddColors: addColorsSequentially,
    onPatchColor: async (colorId, draft) => {
      const colors = input.bundle?.matrix.colors ?? [];
      const currentRow = colors.find((row) => row.id === colorId);
      if (!currentRow) return false;
      const validated = validateColorDraft(draft, colors, colorId);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      return run(!sameColorDraft(currentRow, draft), ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.patchColor(workOrderId, colorId, { clientRequestId, expectedVersion, patch: { displayName: validated.displayName, hexValue: validated.hexValue } }, idempotencyKey), (bundle) => ({ ...bundle, matrix: { ...bundle.matrix, colors: withColorOrder(bundle.matrix.colors.map((row) => row.id === colorId ? { ...row, displayName: validated.displayName, hexValue: validated.hexValue } : row)) } }));
    },
    onDeleteColor: (colorId) => run(
      true,
      ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.deleteColor(
        workOrderId, colorId, { clientRequestId, expectedVersion }, idempotencyKey,
      ),
      (bundle) => ({
        ...bundle,
        matrix: {
          ...bundle.matrix,
          colors: withColorOrder(bundle.matrix.colors.filter((row) => row.id !== colorId)),
          quantityCells: bundle.matrix.quantityCells.filter((cell) => cell.colorId !== colorId),
        },
      }),
    ),
    onSetQuantity: async (colorId, sizeRowId, quantity) => {
      const currentCell = input.bundle?.matrix.quantityCells.find((cell) => cell.colorId === colorId && cell.sizeRowId === sizeRowId);
      const currentQuantity = Number(currentCell?.quantity ?? 0);
      if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000_000) { setErrorState({ workOrderId: input.workOrderId ?? "", message: "수량은 0 이상의 정수로 입력해 주세요." }); return false; }
      return run(
        quantity !== currentQuantity || input.bundle?.matrix.projectionsMatch === false,
        ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.upsertQuantity(
          workOrderId,
          colorId,
          sizeRowId,
          { clientRequestId, expectedVersion, quantity },
          idempotencyKey,
        ),
        (bundle, result) => reconcileQuantityCell(
          bundle,
          colorId,
          sizeRowId,
          result.quantity ?? quantity,
        ),
        (bundle) => reconcileQuantityCell(bundle, colorId, sizeRowId, quantity),
      );
    },
  }), [addColorsSequentially, addSizesSequentially, busy, editingWorkOrderId, errorState, input.bundle, input.canEdit, input.workOrderId, resetToken, run]);

  return { boundary };
}
