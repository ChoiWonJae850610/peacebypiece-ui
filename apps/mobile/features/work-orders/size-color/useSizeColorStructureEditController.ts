import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { beginWaflPresentationFirstOperation } from "@/application/waflPresentationBoundary";
import { runWaflTemplateApplyContentFirst } from "@/application/waflTemplateApplyLifecycle";

import { createSerializedMutationQueue } from "@/application/mutationController";
import type { WorkOrderDraftBatchCoordinator } from "@/application/draftBatchCoordinator";
import { MobileApiError, type MeasurementCommandResult, type MeasurementTemplateContent, type SizeColorStructureCommandResult, type WorkOrderSizeColorBundle } from "@/domain/mobileContract";
import { createApplyMeasurementTemplateCommand } from "@/domain/measurementCommandTransport";
import { formatMeasurementFromCm, parseMeasurementToCm } from "@/domain/measurementPolicy";
import { workOrderMutationController } from "@/features/work-orders/workOrderMutationController";
import { sortColorRows, sortSizeRows } from "@/domain/sizeColorStructurePolicy";
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
import {
  acknowledgeQuantityDirtySnapshot,
  snapshotQuantityDirtyDelta,
  stageQuantityDirtyCell,
  type QuantityDirtyDelta,
} from "./quantityDirtyDeltaPolicy";
import {
  applyLocalSelectionBatchProjection,
  createLocalSizeColorIdentity,
  projectAppliedTemplateValuesForLocalSizes,
  reconcileLocalFinishedSpecSizes as reconcileFinishedSpecSizes,
  remapLocalQuantityIdentity,
} from "./localSizeColorDraftPolicy";
import { getMeasurementTemplateContent } from "@/lib/api/measurementApi";

export type { PendingCommandScope } from "./sizeColorPendingPolicy";

