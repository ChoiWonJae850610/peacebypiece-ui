import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createSerializedMutationQueue } from "@/application/mutationController";
import { MobileApiError, type MeasurementCommandResult, type SizeColorStructureCommandResult, type WorkOrderSizeColorBundle } from "@/domain/mobileContract";
import { createApplyMeasurementTemplateCommand } from "@/domain/measurementCommandTransport";
import { formatMeasurementFromCm, normalizeMeasurementSizeSemanticKey, parseMeasurementToCm } from "@/domain/measurementPolicy";
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
import { reconcileQuantityCell, reconcileSizeColorTotals } from "./sizeColorReconciliation";
import { createDevMutationTiming } from "@/lib/devMutationTiming";
import type { StructureSelectionCandidate } from "@/domain/sizeColorSelectionBatchPolicy";
import { commitMeasurementProjectionTransition } from "./projectionVersionTransition";
import type { MeasurementProjectionCommandKind } from "./measurementProjectionImpactPolicy";
import type { PendingCommandScope } from "./sizeColorPendingPolicy";

export type { PendingCommandScope } from "./sizeColorPendingPolicy";

export type SizeColorStructureEditBoundary = {
  readonly canEdit: boolean;
  readonly editing: boolean;
  readonly busy: boolean;
  readonly pendingScope: PendingCommandScope | null;
  readonly errorMessage: string | null;
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
  readonly onApplySelectionBatch: (
    targetKind: "size" | "color",
    additions: readonly StructureSelectionCandidate[],
    deletionIds: readonly string[],
  ) => Promise<boolean>;
  readonly onSetQuantity: (colorId: string, sizeRowId: string, quantity: number) => Promise<boolean>;
  readonly onSetMeasurementCell: (sizeRowId: string, pomColumnId: string, measurementUnit: "cm" | "inch", displayValue: string | null) => Promise<boolean>;
  readonly onSetMeasurementUnit: (measurementUnit: "cm" | "inch") => Promise<boolean>;
  readonly onApplyMeasurementTemplate: (templateId: string) => Promise<boolean>;
  readonly onSaveMeasurementTemplate: (templateName: string) => Promise<boolean>;
  readonly onUpdateMeasurementTemplate: (templateId: string) => Promise<boolean>;
  readonly onSetPomSelection: (selectedItems: readonly { readonly catalogOptionId: string | null; readonly systemSpecItemKey: string | null; readonly currentPomId: string | null; readonly displayName: string }[]) => Promise<boolean>;
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
  readonly onVersionReconcile: (nextVersion: number) => void;
  readonly onPromoteProjectionVersion: (nextVersion: number) => void;
  readonly onRefreshSizeSpec: (nextVersion: number) => Promise<void>;
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

function reconcileFinishedSpecSizes(bundle: WorkOrderSizeColorBundle, matrixSizes = bundle.matrix.sizes): WorkOrderSizeColorBundle {
  const existingByKey = new Map(bundle.specifications.sizes.map((size) => [
    normalizeMeasurementSizeSemanticKey(size.code || size.displayLabel),
    size,
  ]));
  const sizes = matrixSizes.map((matrixSize, displayOrder) => {
    const key = normalizeMeasurementSizeSemanticKey(matrixSize.code || matrixSize.displayLabel);
    const existing = existingByKey.get(key);
    return {
      id: matrixSize.id,
      code: matrixSize.code || existing?.code || key,
      displayLabel: matrixSize.displayLabel,
      displayOrder,
    };
  });
  const sizeIds = new Set(sizes.map((size) => size.id));
  return {
    ...bundle,
    matrix: { ...bundle.matrix, sizes: matrixSizes },
    specifications: {
      ...bundle.specifications,
      sizes,
      cells: bundle.specifications.cells.filter((cell) => sizeIds.has(cell.sizeRowId)),
      sourceTemplateModified: bundle.specifications.templateId !== null,
    },
  };
}

function isConflict(error: unknown) {
  return error instanceof MobileApiError && (error.code === "CONFLICT" || error.status === 409);
}
function isStructureResult(value: SizeColorStructureCommandResult | MeasurementCommandResult): value is SizeColorStructureCommandResult { return "targetKind" in value; }

export function useSizeColorStructureEditController(input: Input) {
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingScope, setPendingScope] = useState<PendingCommandScope | null>(null);
  const [errorState, setErrorState] = useState<{ readonly workOrderId: string; readonly message: string } | null>(null);
  const mutationQueue = useRef(createSerializedMutationQueue()).current;
  const sequence = useRef(0);
  const generation = useRef(0);
  const batchBusy = useRef(false);
  const activeWorkOrderId = useRef(input.workOrderId);
  const authoritativeVersion = useRef(input.entityVersion);
  const current = useRef(input);

  useEffect(() => {
    current.current = input;
    if (activeWorkOrderId.current !== input.workOrderId) {
      generation.current += 1;
      activeWorkOrderId.current = input.workOrderId;
      authoritativeVersion.current = input.entityVersion;
    } else if (input.entityVersion !== null
      && (authoritativeVersion.current === null || input.entityVersion > authoritativeVersion.current)) {
      authoritativeVersion.current = input.entityVersion;
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
    request: (context: { readonly workOrderId: string; readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string }) => Promise<SizeColorStructureCommandResult | MeasurementCommandResult>,
    reconcile?: (bundle: WorkOrderSizeColorBundle, result: SizeColorStructureCommandResult) => WorkOrderSizeColorBundle,
    optimistic?: (bundle: WorkOrderSizeColorBundle) => WorkOrderSizeColorBundle,
    projectionCommand?: MeasurementProjectionCommandKind,
    metricName = "size-color-structure",
    scope: PendingCommandScope = "structure",
    failureRollbackBundle?: WorkOrderSizeColorBundle,
  ) => {
    const initial = current.current;
    if (!changed || !initial.canEdit || !initial.workOrderId || initial.entityVersion === null) return false;
    const requestGeneration = generation.current;
    const requestWorkOrderId = initial.workOrderId;
    const timing = createDevMutationTiming(metricName);
    if (scope === "measurement-unit") timing.markVisibleComplete();
    setErrorState(null);
    return mutationQueue.enqueue(async () => {
      const snapshot = current.current;
      if (!snapshot.canEdit || snapshot.workOrderId !== requestWorkOrderId || snapshot.entityVersion === null
        || requestGeneration !== generation.current) return false;
      const ids = identity();
      let optimisticApplied = false;
      let conflictRefreshed = false;
      if (optimistic && snapshot.bundle) {
        const optimisticBundle = optimistic(snapshot.bundle);
        snapshot.onReconcile(() => optimisticBundle, snapshot.entityVersion);
        snapshot.onTotalQuantityReconcile(Number(optimisticBundle.matrix.matrixTotal), snapshot.entityVersion);
        optimisticApplied = true;
      }
      setBusy(true);
      setPendingScope(scope);
      try {
        const expectedVersion = authoritativeVersion.current ?? snapshot.entityVersion;
        const commandResult = await request({ workOrderId: requestWorkOrderId, expectedVersion, ...ids });
        timing.markRequestComplete();
        if (!isStructureMutationCommitAllowed({ requestWorkOrderId, activeWorkOrderId: activeWorkOrderId.current, requestGeneration, activeGeneration: generation.current })) {
          timing.complete({ followUpRequests: 0, outcome: "skipped" });
          return false;
        }
        if (reconcile && isStructureResult(commandResult)) snapshot.onReconcile((bundle) => reconcile(bundle, commandResult), commandResult.nextVersion);
        if ("totalQuantity" in commandResult && commandResult.totalQuantity !== undefined) {
          snapshot.onTotalQuantityReconcile(commandResult.totalQuantity, commandResult.nextVersion);
        }
        authoritativeVersion.current = commandResult.nextVersion;
        const projectionImpact = projectionCommand
          ? await commitMeasurementProjectionTransition({
            command: projectionCommand,
            nextVersion: commandResult.nextVersion,
            promoteProjection: snapshot.onPromoteProjectionVersion,
            reconcileEntityVersion: snapshot.onVersionReconcile,
            refreshSizeSpec: snapshot.onRefreshSizeSpec,
          })
          : null;
        if (!projectionCommand) snapshot.onVersionReconcile(commandResult.nextVersion);
        timing.complete({ followUpRequests: projectionImpact?.workOrderSizeSpecGets ?? 0, outcome: "success" });
        return true;
      } catch (error: unknown) {
        if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) snapshot.onAuthenticationError(error);
        else if (isConflict(error)) {
          await snapshot.onConflict();
          conflictRefreshed = true;
          setErrorState({ workOrderId: requestWorkOrderId, message: "다른 변경이 먼저 저장되어 최신 값을 다시 불러왔습니다." });
        } else reportError(requestWorkOrderId, error, "변경을 저장하지 못했습니다.");
        if (failureRollbackBundle && !conflictRefreshed) {
          snapshot.onReconcile(() => failureRollbackBundle, snapshot.entityVersion);
          snapshot.onTotalQuantityReconcile(Number(failureRollbackBundle.matrix.matrixTotal), snapshot.entityVersion);
        } else if (optimisticApplied && !conflictRefreshed && snapshot.bundle
          && isStructureMutationCommitAllowed({ requestWorkOrderId, activeWorkOrderId: activeWorkOrderId.current, requestGeneration, activeGeneration: generation.current })) {
          snapshot.onReconcile(() => snapshot.bundle as WorkOrderSizeColorBundle, snapshot.entityVersion);
          snapshot.onTotalQuantityReconcile(Number(snapshot.bundle.matrix.matrixTotal), snapshot.entityVersion);
        }
        timing.complete({ followUpRequests: conflictRefreshed ? 3 : 0, outcome: "failure" });
        return false;
      } finally {
        setBusy(false);
        setPendingScope(null);
        timing.markBusyRelease();
      }
    });
  }, [identity, mutationQueue, reportError]);

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
        snapshot.onReconcile((bundle) => reconcileFinishedSpecSizes(bundle, sizes), expectedVersion);
        added += 1;
      }
      await snapshot.onRefreshLatest();
      if (failed) setErrorState({ workOrderId: snapshot.workOrderId, message: `${failed} 추가에 실패했습니다. 앞서 추가된 항목은 유지됩니다.` });
      return { added, failed };
    } finally {
      batchBusy.current = false;
      setBusy(false);
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
    }
  }, [busy, identity, reportError]);

  const boundary = useMemo<SizeColorStructureEditBoundary>(() => ({
    canEdit: input.canEdit,
    editing: input.canEdit && editingWorkOrderId === input.workOrderId,
    busy,
    pendingScope,
    errorMessage: errorState?.workOrderId === input.workOrderId ? errorState.message : null,
    onBegin: () => { if (input.canEdit) { setErrorState(null); setEditingWorkOrderId(input.workOrderId); } },
    onCancel: () => { if (!busy) { setEditingWorkOrderId(null); setErrorState(null); } },
    onAddSize: async (displayLabel) => {
      const sizes = input.bundle?.matrix.sizes ?? [];
      const validated = validateSizeLabel(displayLabel, sizes);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      return run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.addSize(
        workOrderId, { clientRequestId, expectedVersion, displayLabel: validated.value }, idempotencyKey,
      ), (bundle, result) => result.targetId ? reconcileFinishedSpecSizes(bundle, withSizeOrder([...bundle.matrix.sizes, { id: result.targetId, code: validated.value, displayLabel: validated.value, displayOrder: bundle.matrix.sizes.length }])) : bundle, undefined, undefined, "size-add");
    },
    onAddSizes: addSizesSequentially,
    onRenameSize: async (sizeRowId, displayLabel) => {
      const sizes = input.bundle?.matrix.sizes ?? [];
      const currentRow = sizes.find((row) => row.id === sizeRowId);
      if (!currentRow) return false;
      const validated = validateSizeLabel(displayLabel, sizes, sizeRowId);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      return run(validated.value !== currentRow.displayLabel, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.renameSize(workOrderId, sizeRowId, { clientRequestId, expectedVersion, displayLabel: validated.value }, idempotencyKey), (bundle) => reconcileFinishedSpecSizes(bundle, withSizeOrder(bundle.matrix.sizes.map((row) => row.id === sizeRowId ? { ...row, displayLabel: validated.value } : row))), undefined, undefined, "size-rename");
    },
    onDeleteSize: (sizeRowId) => run(
      true,
      ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.deleteSize(
        workOrderId, sizeRowId, { clientRequestId, expectedVersion }, idempotencyKey,
      ),
      (bundle) => {
        const nextSizes = withSizeOrder(bundle.matrix.sizes.filter((row) => row.id !== sizeRowId));
        const synchronized = reconcileFinishedSpecSizes(bundle, nextSizes);
        return reconcileSizeColorTotals({ ...synchronized, matrix: { ...synchronized.matrix, quantityCells: bundle.matrix.quantityCells.filter((cell) => cell.sizeRowId !== sizeRowId) } });
      },
      undefined,
      undefined,
      "size-delete",
    ),
    onAddColor: async (draft) => {
      const colors = input.bundle?.matrix.colors ?? [];
      const validated = validateColorDraft(draft, colors);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      return run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.addColor(
        workOrderId, { clientRequestId, expectedVersion, displayName: validated.displayName, hexValue: validated.hexValue }, idempotencyKey,
      ), (bundle, result) => result.targetId ? ({ ...bundle, matrix: { ...bundle.matrix, colors: withColorOrder([...bundle.matrix.colors, { id: result.targetId, code: "", displayName: validated.displayName, hexValue: validated.hexValue, displayOrder: bundle.matrix.colors.length }]) } }) : bundle, undefined, undefined, "color-add");
    },
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
      (bundle) => reconcileSizeColorTotals({
        ...bundle,
        matrix: {
          ...bundle.matrix,
          colors: withColorOrder(bundle.matrix.colors.filter((row) => row.id !== colorId)),
          quantityCells: bundle.matrix.quantityCells.filter((cell) => cell.colorId !== colorId),
        },
      }),
    ),
    onApplySelectionBatch: (targetKind, additions, deletionIds) => run(
      additions.length > 0 || deletionIds.length > 0,
      ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.batchStructureSelection(
        workOrderId,
        { clientRequestId, expectedVersion, targetKind, additions, deletionIds },
        idempotencyKey,
      ),
      (bundle, result) => {
        const deleted = new Set(result.deletedTargetIds ?? deletionIds);
        const created = result.createdItems ?? [];
        const quantityCells = bundle.matrix.quantityCells.filter((cell) => (
          targetKind === "size" ? !deleted.has(cell.sizeRowId) : !deleted.has(cell.colorId)
        ));
        if (targetKind === "size") {
          const sizes = withSizeOrder([
            ...bundle.matrix.sizes.filter((row) => !deleted.has(row.id)),
            ...created.map((item) => ({ id: item.id, code: item.displayName, displayLabel: item.displayName, displayOrder: bundle.matrix.sizes.length })),
          ]);
          const synchronized = reconcileFinishedSpecSizes(bundle, sizes);
          return reconcileSizeColorTotals({ ...synchronized, matrix: { ...synchronized.matrix, quantityCells } });
        }
        const colors = withColorOrder([
          ...bundle.matrix.colors.filter((row) => !deleted.has(row.id)),
          ...created.map((item) => ({ id: item.id, code: "", displayName: item.displayName, hexValue: item.hexValue, displayOrder: bundle.matrix.colors.length })),
        ]);
        return reconcileSizeColorTotals({ ...bundle, matrix: { ...bundle.matrix, colors, quantityCells } });
      },
      undefined,
      undefined,
      `selection-batch-${targetKind}`,
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
        undefined,
        "quantity-upsert",
        "quantity",
      );
    },
    onSetMeasurementCell: async (sizeRowId, pomColumnId, measurementUnit, displayValue) => {
      const parsed = displayValue === null ? null : parseMeasurementToCm(displayValue, measurementUnit);
      return run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, {
        kind: "set-cell", clientRequestId, expectedVersion, sizeRowId, pomColumnId, measurementUnit, displayValue,
      }, idempotencyKey), undefined, (bundle) => ({
        ...bundle,
        specifications: {
          ...bundle.specifications,
          cells: [
            ...bundle.specifications.cells.filter((cell) => cell.sizeRowId !== sizeRowId || cell.pomColumnId !== pomColumnId),
            { sizeRowId, pomColumnId, displayValue: parsed ? formatMeasurementFromCm(parsed.centimeters, measurementUnit) : null, decimalValue: parsed ? String(parsed.centimeters) : null },
          ],
          sourceTemplateModified: bundle.specifications.templateId !== null,
        },
      }), "set-cell", "measurement-cell", "measurement-cell");
    },
    onSetMeasurementUnit: async (measurementUnit) => {
      const snapshot = current.current;
      if (!snapshot.canEdit || !snapshot.workOrderId || snapshot.entityVersion === null) return false;
      const previousBundle = snapshot.bundle ?? undefined;
      snapshot.onReconcile((bundle) => ({ ...bundle, specifications: { ...bundle.specifications, measurementUnit, cells: bundle.specifications.cells.map((cell) => ({ ...cell, displayValue: cell.decimalValue === null ? null : formatMeasurementFromCm(Number(cell.decimalValue), measurementUnit) })) } }), snapshot.entityVersion);
      const saved = await run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, {
        kind: "set-unit", clientRequestId, expectedVersion, measurementUnit,
      }, idempotencyKey), undefined, undefined, "set-unit", "measurement-unit", "measurement-unit", previousBundle);
      return saved;
    },
    onApplyMeasurementTemplate: async (templateId) => run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, createApplyMeasurementTemplateCommand({ templateId, expectedVersion, clientRequestId }), idempotencyKey), undefined, undefined, "apply-template", "template-apply", "template"),
    onSaveMeasurementTemplate: async (templateName) => run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, { kind: "save-company-template", templateName, expectedVersion, clientRequestId }, idempotencyKey), undefined, undefined, "save-company-template", "company-template-save", "template"),
    onUpdateMeasurementTemplate: async (templateId) => run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, { kind: "update-company-template", templateId, expectedVersion, clientRequestId }, idempotencyKey), undefined, undefined, "update-company-template", "company-template-update", "template"),
    onSetPomSelection: async (selectedItems) => run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, { kind: "set-pom-selection", selectedItems, expectedVersion, clientRequestId }, idempotencyKey), undefined, undefined, "set-pom-selection", "pom-selection-batch", "template"),
  }), [addColorsSequentially, addSizesSequentially, busy, editingWorkOrderId, errorState, input.bundle, input.canEdit, input.workOrderId, pendingScope, run]);

  return { boundary };
}