export type SizeColorStructureEditBoundary = {
  readonly canEdit: boolean;
  readonly canEditStructure: boolean;
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

type PendingStructureOperation =
  | { readonly kind: "add-size"; readonly tempId: string; readonly displayLabel: string; readonly clientRequestId: string; readonly idempotencyKey: string }
  | { readonly kind: "rename-size"; readonly sizeRowId: string; readonly displayLabel: string; readonly clientRequestId: string; readonly idempotencyKey: string }
  | { readonly kind: "delete-size"; readonly sizeRowId: string; readonly clientRequestId: string; readonly idempotencyKey: string }
  | { readonly kind: "add-color"; readonly tempId: string; readonly displayName: string; readonly hexValue: string | null; readonly clientRequestId: string; readonly idempotencyKey: string }
  | { readonly kind: "patch-color"; readonly colorId: string; readonly displayName: string; readonly hexValue: string | null; readonly clientRequestId: string; readonly idempotencyKey: string }
  | { readonly kind: "delete-color"; readonly colorId: string; readonly clientRequestId: string; readonly idempotencyKey: string };

type Input = {
  readonly workOrderId: string | null;
  readonly entityVersion: number | null;
  readonly canEdit: boolean;
  readonly canEditStructure: boolean;
  readonly bundle: WorkOrderSizeColorBundle | null;
  readonly onReconcile: (updater: (bundle: WorkOrderSizeColorBundle) => WorkOrderSizeColorBundle, nextVersion: number) => void;
  readonly onTotalQuantityReconcile: (totalQuantity: number, nextVersion: number) => void;
  readonly onVersionReconcile: (nextVersion: number) => void;
  readonly onPromoteProjectionVersion: (nextVersion: number) => void;
  readonly onRefreshSizeSpec: (nextVersion: number) => Promise<void>;
  readonly onConflict: () => Promise<void>;
  readonly onRefreshLatest: () => Promise<LatestProjection | undefined>;
  readonly onAuthenticationError: (error: MobileApiError) => void;
  readonly draftBatch: WorkOrderDraftBatchCoordinator;
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
function isStructureResult(value: SizeColorStructureCommandResult | MeasurementCommandResult): value is SizeColorStructureCommandResult { return "targetKind" in value; }

function remapBundleIdentity(bundle: WorkOrderSizeColorBundle, fromId: string, toId: string, target: "size" | "color") {
  if (target === "size") return {
    ...bundle,
    matrix: {
      ...bundle.matrix,
      sizes: bundle.matrix.sizes.map((row) => row.id === fromId ? { ...row, id: toId } : row),
      quantityCells: bundle.matrix.quantityCells.map((cell) => cell.sizeRowId === fromId ? { ...cell, sizeRowId: toId } : cell),
    },
    specifications: {
      ...bundle.specifications,
      sizes: bundle.specifications.sizes.map((row) => row.id === fromId ? { ...row, id: toId } : row),
      cells: bundle.specifications.cells.map((cell) => cell.sizeRowId === fromId ? { ...cell, sizeRowId: toId } : cell),
    },
  };
  return {
    ...bundle,
    matrix: {
      ...bundle.matrix,
      colors: bundle.matrix.colors.map((row) => row.id === fromId ? { ...row, id: toId } : row),
      quantityCells: bundle.matrix.quantityCells.map((cell) => cell.colorId === fromId ? { ...cell, colorId: toId } : cell),
    },
  };
}

export function useSizeColorStructureEditController(input: Input) {
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingScope, setPendingScope] = useState<PendingCommandScope | null>(null);
  const [errorState, setErrorState] = useState<{ readonly workOrderId: string; readonly message: string } | null>(null);
  const [mutationQueue] = useState(createSerializedMutationQueue);
  const sequence = useRef(0);
  const generation = useRef(0);
  const activeWorkOrderId = useRef(input.workOrderId);
  const authoritativeVersion = useRef(input.entityVersion);
  const current = useRef(input);
  const pendingMeasurementCells = useRef(new Map<string, { readonly sizeRowId: string; readonly pomColumnId: string; readonly measurementUnit: "cm" | "inch"; readonly displayValue: string | null }>());
  const pendingQuantityCells = useRef<QuantityDirtyDelta>(new Map());
  const quantityGeneration = useRef(0);
  const pendingStructureOperations = useRef(new Map<string, PendingStructureOperation>());
  const structureAliases = useRef(new Map<string, string>());
  const localStructureSequence = useRef(0);
  const appliedTemplateContent = useRef<MeasurementTemplateContent | null>(null);
  const templateApplyActive = useRef(false);

  useEffect(() => {
    current.current = input;
    if (activeWorkOrderId.current !== input.workOrderId) {
      generation.current += 1;
      activeWorkOrderId.current = input.workOrderId;
      authoritativeVersion.current = input.entityVersion;
      pendingMeasurementCells.current.clear();
      pendingQuantityCells.current.clear();
      pendingStructureOperations.current.clear();
      structureAliases.current.clear();
      appliedTemplateContent.current = null;
    } else if (input.entityVersion !== null
      && (authoritativeVersion.current === null || input.entityVersion > authoritativeVersion.current)) {
      authoritativeVersion.current = input.entityVersion;
    }
  }, [input]);

  const templateLoadWorkOrderId = input.workOrderId;
  const templateLoadId = input.bundle?.specifications.templateId ?? null;
  const templateLoadVersion = input.bundle?.specifications.templateVersion ?? null;
  const templateLoadGender = input.bundle?.specifications.genderCode ?? null;
  useEffect(() => {
    if (!templateLoadWorkOrderId || !templateLoadId || templateLoadVersion === null) {
      appliedTemplateContent.current = null;
      return;
    }
    if (appliedTemplateContent.current?.templateId === templateLoadId
      && appliedTemplateContent.current.templateVersion === templateLoadVersion) return;
    let active = true;
    void getMeasurementTemplateContent(templateLoadWorkOrderId, templateLoadId, templateLoadGender)
      .then((content) => {
        if (!active || activeWorkOrderId.current !== templateLoadWorkOrderId
          || content.templateId !== templateLoadId || content.templateVersion !== templateLoadVersion) return;
        appliedTemplateContent.current = content;
        current.current.onReconcile(
          (bundle) => projectAppliedTemplateValuesForLocalSizes(bundle, content),
          current.current.entityVersion ?? current.current.bundle?.specifications.entityVersion ?? 0,
        );
      })
      .catch(() => {
        if (active && appliedTemplateContent.current?.templateId === templateLoadId) appliedTemplateContent.current = null;
      });
    return () => { active = false; };
  }, [templateLoadGender, templateLoadId, templateLoadVersion, templateLoadWorkOrderId]);

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

  useEffect(() => input.draftBatch.register("sizes", async () => {
    const snapshot = current.current;
    if (!snapshot.canEdit || !snapshot.workOrderId || snapshot.entityVersion === null) return false;
    if (pendingStructureOperations.current.size === 0 && pendingQuantityCells.current.size === 0) return true;
    const requestWorkOrderId = snapshot.workOrderId;
    const requestGeneration = generation.current;
    return mutationQueue.enqueue(async () => {
      const before = current.current;
      if (!before.canEdit || before.workOrderId !== requestWorkOrderId || requestGeneration !== generation.current) return false;
      setBusy(true);
      setPendingScope("structure");
      try {
        const operations = [...pendingStructureOperations.current.entries()];
        for (const [operationKey, operation] of operations) {
          const expectedVersion = authoritativeVersion.current ?? before.entityVersion ?? 0;
          let result: SizeColorStructureCommandResult;
          if (operation.kind === "add-size") result = await workOrderMutationController.addSize(requestWorkOrderId, { clientRequestId: operation.clientRequestId, expectedVersion, displayLabel: operation.displayLabel }, operation.idempotencyKey);
          else if (operation.kind === "rename-size") result = await workOrderMutationController.renameSize(requestWorkOrderId, structureAliases.current.get(operation.sizeRowId) ?? operation.sizeRowId, { clientRequestId: operation.clientRequestId, expectedVersion, displayLabel: operation.displayLabel }, operation.idempotencyKey);
          else if (operation.kind === "delete-size") result = await workOrderMutationController.deleteSize(requestWorkOrderId, structureAliases.current.get(operation.sizeRowId) ?? operation.sizeRowId, { clientRequestId: operation.clientRequestId, expectedVersion }, operation.idempotencyKey);
          else if (operation.kind === "add-color") result = await workOrderMutationController.addColor(requestWorkOrderId, { clientRequestId: operation.clientRequestId, expectedVersion, displayName: operation.displayName, hexValue: operation.hexValue }, operation.idempotencyKey);
          else if (operation.kind === "patch-color") result = await workOrderMutationController.patchColor(requestWorkOrderId, structureAliases.current.get(operation.colorId) ?? operation.colorId, { clientRequestId: operation.clientRequestId, expectedVersion, patch: { displayName: operation.displayName, hexValue: operation.hexValue } }, operation.idempotencyKey);
          else result = await workOrderMutationController.deleteColor(requestWorkOrderId, structureAliases.current.get(operation.colorId) ?? operation.colorId, { clientRequestId: operation.clientRequestId, expectedVersion }, operation.idempotencyKey);
          if (requestGeneration !== generation.current || activeWorkOrderId.current !== requestWorkOrderId) return false;
          authoritativeVersion.current = result.nextVersion;
          const currentOperation = pendingStructureOperations.current.get(operationKey);
          if (currentOperation === operation) pendingStructureOperations.current.delete(operationKey);
          if ((operation.kind === "add-size" || operation.kind === "add-color") && result.targetId) {
            const tempId = operation.tempId;
            structureAliases.current.set(tempId, result.targetId);
            if (currentOperation !== operation) {
              const ids = identity();
              if (!currentOperation) {
                pendingStructureOperations.current.set(operationKey, operation.kind === "add-size"
                  ? { kind: "delete-size", sizeRowId: tempId, ...ids }
                  : { kind: "delete-color", colorId: tempId, ...ids });
              } else if (currentOperation.kind === "add-size") {
                pendingStructureOperations.current.set(operationKey, { kind: "rename-size", sizeRowId: tempId, displayLabel: currentOperation.displayLabel, ...ids });
              } else if (currentOperation.kind === "add-color") {
                pendingStructureOperations.current.set(operationKey, { kind: "patch-color", colorId: tempId, displayName: currentOperation.displayName, hexValue: currentOperation.hexValue, ...ids });
              }
            }
            before.onReconcile((bundle) => remapBundleIdentity(bundle, tempId, result.targetId as string, operation.kind === "add-size" ? "size" : "color"), result.nextVersion);
            const remappedQuantities = [...pendingQuantityCells.current.values()].filter(({ cell }) => cell.sizeRowId === tempId || cell.colorId === tempId);
            for (const entry of remappedQuantities) {
              const oldKey = `${entry.cell.colorId}:${entry.cell.sizeRowId}`;
              pendingQuantityCells.current.delete(oldKey);
              stageQuantityDirtyCell(pendingQuantityCells.current, remapLocalQuantityIdentity(entry.cell, tempId, result.targetId), entry.generation);
            }
            for (const [key, cell] of pendingMeasurementCells.current) {
              if (cell.sizeRowId === tempId) {
                pendingMeasurementCells.current.delete(key);
                const next = { ...cell, sizeRowId: result.targetId };
                pendingMeasurementCells.current.set(`${next.sizeRowId}:${next.pomColumnId}`, next);
              }
            }
          }
          before.onVersionReconcile(result.nextVersion);
        }

        const staged = snapshotQuantityDirtyDelta(pendingQuantityCells.current);
        const cells = staged.map(({ cell }) => cell);
        if (cells.length > 0) {
          const ids = identity();
          setPendingScope("quantity");
          const result = await workOrderMutationController.batchQuantities(requestWorkOrderId, {
            clientRequestId: ids.clientRequestId,
            expectedVersion: authoritativeVersion.current ?? before.entityVersion ?? 0,
            cells,
          }, ids.idempotencyKey);
          if (requestGeneration !== generation.current || activeWorkOrderId.current !== requestWorkOrderId) return false;
          authoritativeVersion.current = result.nextVersion;
          acknowledgeQuantityDirtySnapshot(pendingQuantityCells.current, staged);
          const requested = new Map(cells.map((cell) => [`${cell.colorId}:${cell.sizeRowId}`, cell.quantity]));
          before.onReconcile((bundle) => {
            let next = bundle;
            for (const cell of result.quantityCells ?? cells) {
              const key = `${cell.colorId}:${cell.sizeRowId}`;
              const local = next.matrix.quantityCells.find((candidate) => candidate.colorId === cell.colorId && candidate.sizeRowId === cell.sizeRowId);
              if (Number(local?.quantity ?? 0) === requested.get(key)) next = reconcileQuantityCell(next, cell.colorId, cell.sizeRowId, cell.quantity);
            }
            return next;
          }, result.nextVersion);
          before.onTotalQuantityReconcile(result.totalQuantity ?? Number(before.bundle?.matrix.matrixTotal ?? 0), result.nextVersion);
          before.onVersionReconcile(result.nextVersion);
        }
        if (operations.length > 0 && authoritativeVersion.current !== null) {
          await before.onRefreshSizeSpec(authoritativeVersion.current);
        }
        return true;
      } catch (error) {
        if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) before.onAuthenticationError(error);
        else if (isConflict(error)) await before.onConflict();
        else reportError(requestWorkOrderId, error, "사이즈·색상 수량을 저장하지 못했습니다.");
        return false;
      } finally {
        setBusy(false);
        setPendingScope(null);
      }
    });
  }), [identity, input.draftBatch, mutationQueue, reportError]);

  useEffect(() => input.draftBatch.register("finished-spec", async () => {
    const cells = [...pendingMeasurementCells.current.values()];
    const snapshot = current.current;
    if (cells.length === 0) return true;
    if (!snapshot.canEdit || !snapshot.workOrderId || snapshot.entityVersion === null) return false;
    const requestWorkOrderId = snapshot.workOrderId;
    const requestGeneration = generation.current;
    return mutationQueue.enqueue(async () => {
      const before = current.current;
      if (!before.canEdit || before.workOrderId !== requestWorkOrderId || requestGeneration !== generation.current) return false;
      const ids = identity();
      setBusy(true);
      setPendingScope("measurement-cell");
      try {
        const result = await workOrderMutationController.mutateMeasurement(requestWorkOrderId, {
          kind: "set-cells",
          clientRequestId: ids.clientRequestId,
          expectedVersion: authoritativeVersion.current ?? before.entityVersion ?? 0,
          cells,
        }, ids.idempotencyKey);
        if (requestGeneration !== generation.current || activeWorkOrderId.current !== requestWorkOrderId) return false;
        authoritativeVersion.current = result.nextVersion;
        for (const cell of cells) {
          const key = `${cell.sizeRowId}:${cell.pomColumnId}`;
          const pending = pendingMeasurementCells.current.get(key);
          if (pending && JSON.stringify(pending) === JSON.stringify(cell)) pendingMeasurementCells.current.delete(key);
        }
        before.onPromoteProjectionVersion(result.nextVersion);
        before.onVersionReconcile(result.nextVersion);
        return true;
      } catch (error) {
        if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) before.onAuthenticationError(error);
        else if (isConflict(error)) await before.onConflict();
        else reportError(requestWorkOrderId, error, "완성 스펙을 저장하지 못했습니다.");
        return false;
      } finally {
        setBusy(false);
        setPendingScope(null);
      }
    });
  }), [identity, input.draftBatch, mutationQueue, reportError]);

  const run = useCallback(async (
    changed: boolean,
    request: (context: { readonly workOrderId: string; readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string }) => Promise<SizeColorStructureCommandResult | MeasurementCommandResult>,
    reconcile?: (bundle: WorkOrderSizeColorBundle, result: SizeColorStructureCommandResult) => WorkOrderSizeColorBundle,
    optimistic?: (bundle: WorkOrderSizeColorBundle) => WorkOrderSizeColorBundle,
    projectionCommand?: MeasurementProjectionCommandKind,
    metricName = "size-color-structure",
    scope: PendingCommandScope = "structure",
    failureRollbackBundle?: WorkOrderSizeColorBundle,
    presentationBeforeRequest = false,
    failureMessage = "변경을 저장하지 못했습니다.",
  ) => {
    const initial = current.current;
    if (!changed || !initial.canEdit || !initial.workOrderId || initial.entityVersion === null) return false;
    let presentationPendingOwned = false;
    const clearPresentationPending = () => {
      if (!presentationPendingOwned) return;
      presentationPendingOwned = false;
      setBusy(false);
      setPendingScope(null);
    };
    if (presentationBeforeRequest) {
      await beginWaflPresentationFirstOperation({
        enterPending: () => {
          presentationPendingOwned = true;
          setBusy(true);
          setPendingScope(scope);
        },
      });
    }
    if (scope !== "quantity" && input.draftBatch.isDirty("sizes")) {
      const flushed = await input.draftBatch.flushSection("sizes", "explicit");
      if (!flushed.committed) {
        clearPresentationPending();
        return false;
      }
    }
    if (scope !== "measurement-cell" && input.draftBatch.isDirty("finished-spec")) {
      const flushed = await input.draftBatch.flushSection("finished-spec", "explicit");
      if (!flushed.committed) {
        clearPresentationPending();
        return false;
      }
    }
    const requestGeneration = generation.current;
    const requestWorkOrderId = initial.workOrderId;
    const timing = createDevMutationTiming(metricName);
    if (scope === "measurement-unit") timing.markVisibleComplete();
    setErrorState(null);
    return mutationQueue.enqueue(async () => {
      const snapshot = current.current;
      if (!snapshot.canEdit || snapshot.workOrderId !== requestWorkOrderId || snapshot.entityVersion === null
        || requestGeneration !== generation.current) {
        clearPresentationPending();
        return false;
      }
      const ids = identity();
      let optimisticApplied = false;
      let conflictRefreshed = false;
      if (optimistic && snapshot.bundle) {
        const optimisticBundle = optimistic(snapshot.bundle);
        snapshot.onReconcile(() => optimisticBundle, snapshot.entityVersion);
        snapshot.onTotalQuantityReconcile(Number(optimisticBundle.matrix.matrixTotal), snapshot.entityVersion);
        optimisticApplied = true;
      }
      if (!presentationBeforeRequest) {
        setBusy(true);
        setPendingScope(scope);
      }
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
        } else reportError(requestWorkOrderId, error, failureMessage);
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
        presentationPendingOwned = false;
        setBusy(false);
        setPendingScope(null);
        timing.markBusyRelease();
      }
    });
  }, [identity, input.draftBatch, mutationQueue, reportError]);

  const stageSizesDraft = useCallback(() => {
    current.current.draftBatch.stage("sizes", {
      structureCount: pendingStructureOperations.current.size,
      quantities: snapshotQuantityDirtyDelta(pendingQuantityCells.current),
    });
  }, []);

  const stageSelectionBatch = useCallback((
    targetKind: "size" | "color",
    additions: readonly StructureSelectionCandidate[],
    deletionIds: readonly string[],
  ) => {
    const snapshot = current.current;
    if (!snapshot.canEditStructure || !snapshot.bundle) return false;
    const deletionSet = new Set(deletionIds);
    if (targetKind === "size") {
      const planned: { readonly tempId: string; readonly displayLabel: string }[] = [];
      let nextSizes = snapshot.bundle.matrix.sizes.filter((row) => !deletionSet.has(row.id));
      for (const addition of additions) {
        const validated = validateSizeLabel(addition.displayName, nextSizes);
        if (validated.error) {
          setErrorState({ workOrderId: snapshot.workOrderId ?? "", message: validated.error });
          return false;
        }
        localStructureSequence.current += 1;
        const tempId = createLocalSizeColorIdentity("size", localStructureSequence.current);
        planned.push({ tempId, displayLabel: validated.value });
        nextSizes = [...nextSizes, { id: tempId, code: validated.value, displayLabel: validated.value, displayOrder: nextSizes.length }];
      }
      for (const row of snapshot.bundle.matrix.sizes.filter((candidate) => deletionSet.has(candidate.id))) {
        const pending = pendingStructureOperations.current.get(row.id);
        if (pending?.kind === "add-size") pendingStructureOperations.current.delete(row.id);
        else pendingStructureOperations.current.set(row.id, { kind: "delete-size", sizeRowId: row.id, ...identity() });
      }
      for (const addition of planned) pendingStructureOperations.current.set(addition.tempId, {
        kind: "add-size", tempId: addition.tempId, displayLabel: addition.displayLabel, ...identity(),
      });
      for (const [key, entry] of pendingQuantityCells.current) {
        if (deletionSet.has(entry.cell.sizeRowId)) pendingQuantityCells.current.delete(key);
      }
      for (const [key, cell] of pendingMeasurementCells.current) {
        if (deletionSet.has(cell.sizeRowId)) pendingMeasurementCells.current.delete(key);
      }
      const nextBundle = applyLocalSelectionBatchProjection({
        bundle: snapshot.bundle,
        targetKind,
        additions: planned.map((addition) => ({ ...addition, displayName: addition.displayLabel, hexValue: null })),
        deletionIds,
        template: appliedTemplateContent.current,
      });
      snapshot.onReconcile(() => nextBundle, snapshot.entityVersion ?? snapshot.bundle.matrix.entityVersion);
    } else {
      const planned: { readonly tempId: string; readonly displayName: string; readonly hexValue: string | null }[] = [];
      let nextColors = snapshot.bundle.matrix.colors.filter((row) => !deletionSet.has(row.id));
      for (const addition of additions) {
        const validated = validateColorDraft({
          displayName: addition.displayName,
          hexValue: addition.hexValue ?? "#D8D2CA",
        }, nextColors);
        if (validated.error) {
          setErrorState({ workOrderId: snapshot.workOrderId ?? "", message: validated.error });
          return false;
        }
        localStructureSequence.current += 1;
        const tempId = createLocalSizeColorIdentity("color", localStructureSequence.current);
        planned.push({ tempId, displayName: validated.displayName, hexValue: validated.hexValue });
        nextColors = [...nextColors, { id: tempId, displayName: validated.displayName, hexValue: validated.hexValue, displayOrder: nextColors.length }];
      }
      for (const row of snapshot.bundle.matrix.colors.filter((candidate) => deletionSet.has(candidate.id))) {
        const pending = pendingStructureOperations.current.get(row.id);
        if (pending?.kind === "add-color") pendingStructureOperations.current.delete(row.id);
        else pendingStructureOperations.current.set(row.id, { kind: "delete-color", colorId: row.id, ...identity() });
      }
      for (const addition of planned) pendingStructureOperations.current.set(addition.tempId, {
        kind: "add-color", tempId: addition.tempId, displayName: addition.displayName, hexValue: addition.hexValue, ...identity(),
      });
      for (const [key, entry] of pendingQuantityCells.current) {
        if (deletionSet.has(entry.cell.colorId)) pendingQuantityCells.current.delete(key);
      }
      const nextBundle = applyLocalSelectionBatchProjection({
        bundle: snapshot.bundle,
        targetKind,
        additions: planned,
        deletionIds,
        template: appliedTemplateContent.current,
      });
      snapshot.onReconcile(() => nextBundle, snapshot.entityVersion ?? snapshot.bundle.matrix.entityVersion);
    }
    stageSizesDraft();
    return true;
  }, [identity, stageSizesDraft]);

  const stageAddSize = useCallback((displayLabel: string) => {
    return stageSelectionBatch("size", [{ displayName: displayLabel, hexValue: null }], []);
  }, [stageSelectionBatch]);

  const stageAddColor = useCallback((draft: ColorStructureDraft) => {
    return stageSelectionBatch("color", [{ displayName: draft.displayName, hexValue: draft.hexValue }], []);
  }, [stageSelectionBatch]);

  const boundary = useMemo<SizeColorStructureEditBoundary>(() => ({
    canEdit: input.canEdit,
    canEditStructure: input.canEditStructure,
    editing: input.canEditStructure && editingWorkOrderId === input.workOrderId,
    busy,
    pendingScope,
    errorMessage: errorState?.workOrderId === input.workOrderId ? errorState.message : null,
    onBegin: () => { if (input.canEditStructure) { setErrorState(null); setEditingWorkOrderId(input.workOrderId); } },
    onCancel: () => { if (!busy) { setEditingWorkOrderId(null); setErrorState(null); } },
    onAddSize: async (displayLabel) => {
      return stageAddSize(displayLabel);
    },
    onAddSizes: async (displayLabels) => {
      const staged = stageSelectionBatch("size", displayLabels.map((displayName) => ({ displayName, hexValue: null })), []);
      return { added: staged ? displayLabels.length : 0, failed: staged ? null : displayLabels[0] ?? null };
    },
    onRenameSize: async (sizeRowId, displayLabel) => {
      const sizes = input.bundle?.matrix.sizes ?? [];
      const currentRow = sizes.find((row) => row.id === sizeRowId);
      if (!currentRow) return false;
      const validated = validateSizeLabel(displayLabel, sizes, sizeRowId);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      if (validated.value === currentRow.displayLabel) return true;
      const pending = pendingStructureOperations.current.get(sizeRowId);
      const ids = identity();
      pendingStructureOperations.current.set(sizeRowId, pending?.kind === "add-size"
        ? { ...pending, displayLabel: validated.value }
        : { kind: "rename-size", sizeRowId, displayLabel: validated.value, ...ids });
      input.onReconcile((bundle) => reconcileFinishedSpecSizes(bundle, withSizeOrder(bundle.matrix.sizes.map((row) => row.id === sizeRowId ? { ...row, code: validated.value, displayLabel: validated.value } : row)), appliedTemplateContent.current), input.entityVersion ?? input.bundle?.matrix.entityVersion ?? 0);
      stageSizesDraft();
      return true;
    },
    onDeleteSize: async (sizeRowId) => {
      const pending = pendingStructureOperations.current.get(sizeRowId);
      if (pending?.kind === "add-size") pendingStructureOperations.current.delete(sizeRowId);
      else {
        const ids = identity();
        pendingStructureOperations.current.set(sizeRowId, { kind: "delete-size", sizeRowId, ...ids });
      }
      input.onReconcile((bundle) => {
        const nextSizes = withSizeOrder(bundle.matrix.sizes.filter((row) => row.id !== sizeRowId));
        const synchronized = reconcileFinishedSpecSizes(bundle, nextSizes, appliedTemplateContent.current);
        return reconcileSizeColorTotals({ ...synchronized, matrix: { ...synchronized.matrix, quantityCells: bundle.matrix.quantityCells.filter((cell) => cell.sizeRowId !== sizeRowId) } });
      }, input.entityVersion ?? input.bundle?.matrix.entityVersion ?? 0);
      for (const [key, entry] of pendingQuantityCells.current) if (entry.cell.sizeRowId === sizeRowId) pendingQuantityCells.current.delete(key);
      stageSizesDraft();
      return true;
    },
    onAddColor: async (draft) => {
      const colors = input.bundle?.matrix.colors ?? [];
      const validated = validateColorDraft(draft, colors);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      return stageAddColor(draft);
    },
    onAddColors: async (drafts) => {
      const staged = stageSelectionBatch("color", drafts.map((draft) => ({ displayName: draft.displayName, hexValue: draft.hexValue })), []);
      return { added: staged ? drafts.length : 0, failed: staged ? null : drafts[0]?.displayName ?? null };
    },
    onPatchColor: async (colorId, draft) => {
      const colors = input.bundle?.matrix.colors ?? [];
      const currentRow = colors.find((row) => row.id === colorId);
      if (!currentRow) return false;
      const validated = validateColorDraft(draft, colors, colorId);
      if (validated.error) { setErrorState({ workOrderId: input.workOrderId ?? "", message: validated.error }); return false; }
      if (sameColorDraft(currentRow, draft)) return true;
      const pending = pendingStructureOperations.current.get(colorId);
      const ids = identity();
      pendingStructureOperations.current.set(colorId, pending?.kind === "add-color"
        ? { ...pending, displayName: validated.displayName, hexValue: validated.hexValue }
        : { kind: "patch-color", colorId, displayName: validated.displayName, hexValue: validated.hexValue, ...ids });
      input.onReconcile((bundle) => ({ ...bundle, matrix: { ...bundle.matrix, colors: withColorOrder(bundle.matrix.colors.map((row) => row.id === colorId ? { ...row, displayName: validated.displayName, hexValue: validated.hexValue } : row)) } }), input.entityVersion ?? input.bundle?.matrix.entityVersion ?? 0);
      stageSizesDraft();
      return true;
    },
    onDeleteColor: async (colorId) => {
      const pending = pendingStructureOperations.current.get(colorId);
      if (pending?.kind === "add-color") pendingStructureOperations.current.delete(colorId);
      else {
        const ids = identity();
        pendingStructureOperations.current.set(colorId, { kind: "delete-color", colorId, ...ids });
      }
      input.onReconcile((bundle) => reconcileSizeColorTotals({
        ...bundle,
        matrix: {
          ...bundle.matrix,
          colors: withColorOrder(bundle.matrix.colors.filter((row) => row.id !== colorId)),
          quantityCells: bundle.matrix.quantityCells.filter((cell) => cell.colorId !== colorId),
        },
      }), input.entityVersion ?? input.bundle?.matrix.entityVersion ?? 0);
      for (const [key, entry] of pendingQuantityCells.current) if (entry.cell.colorId === colorId) pendingQuantityCells.current.delete(key);
      stageSizesDraft();
      return true;
    },
    onApplySelectionBatch: async (targetKind, additions, deletionIds) => {
      return stageSelectionBatch(targetKind, additions, deletionIds);
    },
    onSetQuantity: async (colorId, sizeRowId, quantity) => {
      const snapshot = current.current;
      const currentCell = snapshot.bundle?.matrix.quantityCells.find((cell) => cell.colorId === colorId && cell.sizeRowId === sizeRowId);
      const currentQuantity = Number(currentCell?.quantity ?? 0);
      if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000_000) { setErrorState({ workOrderId: snapshot.workOrderId ?? "", message: "수량은 0 이상의 정수로 입력해 주세요." }); return false; }
      if (quantity === currentQuantity && snapshot.bundle?.matrix.projectionsMatch !== false) return true;
      if (!snapshot.canEdit || !snapshot.bundle) return false;
      const optimistic = reconcileQuantityCell(snapshot.bundle, colorId, sizeRowId, quantity);
      const localVersion = snapshot.entityVersion ?? optimistic.matrix.entityVersion;
      snapshot.onReconcile(() => optimistic, localVersion);
      snapshot.onTotalQuantityReconcile(Number(optimistic.matrix.matrixTotal), localVersion);
      quantityGeneration.current += 1;
      stageQuantityDirtyCell(pendingQuantityCells.current, { colorId, sizeRowId, quantity }, quantityGeneration.current);
      stageSizesDraft();
      return true;
    },
    onSetMeasurementCell: async (sizeRowId, pomColumnId, measurementUnit, displayValue) => {
      const parsed = displayValue === null ? null : parseMeasurementToCm(displayValue, measurementUnit);
      if (displayValue !== null && !parsed) return false;
      if (!input.canEdit || !input.bundle) return false;
      const optimistic = {
        ...input.bundle,
        specifications: {
          ...input.bundle.specifications,
          cells: [
            ...input.bundle.specifications.cells.filter((cell) => cell.sizeRowId !== sizeRowId || cell.pomColumnId !== pomColumnId),
            { sizeRowId, pomColumnId, displayValue: parsed ? formatMeasurementFromCm(parsed.centimeters, measurementUnit) : null, decimalValue: parsed ? String(parsed.centimeters) : null },
          ],
          sourceTemplateModified: input.bundle.specifications.templateId !== null,
        },
      };
      input.onReconcile(() => optimistic, input.entityVersion ?? optimistic.specifications.entityVersion);
      const cell = { sizeRowId, pomColumnId, measurementUnit, displayValue } as const;
      pendingMeasurementCells.current.set(`${sizeRowId}:${pomColumnId}`, cell);
      input.draftBatch.stage("finished-spec", [...pendingMeasurementCells.current.values()]);
      return true;
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
    onApplyMeasurementTemplate: async (templateId) => {
      const snapshot = current.current;
      if (!snapshot.workOrderId || templateApplyActive.current) return false;
      templateApplyActive.current = true;
      let content: MeasurementTemplateContent | null = null;
      const applyGeneration = generation.current;
      const applyWorkOrderId = snapshot.workOrderId;
      try {
        const saved = await run(true, async ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => {
          const outcome = await runWaflTemplateApplyContentFirst({
            fetchContent: () => getMeasurementTemplateContent(workOrderId, templateId, snapshot.bundle?.specifications.genderCode ?? null),
            applyTemplate: () => workOrderMutationController.mutateMeasurement(workOrderId, createApplyMeasurementTemplateCommand({ templateId, expectedVersion, clientRequestId }), idempotencyKey),
            isCurrent: (fetchedContent) => activeWorkOrderId.current === applyWorkOrderId
              && generation.current === applyGeneration
              && fetchedContent.templateId === templateId,
            publishAppliedContent: (fetchedContent) => {
              content = fetchedContent;
              appliedTemplateContent.current = fetchedContent;
            },
          });
          return outcome.result;
        }, undefined, undefined, "apply-template", "template-apply", "template", undefined, true, "스펙 내용을 불러오지 못했습니다.");
        if (!saved && appliedTemplateContent.current === content) appliedTemplateContent.current = null;
        return saved;
      } finally {
        templateApplyActive.current = false;
      }
    },
    onSaveMeasurementTemplate: async (templateName) => run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, { kind: "save-company-template", templateName, expectedVersion, clientRequestId }, idempotencyKey), undefined, undefined, "save-company-template", "company-template-save", "template"),
    onUpdateMeasurementTemplate: async (templateId) => run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, { kind: "update-company-template", templateId, expectedVersion, clientRequestId }, idempotencyKey), undefined, undefined, "update-company-template", "company-template-update", "template"),
    onSetPomSelection: async (selectedItems) => run(true, ({ workOrderId, expectedVersion, clientRequestId, idempotencyKey }) => workOrderMutationController.mutateMeasurement(workOrderId, { kind: "set-pom-selection", selectedItems, expectedVersion, clientRequestId }, idempotencyKey), undefined, undefined, "set-pom-selection", "pom-selection-batch", "template"),
  }), [busy, editingWorkOrderId, errorState, identity, input.bundle, input.canEdit, input.canEditStructure, input.entityVersion, input.onReconcile, input.workOrderId, pendingScope, reportError, run, stageAddColor, stageAddSize, stageSelectionBatch, stageSizesDraft]);

  return { boundary };
}
