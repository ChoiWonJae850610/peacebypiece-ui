import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { materialErrorMessage, type MobileErrorState } from "@/application/errorPresentation";
import { createExplicitMutationController, type SerializedMutationQueue } from "@/application/mutationController";
import { runWaflProcessingAction } from "@/application/waflActionExecution";
import type { WorkOrderDraftBatchCoordinator } from "@/application/draftBatchCoordinator";
import { planInlineEditTransition } from "@/application/inlineEditTransition";
import type { MaterialEditorViewState } from "@/features/materials/WorkOrderMaterialEditor";
import type { MaterialReadStatus } from "@/features/materials/WorkOrderMaterialsReadOnly";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
import { showWaflAlert } from "@/features/feedback/waflFeedbackStore";
import {
  createMaterialInlineEditSession,
  ownsMaterialInlineEditSession,
  type MaterialInlineEditSession,
} from "@/features/materials/materialInlineEditSession";
import {
  materialCacheKey,
  putBoundedMaterialEntry,
  type MaterialCacheEntry,
} from "@/features/materials/materialCache";
import { canEditMaterial, canEditWorkOrder, canPerformMaterialOrderAction, REORDER_MATERIAL_EDITABLE_FIELDS } from "@/domain/workOrderPolicy";
import type { MaterialOrderAction } from "@/domain/materialOrderPolicy";
import {
  createMaterialDraft,
  materialDraftFromLine,
  materialCreateDraft,
  materialPatch,
  normalizeMaterialDraft,
  sameMaterialDraft,
  validateMaterialDraft,
  validateMaterialCreateDraft,
  validateMaterialOrderRequest,
  basicInfoDraftFromDetail,
  type BasicInfoDraft,
  type MaterialEditorFieldErrors,
} from "@/domain/workOrderValidation";
import {
  materialInformationSubject,
  materialLatestCopy,
  materialMutationFailureCopy,
  materialMutationSuccessCopy,
  materialNoun,
} from "@/domain/materialSemanticCopy";
import type {
  MaterialDraftFields,
  MaterialDraftUpdate,
  MaterialType,
  MobileCurrentUser,
  WorkOrderDetailCore,
  WorkOrderListItem,
  WorkOrderMaterialLine,
} from "@/domain/mobileContract";
import { canExecuteMaterialOrderInteraction } from "@/domain/materialOrderInteractionPolicy";
import { MobileApiError } from "@/domain/mobileContract";
import { workOrderMutationController } from "@/features/work-orders/workOrderMutationController";
import { workOrderQueryController } from "@/features/work-orders/workOrderQueryController";

type Input = {
  readonly detail: WorkOrderDetailCore | null;
  readonly user: MobileCurrentUser | null;
  readonly selectedWorkOrderId: MutableRefObject<string | null>;
  readonly mutationQueue: SerializedMutationQueue;
  readonly setDetail: Dispatch<SetStateAction<WorkOrderDetailCore | null>>;
  readonly setBasicInfoDraft: Dispatch<SetStateAction<BasicInfoDraft>>;
  readonly setItems: Dispatch<SetStateAction<readonly WorkOrderListItem[]>>;
  readonly setSelected: Dispatch<SetStateAction<WorkOrderListItem | null>>;
  readonly partnerOptions: readonly import("@/domain/mobileContract").MaterialPartnerOption[];
  readonly prepareOverviewForCreate: () => boolean;
  readonly prepareOverviewForEdit: () => void;
  readonly requestFeatureTransition: (onProceed: () => void) => void;
  readonly onKnownEntityVersion: (workOrderId: string, entityVersion: number | null) => void;
  readonly setRequestError: (error: unknown, retryTarget: MobileErrorState["retryTarget"]) => void;
  readonly showToast: (message: string, tone?: "success" | "warning" | "error") => void;
  readonly onActionProcessing: (message: string | null) => void;
  readonly draftBatch: WorkOrderDraftBatchCoordinator;
};

function materialLabel(materialType: MaterialType) {
  return materialNoun(materialType);
}

export function useWorkOrderMaterialAuthoringController(input: Input) {
  const { detail, user, selectedWorkOrderId, mutationQueue: inlineMutationQueue, setDetail, setBasicInfoDraft, setItems, setSelected, setRequestError, showToast } = input;
  const [materialCache, setMaterialCache] = useState<Readonly<Record<string, MaterialCacheEntry>>>({});
  const [activeMaterialType, setActiveMaterialType] = useState<MaterialType>("fabric");
  const [materialEditor, setMaterialEditor] = useState<MaterialEditorViewState | null>(null);
  const [activeMaterialField, setActiveMaterialField] = useState<keyof MaterialDraftFields | null>(null);
  const [activeMaterialInlineSession, setActiveMaterialInlineSession] = useState<MaterialInlineEditSession | null>(null);
  const materialSaveNotice = null;
  const [materialLifecycleBusyId, setMaterialLifecycleBusyId] = useState<string | null>(null);
  const [materialOrderBusyId, setMaterialOrderBusyId] = useState<string | null>(null);
  const [materialOrderBusyAction, setMaterialOrderBusyAction] = useState<MaterialOrderAction | null>(null);
  const materialMutation = useRef(createExplicitMutationController()).current;
  const materialLifecycleMutation = useRef(createExplicitMutationController()).current;
  const materialOrderMutation = useRef(createExplicitMutationController()).current;
  const clientRequestCounter = useRef(0);
  const detailRef = useRef(detail);
  const materialCacheRef = useRef<Readonly<Record<string, MaterialCacheEntry>>>({});
  const materialRequests = useRef(new Map<string, number>());
  const materialRequestSequence = useRef(0);
  const materialSessionGeneration = useRef(0);
  const materialEditorSequence = useRef(0);
  const materialEditorRef = useRef<MaterialEditorViewState | null>(null);
  const materialInlineSessionRef = useRef<MaterialInlineEditSession | null>(null);
  const materialInlineSessionSequence = useRef(0);
  const materialLifecycleSequence = useRef(0);
  const materialOrderSequence = useRef(0);
  const pendingMaterialPatches = useRef(new Map<string, {
    readonly workOrderId: string;
    readonly materialLineId: string;
    readonly materialType: MaterialType;
    readonly normalizedDraft: MaterialDraftFields;
    readonly patch: MaterialDraftUpdate;
  }>());
  const pendingMaterialCreates = useRef(new Map<string, {
    readonly workOrderId: string;
    readonly tempMaterialLineId: string;
    readonly materialType: MaterialType;
    readonly normalizedDraft: MaterialDraftFields;
    readonly idempotencyKey: string;
  }>());
  const materialIdAliases = useRef(new Map<string, string>());

  useEffect(() => { detailRef.current = detail; }, [detail]);

  const setMaterialSaveNotice = useCallback((message: string | null) => {
    if (message) showToast(message);
  }, [showToast]);
  const updateMaterialEditor = useCallback((updater: (current: MaterialEditorViewState | null) => MaterialEditorViewState | null) => {
    setMaterialEditor((current) => {
      const next = updater(current);
      materialEditorRef.current = next;
      return next;
    });
  }, []);
  const closeMaterialEditorSession = useCallback(() => {
    materialEditorRef.current = null;
    materialInlineSessionRef.current = null;
    setMaterialEditor(null);
    setActiveMaterialInlineSession(null);
    setActiveMaterialField(null);
  }, []);
  const closeOwnedMaterialEditorSession = useCallback((owner: MaterialInlineEditSession) => {
    if (!ownsMaterialInlineEditSession(materialInlineSessionRef.current, owner)) return false;
    closeMaterialEditorSession();
    return true;
  }, [closeMaterialEditorSession]);
  const updateMaterialCache = useCallback((updater: (current: Readonly<Record<string, MaterialCacheEntry>>) => Readonly<Record<string, MaterialCacheEntry>>) => {
    setMaterialCache((current) => {
      const next = updater(current);
      materialCacheRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => input.draftBatch.register("materials", async () => {
    const queuedCreates = [...pendingMaterialCreates.current.values()];
    const queuedPatches = [...pendingMaterialPatches.current.values()];
    if (queuedCreates.length === 0 && queuedPatches.length === 0) return true;
    return inlineMutationQueue.enqueue(async () => {
      for (const entry of queuedCreates) {
        const latest = detailRef.current;
        if (!latest || latest.header.id !== entry.workOrderId) return false;
        try {
          const saved = await workOrderMutationController.createMaterial(entry.workOrderId, {
            clientRequestId: nextMaterialRequestIdentity("client"),
            expectedVersion: latest.header.entityVersion,
            materialType: entry.materialType,
            ...entry.normalizedDraft,
          }, entry.idempotencyKey);
          const page = await workOrderQueryController.materials(entry.workOrderId, entry.materialType);
          const authoritative = page.items.find((item) => item.id === saved.result.materialLineId);
          if (!authoritative || page.entityVersion !== saved.nextVersion) return false;
          const nextDetail = { ...latest, header: { ...latest.header, entityVersion: saved.nextVersion } };
          detailRef.current = nextDetail;
          setDetail(nextDetail);
          input.onKnownEntityVersion(entry.workOrderId, saved.nextVersion);
          materialIdAliases.current.set(entry.tempMaterialLineId, authoritative.id);
          const current = pendingMaterialCreates.current.get(entry.tempMaterialLineId);
          const changedWhileSaving = current?.idempotencyKey === entry.idempotencyKey
            && JSON.stringify(current.normalizedDraft) !== JSON.stringify(entry.normalizedDraft);
          pendingMaterialCreates.current.delete(entry.tempMaterialLineId);
          if (changedWhileSaving && current) {
            pendingMaterialPatches.current.set(entry.tempMaterialLineId, {
              workOrderId: entry.workOrderId,
              materialLineId: entry.tempMaterialLineId,
              materialType: entry.materialType,
              normalizedDraft: current.normalizedDraft,
              patch: materialPatch(materialDraftFromLine(authoritative), current.normalizedDraft),
            });
          }
          const cacheKey = materialCacheKey(entry.workOrderId, entry.materialType);
          updateMaterialCache((entries) => {
            const cached = entries[cacheKey];
            if (!cached) return entries;
            return putBoundedMaterialEntry(entries, cacheKey, {
              ...cached,
              entityVersion: saved.nextVersion,
              items: cached.items.map((item) => item.id === entry.tempMaterialLineId ? changedWhileSaving && current ? {
                ...authoritative,
                name: current.normalizedDraft.name,
                colorOption: current.normalizedDraft.colorOption || null,
                usageArea: current.normalizedDraft.usageArea || null,
                partnerId: current.normalizedDraft.partnerId || null,
                partnerName: input.partnerOptions.find((partner) => partner.id === current.normalizedDraft.partnerId)?.name ?? authoritative.partnerName,
                requiredQuantity: current.normalizedDraft.requiredQuantity,
                allowanceQuantity: current.normalizedDraft.allowanceQuantity,
                inventoryUsageQuantity: current.normalizedDraft.inventoryUsageQuantity,
                unitCode: current.normalizedDraft.unitCode,
                unitPrice: current.normalizedDraft.unitPrice,
                memo: current.normalizedDraft.memo || null,
              } : authoritative : item),
              touchedAt: Date.now(),
            });
          });
        } catch (error) {
          setMaterialSaveNotice(error instanceof MobileApiError ? error.message : materialMutationFailureCopy(entry.materialType, "edit"));
          return false;
        }
      }
      for (const entry of queuedPatches) {
        const latest = detailRef.current;
        if (!latest || latest.header.id !== entry.workOrderId) return false;
        const materialLineId = materialIdAliases.current.get(entry.materialLineId) ?? entry.materialLineId;
        try {
          const saved = await workOrderMutationController.updateMaterial(entry.workOrderId, materialLineId, {
            clientRequestId: nextMaterialRequestIdentity("client"),
            expectedVersion: latest.header.entityVersion,
            patch: entry.patch,
          });
          const nextDetail = { ...latest, header: { ...latest.header, entityVersion: saved.nextVersion } };
          detailRef.current = nextDetail;
          setDetail(nextDetail);
          input.onKnownEntityVersion(entry.workOrderId, saved.nextVersion);
          const pending = pendingMaterialPatches.current.get(entry.materialLineId);
          if (pending && JSON.stringify(pending.patch) === JSON.stringify(entry.patch)) pendingMaterialPatches.current.delete(entry.materialLineId);
        } catch (error) {
          setMaterialSaveNotice(error instanceof MobileApiError ? error.message : materialMutationFailureCopy(entry.materialType, "edit"));
          return false;
        }
      }
      return true;
    });
  }), [inlineMutationQueue, input.draftBatch, input.onKnownEntityVersion, setDetail, setMaterialSaveNotice, updateMaterialCache]);
  const resetSession = useCallback(() => {
    materialSessionGeneration.current += 1;
    materialRequests.current.clear();
    materialCacheRef.current = {};
    setMaterialCache({});
    setActiveMaterialType("fabric");
    materialEditorRef.current = null;
    materialInlineSessionRef.current = null;
    setMaterialEditor(null);
    setActiveMaterialInlineSession(null);
    setActiveMaterialField(null);
    setMaterialSaveNotice(null);
    materialLifecycleMutation.complete();
    setMaterialLifecycleBusyId(null);
    materialOrderMutation.complete();
    pendingMaterialPatches.current.clear();
    pendingMaterialCreates.current.clear();
    materialIdAliases.current.clear();
    setMaterialOrderBusyId(null);
    setMaterialOrderBusyAction(null);
  }, [materialLifecycleMutation, materialOrderMutation, setMaterialSaveNotice]);

  async function loadMaterials(workOrderId: string, materialType: MaterialType, action: "initial" | "retry" | "more") {
    const cacheKey = materialCacheKey(workOrderId, materialType);
    if (materialRequests.current.has(cacheKey)) return;
    const existing = materialCacheRef.current[cacheKey];
    if (action === "initial" && existing && existing.status !== "not-loaded") return;
    if (action === "more" && (!existing?.hasMore || !existing.nextCursor)) return;
    if (action === "retry" && existing?.status !== "error") return;

    const cursor = action === "more" ? existing?.nextCursor ?? null : action === "retry" ? existing?.failedCursor ?? null : null;
    const requestToken = ++materialRequestSequence.current;
    const sessionGeneration = materialSessionGeneration.current;
    materialRequests.current.set(cacheKey, requestToken);
    const pendingStatus: MaterialReadStatus = action === "retry" ? "retrying" : action === "more" ? "loading-more" : "loading";
    updateMaterialCache((current) => putBoundedMaterialEntry(current, cacheKey, {
      status: pendingStatus,
      items: existing?.items ?? [],
      nextCursor: existing?.nextCursor ?? null,
      failedCursor: null,
      entityVersion: existing?.entityVersion ?? null,
      hasMore: existing?.hasMore ?? false,
      errorMessage: null,
      touchedAt: Date.now(),
      archivedStatus: existing?.archivedStatus,
      archivedItems: existing?.archivedItems,
      archivedNextCursor: existing?.archivedNextCursor,
      archivedHasMore: existing?.archivedHasMore,
      archivedTotalCount: existing?.archivedTotalCount,
      archivedErrorMessage: existing?.archivedErrorMessage,
    }));

    try {
      const page = await workOrderQueryController.materials(workOrderId, materialType, cursor, "active");
      if (
        materialSessionGeneration.current !== sessionGeneration
        || materialRequests.current.get(cacheKey) !== requestToken
        || page.workOrderId !== workOrderId
        || page.materialType !== materialType
      ) return;
      const merged: WorkOrderMaterialLine[] = cursor ? [...(existing?.items ?? [])] : [];
      const knownIds = new Set(merged.map((line) => line.id));
      for (const line of page.items) {
        if (!knownIds.has(line.id)) {
          knownIds.add(line.id);
          merged.push(line);
        }
      }
      updateMaterialCache((current) => putBoundedMaterialEntry(current, cacheKey, {
        status: merged.length === 0 ? "empty" : "loaded",
        items: merged,
        nextCursor: page.nextCursor,
        failedCursor: null,
        entityVersion: page.entityVersion,
        hasMore: page.hasMore,
        errorMessage: null,
        touchedAt: Date.now(),
      }));
    } catch (error) {
      if (
        materialSessionGeneration.current !== sessionGeneration
        || materialRequests.current.get(cacheKey) !== requestToken
      ) return;
      if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        setRequestError(error, "boot");
        return;
      }
      updateMaterialCache((current) => putBoundedMaterialEntry(current, cacheKey, {
        status: "error",
        items: existing?.items ?? [],
        nextCursor: existing?.nextCursor ?? null,
        failedCursor: cursor,
        entityVersion: existing?.entityVersion ?? null,
        hasMore: existing?.hasMore ?? false,
        errorMessage: materialErrorMessage(error),
        touchedAt: Date.now(),
        archivedStatus: existing?.archivedStatus,
        archivedItems: existing?.archivedItems,
        archivedNextCursor: existing?.archivedNextCursor,
        archivedHasMore: existing?.archivedHasMore,
        archivedTotalCount: existing?.archivedTotalCount,
        archivedErrorMessage: existing?.archivedErrorMessage,
      }));
    } finally {
      if (materialRequests.current.get(cacheKey) === requestToken) materialRequests.current.delete(cacheKey);
    }
  }

  function nextMaterialRequestIdentity(kind: "client" | "idempotency") {
    clientRequestCounter.current += 1;
    return `alpha51-mobile-material-${kind}-${Date.now()}-${clientRequestCounter.current}`;
  }

  function beginMaterialCreate(materialType: MaterialType = activeMaterialType) {
    if (!canEditWorkOrder(detail, user)) return;
    if (detail.header.identity.derivationKind === "reorder") return;
    if (!input.prepareOverviewForCreate()) {
      showWaflAlert(`현재 값을 저장하거나 취소한 뒤 ${materialInformationSubject(materialType)}를 추가해 주세요.`, "warning");
      return;
    }
    setActiveMaterialType(materialType);
    const token = ++materialEditorSequence.current;
    const base = materialCreateDraft(materialType);
    updateMaterialEditor(() => ({
      token,
      mode: "create",
      workOrderId: detail.header.id,
      materialLineId: null,
      materialType,
      base,
      draft: { ...base },
      fieldErrors: {},
      saveState: "editing",
      saveMessage: null,
      conflictVersion: null,
      idempotencyKey: nextMaterialRequestIdentity("idempotency"),
      committedNextVersion: null,
    }));
    materialInlineSessionRef.current = null;
    setActiveMaterialInlineSession(null);
    setActiveMaterialField(null);
    setMaterialSaveNotice(null);
  }

  function beginMaterialEdit(line: WorkOrderMaterialLine, field: keyof MaterialDraftFields) {
    if (field === "orderQuantity") return;
    if (!detail || !canEditMaterial(detail, user, line)) return;
    if (detail.header.identity.derivationKind === "reorder" && !(REORDER_MATERIAL_EDITABLE_FIELDS as readonly (keyof MaterialDraftFields)[]).includes(field)) return;
    input.prepareOverviewForEdit();
    const current = materialEditorRef.current;
    const previousInlineOwner = materialInlineSessionRef.current;
    const materialTransition = planInlineEditTransition({
      currentField: previousInlineOwner?.field ?? null,
      nextField: field,
      currentDirty: Boolean(current && !sameMaterialDraft(current.base, current.draft)),
    });
    if (current && previousInlineOwner
      && materialTransition.commitCurrent
      && ["name", "colorOption", "unitPrice", "usageArea", "memo"].includes(previousInlineOwner.field)) {
      void saveMaterial({ [previousInlineOwner.field]: current.draft[previousInlineOwner.field] }, previousInlineOwner);
    }
    const token = ++materialEditorSequence.current;
    const inlineSession = createMaterialInlineEditSession({
      workOrderId: detail.header.id,
      itemId: line.id,
      field,
      token: ++materialInlineSessionSequence.current,
      workOrderGeneration: materialSessionGeneration.current,
    });
    const base = materialDraftFromLine(line);
    updateMaterialEditor(() => ({
      token,
      mode: "edit",
      workOrderId: detail.header.id,
      materialLineId: line.id,
      materialType: line.materialType,
      base,
      draft: { ...base },
      fieldErrors: {},
      saveState: "editing",
      saveMessage: null,
      conflictVersion: null,
      idempotencyKey: "",
      committedNextVersion: null,
    }));
    materialInlineSessionRef.current = inlineSession;
    setActiveMaterialInlineSession(inlineSession);
    setActiveMaterialField(field);
    setMaterialSaveNotice(null);
  }

  function changeMaterialDraft(field: keyof MaterialDraftFields, value: string, owner?: MaterialInlineEditSession) {
    if (field === "orderQuantity") return;
    if (owner && !ownsMaterialInlineEditSession(materialInlineSessionRef.current, owner)) return;
    updateMaterialEditor((current) => current ? {
      ...current,
      draft: { ...current.draft, [field]: value },
      fieldErrors: { ...current.fieldErrors, [field]: undefined },
      saveState: current.saveState === "conflict" ? "conflict" : "editing",
      saveMessage: current.saveState === "conflict" ? current.saveMessage : null,
    } : current);
  }

  function cancelMaterialEditor() {
    if (materialMutation.inFlight) return;
    closeMaterialEditorSession();
  }

  function cancelOwnedMaterialEditor(owner: MaterialInlineEditSession) {
    closeOwnedMaterialEditorSession(owner);
  }

  function applyRefreshedMaterialSnapshot(
    workOrderId: string,
    materialType: MaterialType,
    refreshed: WorkOrderDetailCore,
    page: Awaited<ReturnType<typeof workOrderQueryController.materials>>,
  ) {
    const cacheKey = materialCacheKey(workOrderId, materialType);
    setDetail(refreshed);
    setBasicInfoDraft(basicInfoDraftFromDetail(refreshed));
    updateMaterialCache((current) => putBoundedMaterialEntry(current, cacheKey, {
      ...current[cacheKey],
      status: page.items.length === 0 ? "empty" : "loaded",
      items: page.items,
      nextCursor: page.nextCursor,
      failedCursor: null,
      entityVersion: page.entityVersion,
      hasMore: page.hasMore,
      errorMessage: null,
      touchedAt: Date.now(),
    }));
    setItems((current) => current.map((item) => item.workOrderId === workOrderId ? {
      ...item,
      productName: refreshed.header.productName,
      dueDate: refreshed.header.dueDate,
      totalQuantity: refreshed.header.totalQuantity,
      estimatedAmountSummary: { currency: refreshed.amounts.currency, estimatedTotal: refreshed.amounts.estimatedTotal },
      updatedAt: refreshed.header.updatedAt,
    } : item));
    setSelected((current) => current?.workOrderId === workOrderId ? {
      ...current,
      productName: refreshed.header.productName,
      dueDate: refreshed.header.dueDate,
      totalQuantity: refreshed.header.totalQuantity,
      estimatedAmountSummary: { currency: refreshed.amounts.currency, estimatedTotal: refreshed.amounts.estimatedTotal },
      updatedAt: refreshed.header.updatedAt,
    } : current);
  }

  async function refreshMaterialSnapshot(input: {
    readonly workOrderId: string;
    readonly materialType: MaterialType;
    readonly token: number;
    readonly expectedVersion: number | null;
    readonly sessionGeneration: number;
  }) {
    const [refreshed, page] = await Promise.all([
      workOrderQueryController.detail(input.workOrderId),
      workOrderQueryController.materials(input.workOrderId, input.materialType),
    ]);
    if (
      refreshed.header.id !== input.workOrderId
      || page.workOrderId !== input.workOrderId
      || page.materialType !== input.materialType
      || refreshed.header.entityVersion !== page.entityVersion
      || (input.expectedVersion !== null && refreshed.header.entityVersion !== input.expectedVersion)
    ) {
      throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: materialLatestCopy(input.materialType, "verify-failed") });
    }
    if (
      selectedWorkOrderId.current !== input.workOrderId
      || materialSessionGeneration.current !== input.sessionGeneration
      || materialEditorRef.current?.token !== input.token
      || materialEditorRef.current.workOrderId !== input.workOrderId
      || materialEditorRef.current.materialType !== input.materialType
    ) return false;
    applyRefreshedMaterialSnapshot(input.workOrderId, input.materialType, refreshed, page);
    return true;
  }

  async function executeMaterialDelete(line: WorkOrderMaterialLine) {
    const currentDetail = detail;
    if (
      !canEditWorkOrder(currentDetail, user)
      || currentDetail.header.identity.derivationKind === "reorder"
      || materialLifecycleMutation.inFlight
      || selectedWorkOrderId.current !== currentDetail.header.id
    ) return;
    const requestToken = ++materialLifecycleSequence.current;
    const sessionGeneration = materialSessionGeneration.current;
    materialLifecycleMutation.tryBegin();
    setMaterialLifecycleBusyId(line.id);
    try {
      const command = {
        clientRequestId: nextMaterialRequestIdentity("client"),
        expectedVersion: currentDetail.header.entityVersion,
      };
      const historyPreserving = line.removalMode === "history_preserving_remove";
      const result = historyPreserving
        ? await workOrderMutationController.archiveMaterial(
          currentDetail.header.id,
          line.id,
          command,
          nextMaterialRequestIdentity("idempotency"),
        )
        : await workOrderMutationController.deleteMaterial(
          currentDetail.header.id,
          line.id,
          command,
          nextMaterialRequestIdentity("idempotency"),
        );
      const [refreshed, activePage] = await Promise.all([
        workOrderQueryController.detail(currentDetail.header.id),
        workOrderQueryController.materials(currentDetail.header.id, line.materialType, null, "active"),
      ]);
      if (
        result.nextVersion !== refreshed.header.entityVersion
        || activePage.entityVersion !== result.nextVersion
        || result.result.materialType !== line.materialType
        || (historyPreserving ? result.result.lifecycle !== "archived" : result.result.deleted !== true)
        || activePage.materialType !== line.materialType
        || refreshed.header.id !== currentDetail.header.id
      ) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: `${materialInformationSubject(line.materialType)}의 최신 상태를 확인할 수 없습니다.` });
      if (
        materialSessionGeneration.current !== sessionGeneration
        || materialLifecycleSequence.current !== requestToken
        || selectedWorkOrderId.current !== currentDetail.header.id
      ) return;
      applyRefreshedMaterialSnapshot(currentDetail.header.id, line.materialType, refreshed, activePage);
      if (materialEditorRef.current?.materialLineId === line.id) closeMaterialEditorSession();
      setMaterialSaveNotice(historyPreserving
        ? `${materialInformationSubject(line.materialType)}를 목록에서 삭제하고 발주 이력을 보존했습니다.`
        : materialMutationSuccessCopy(line.materialType, "delete"));
    } catch (error) {
      if (materialSessionGeneration.current !== sessionGeneration || materialLifecycleSequence.current !== requestToken) return;
      setMaterialSaveNotice(error instanceof MobileApiError ? error.message : materialMutationFailureCopy(line.materialType, "state"));
    } finally {
      if (materialLifecycleSequence.current === requestToken) {
        materialLifecycleMutation.complete();
        setMaterialLifecycleBusyId(null);
      }
    }
  }

  async function executeMaterialOrder(line: WorkOrderMaterialLine, action: MaterialOrderAction) {
    const currentDetail = detailRef.current;
    const materialLineId = materialIdAliases.current.get(line.id) ?? line.id;
    const label = materialLabel(line.materialType);
    if (!canExecuteMaterialOrderInteraction({
      hasDetail: currentDetail !== null,
      policyAllowed: canPerformMaterialOrderAction(currentDetail, user, line, action),
      mutationInFlight: materialOrderMutation.inFlight,
      selectedWorkOrderMatches: currentDetail !== null && selectedWorkOrderId.current === currentDetail.header.id,
    }) || !currentDetail) return;
    if (action === "request") {
      const errors = validateMaterialOrderRequest(line);
      if (Object.keys(errors).length > 0) {
        const firstField = Object.keys(errors)[0];
        const actionable = firstField === "partnerId"
          ? "거래처를 선택해 주세요."
          : firstField === "unitPrice"
            ? "단가를 0보다 크게 입력해 주세요."
            : firstField === "requiredQuantity"
              ? "필요수량을 0보다 크게 입력해 주세요."
              : firstField === "unitCode"
                ? "단위를 선택해 주세요."
                : Object.values(errors)[0] ?? "발주수량을 확인해 주세요.";
        showWaflAlert(actionable, "warning");
        return;
      }
    }

    if (materialOrderMutation.tryBegin() !== "started") return;
    const requestToken = ++materialOrderSequence.current;
    const sessionGeneration = materialSessionGeneration.current;
    setMaterialOrderBusyId(line.id);
    setMaterialOrderBusyAction(action);
    try {
      const processingMessage = action === "request"
        ? line.materialType === "fabric" ? "원단을 발주 중입니다." : "부자재를 발주 중입니다."
        : action === "cancel"
          ? line.materialType === "fabric" ? "원단 발주를 취소 중입니다." : "부자재 발주를 취소 중입니다."
          : `${label} 발주완료를 기록 중입니다.`;
      await runWaflProcessingAction({
        processingMessage,
        successMessage: action === "request" ? "발주 요청이 완료되었습니다."
          : action === "cancel" ? "발주 요청이 취소되었습니다."
            : "발주완료를 기록했습니다.",
        onProcessing: input.onActionProcessing,
        onSuccess: setMaterialSaveNotice,
        command: async () => {
          const result = await workOrderMutationController.transitionMaterialOrder(
            currentDetail.header.id,
            materialLineId,
            action,
            {
              clientRequestId: nextMaterialRequestIdentity("client"),
              expectedVersion: currentDetail.header.entityVersion,
              ...(action === "cancel" ? { reason: "모바일에서 발주요청 취소" } : {}),
            },
            nextMaterialRequestIdentity("idempotency"),
          );
          const [refreshed, activePage] = await Promise.all([
            workOrderQueryController.detail(currentDetail.header.id),
            workOrderQueryController.materials(currentDetail.header.id, line.materialType),
          ]);
          const expectedStatus = action === "request" ? "requested" : action === "cancel" ? "editing" : "completed";
          const refreshedLine = activePage.items.find((item) => item.id === materialLineId);
          if (
            result.nextVersion !== refreshed.header.entityVersion
            || activePage.entityVersion !== result.nextVersion
            || result.result.status !== expectedStatus
            || result.result.materialType !== line.materialType
            || activePage.materialType !== line.materialType
            || refreshedLine?.status !== expectedStatus
            || refreshed.header.id !== currentDetail.header.id
          ) {
            throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: `${label} 발주 상태를 확인하지 못했습니다.` });
          }
          if (
            materialSessionGeneration.current !== sessionGeneration
            || materialOrderSequence.current !== requestToken
            || selectedWorkOrderId.current !== currentDetail.header.id
          ) throw new MobileApiError({ code: "CONFLICT", message: `${label} 최신 상태를 다시 확인해 주세요.` });
          applyRefreshedMaterialSnapshot(currentDetail.header.id, line.materialType, refreshed, activePage);
          closeMaterialEditorSession();
        },
      });
    } catch (error) {
      if (materialSessionGeneration.current !== sessionGeneration || materialOrderSequence.current !== requestToken) return;
      setMaterialSaveNotice(error instanceof MobileApiError ? error.message : `${label} 발주 상태를 변경하지 못했습니다.`);
    } finally {
      if (materialOrderSequence.current === requestToken) {
        materialOrderMutation.complete();
        setMaterialOrderBusyId(null);
        setMaterialOrderBusyAction(null);
      }
    }
  }

  function requestMaterialOrderAction(line: WorkOrderMaterialLine, action: MaterialOrderAction) {
    if (!canPerformMaterialOrderAction(detail, user, line, action)) return;
    input.requestFeatureTransition(() => { void executeMaterialOrder(line, action); });
  }

  function requestDeleteMaterial(line: WorkOrderMaterialLine) {
    if (!detail || detail.header.identity.derivationKind === "reorder") return;
    if (!line.deletable || line.removalMode === "not_allowed") return;
    const label = materialLabel(line.materialType);
    const historyPreserving = line.removalMode === "history_preserving_remove";
    if (pendingMaterialCreates.current.has(line.id)) {
      confirmWaflDestructiveAction({
        title: `${label} 삭제`,
        message: `“${line.name}” ${materialInformationSubject(line.materialType)}를 이 레시피 초안에서 삭제합니다.`,
        onConfirm: () => {
          pendingMaterialCreates.current.delete(line.id);
          pendingMaterialPatches.current.delete(line.id);
          const cacheKey = materialCacheKey(detail.header.id, line.materialType);
          updateMaterialCache((entries) => {
            const entry = entries[cacheKey];
            if (!entry) return entries;
            const items = entry.items.filter((item) => item.id !== line.id);
            return putBoundedMaterialEntry(entries, cacheKey, {
              ...entry,
              status: items.length === 0 ? "empty" : "loaded",
              items,
              touchedAt: Date.now(),
            });
          });
          input.draftBatch.stage("materials", {
            creates: [...pendingMaterialCreates.current.values()],
            patches: [...pendingMaterialPatches.current.values()],
          });
        },
      });
      return;
    }
    input.requestFeatureTransition(() => {
      confirmWaflDestructiveAction({
        title: `${label} 삭제`,
        message: historyPreserving
          ? `“${line.name}” ${materialInformationSubject(line.materialType)}를 현재 목록에서 삭제합니다. 발주요청과 취소 이력은 그대로 보존됩니다.`
          : `“${line.name}” ${materialInformationSubject(line.materialType)}를 이 레시피 초안에서 삭제합니다.`,
        onConfirm: () => void executeMaterialDelete(line),
      });
    });
  }

  async function saveMaterial(draftOverride?: MaterialDraftUpdate, inlineOwner?: MaterialInlineEditSession) {
    if (inlineOwner && !ownsMaterialInlineEditSession(materialInlineSessionRef.current, inlineOwner)) return;
    const editor = materialEditorRef.current;
    if (!detail || !editor || editor.committedNextVersion !== null) return;
    if (selectedWorkOrderId.current !== editor.workOrderId || detail.header.id !== editor.workOrderId) return;
    const effectiveDraft = createMaterialDraft(draftOverride ?? {}, editor.draft);
    const inlineRollback = editor.mode === "edit"
      && inlineOwner !== undefined
      && ["name", "colorOption", "unitPrice", "usageArea", "memo"].includes(inlineOwner.field);
    const rollbackInlineMaterial = () => {
      if (!inlineRollback) return false;
      return closeOwnedMaterialEditorSession(inlineOwner as MaterialInlineEditSession);
    };
    if (draftOverride) {
      updateMaterialEditor((current) => current?.token === editor.token ? {
        ...current,
        draft: effectiveDraft,
        fieldErrors: {},
        saveState: "editing",
        saveMessage: null,
      } : current);
    }
    let fieldErrors: MaterialEditorFieldErrors;
    let normalizedDraft: MaterialDraftFields;
    let patch: MaterialDraftUpdate;
    try {
      fieldErrors = editor.mode === "create"
        ? validateMaterialCreateDraft(effectiveDraft, editor.materialType)
        : validateMaterialDraft(effectiveDraft, editor.materialType);
      normalizedDraft = normalizeMaterialDraft(effectiveDraft, editor.base);
      patch = materialPatch(editor.base, normalizedDraft);
    } catch {
      showToast("입력값을 처리하지 못했습니다.", "error");
      if (rollbackInlineMaterial()) return;
      updateMaterialEditor((current) => current?.token === editor.token ? {
        ...current,
        saveState: "save-error",
        saveMessage: "입력값을 처리하지 못했습니다.",
      } : current);
      return;
    }
    if (Object.keys(fieldErrors).length > 0) {
      showToast("입력값을 확인해 주세요.", "warning");
      if (rollbackInlineMaterial()) return;
      updateMaterialEditor((current) => current?.token === editor.token ? {
        ...current,
        fieldErrors,
        saveState: "validation-error",
        saveMessage: "입력값을 확인해 주세요.",
      } : current);
      return;
    }
    if (editor.mode === "edit" && Object.keys(patch).length === 0) {
      if (!inlineRollback) showToast("변경된 내용이 없습니다.", "warning");
      if (inlineOwner) cancelOwnedMaterialEditor(inlineOwner);
      else cancelMaterialEditor();
      return;
    }

    if (editor.mode === "edit" && editor.materialLineId) {
      const stagedCreate = pendingMaterialCreates.current.get(editor.materialLineId);
      if (stagedCreate) {
        pendingMaterialCreates.current.set(editor.materialLineId, { ...stagedCreate, normalizedDraft });
      }
      const entry = {
        workOrderId: editor.workOrderId,
        materialLineId: editor.materialLineId,
        materialType: editor.materialType,
        normalizedDraft,
        patch,
      } as const;
      if (!stagedCreate) pendingMaterialPatches.current.set(editor.materialLineId, entry);
      const cacheKey = materialCacheKey(editor.workOrderId, editor.materialType);
      updateMaterialCache((entries) => {
        const currentEntry = entries[cacheKey];
        if (!currentEntry) return entries;
        return putBoundedMaterialEntry(entries, cacheKey, {
          ...currentEntry,
          items: currentEntry.items.map((item) => item.id === editor.materialLineId ? {
            ...item,
            name: normalizedDraft.name,
            colorOption: normalizedDraft.colorOption || null,
            usageArea: normalizedDraft.usageArea || null,
            partnerId: normalizedDraft.partnerId || null,
            partnerName: input.partnerOptions.find((partner) => partner.id === normalizedDraft.partnerId)?.name ?? item.partnerName,
            requiredQuantity: normalizedDraft.requiredQuantity,
            allowanceQuantity: normalizedDraft.allowanceQuantity,
            inventoryUsageQuantity: normalizedDraft.inventoryUsageQuantity,
            unitCode: normalizedDraft.unitCode,
            unitPrice: normalizedDraft.unitPrice,
            memo: normalizedDraft.memo || null,
          } : item),
          touchedAt: Date.now(),
        });
      });
      input.draftBatch.stage("materials", {
        creates: [...pendingMaterialCreates.current.values()],
        patches: [...pendingMaterialPatches.current.values()],
      });
      if (inlineOwner) closeOwnedMaterialEditorSession(inlineOwner);
      else closeMaterialEditorSession();
      setMaterialSaveNotice(null);
      return true;
    }

    const tempMaterialLineId = `local-material-${editor.token}-${Date.now()}`;
    pendingMaterialCreates.current.set(tempMaterialLineId, {
      workOrderId: editor.workOrderId,
      tempMaterialLineId,
      materialType: editor.materialType,
      normalizedDraft,
      idempotencyKey: editor.idempotencyKey,
    });
    const cacheKey = materialCacheKey(editor.workOrderId, editor.materialType);
    updateMaterialCache((entries) => {
      const currentEntry = entries[cacheKey];
      if (!currentEntry) return entries;
      const localLine: WorkOrderMaterialLine = {
        id: tempMaterialLineId,
        materialType: editor.materialType,
        name: normalizedDraft.name,
        colorOption: normalizedDraft.colorOption || null,
        usageArea: normalizedDraft.usageArea || null,
        partnerId: normalizedDraft.partnerId || null,
        partnerName: input.partnerOptions.find((partner) => partner.id === normalizedDraft.partnerId)?.name ?? null,
        requiredQuantity: normalizedDraft.requiredQuantity,
        allowanceQuantity: normalizedDraft.allowanceQuantity,
        inventoryUsageQuantity: normalizedDraft.inventoryUsageQuantity,
        orderQuantity: normalizedDraft.orderQuantity,
        unitCode: normalizedDraft.unitCode,
        currency: "KRW",
        unitPrice: normalizedDraft.unitPrice,
        amount: "0",
        memo: normalizedDraft.memo || null,
        status: "editing",
        displayOrder: currentEntry.items.length + 1,
        locked: false,
        deletable: true,
        removalMode: "hard_delete",
        lifecycle: "active",
        archivedAt: null,
      };
      return putBoundedMaterialEntry(entries, cacheKey, {
        ...currentEntry,
        status: "loaded",
        items: [...currentEntry.items, localLine],
        touchedAt: Date.now(),
      });
    });
    input.draftBatch.stage("materials", {
      creates: [...pendingMaterialCreates.current.values()],
      patches: [...pendingMaterialPatches.current.values()],
    });
    closeMaterialEditorSession();
    setMaterialSaveNotice(null);
    return true;
  }

  function reloadLatestMaterial() {
    const editor = materialEditorRef.current;
    if (!editor || materialMutation.inFlight) return;
    const load = async () => {
      materialMutation.tryBegin();
      const sessionGeneration = materialSessionGeneration.current;
      updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "saving", saveMessage: materialLatestCopy(editor.materialType, "checking") } : current);
      try {
        const applied = await refreshMaterialSnapshot({
          workOrderId: editor.workOrderId,
          materialType: editor.materialType,
          token: editor.token,
          expectedVersion: editor.committedNextVersion,
          sessionGeneration,
        });
        if (!applied) return;
        closeMaterialEditorSession();
        setMaterialSaveNotice(editor.committedNextVersion === null ? null : materialLatestCopy(editor.materialType, "verified"));
      } catch (error) {
        showToast(error instanceof MobileApiError ? error.message : materialLatestCopy(editor.materialType, "load-failed"), "error");
        updateMaterialEditor((current) => current?.token === editor.token ? {
          ...current,
          saveState: editor.committedNextVersion === null ? "conflict" : "refresh-error",
          saveMessage: error instanceof MobileApiError ? error.message : materialLatestCopy(editor.materialType, "load-failed"),
        } : current);
      } finally {
        materialMutation.complete();
      }
    };
    void load();
  }

  const materialEditorDirty = materialEditor ? !sameMaterialDraft(materialEditor.base, materialEditor.draft) : false;
  return {
    cache: materialCache,
    activeType: activeMaterialType,
    editor: materialEditor,
    activeField: activeMaterialField,
    activeInlineSession: activeMaterialInlineSession,
    dirty: materialEditorDirty,
    saveNotice: materialSaveNotice,
    lifecycleBusyId: materialLifecycleBusyId,
    orderBusyId: materialOrderBusyId,
    orderBusyAction: materialOrderBusyAction,
    isMutationInFlight: () => materialMutation.inFlight || materialLifecycleMutation.inFlight || materialOrderMutation.inFlight,
    resetSession,
    loadMaterials,
    beginCreate: beginMaterialCreate,
    beginEdit: beginMaterialEdit,
    changeDraft: changeMaterialDraft,
    cancelEditor: cancelMaterialEditor,
    cancelOwnedEditor: cancelOwnedMaterialEditor,
    closeEditorSession: closeMaterialEditorSession,
    requestOrderAction: requestMaterialOrderAction,
    requestDelete: requestDeleteMaterial,
    save: saveMaterial,
    reloadLatest: reloadLatestMaterial,
    setActiveType: setActiveMaterialType,
    setSaveNotice: setMaterialSaveNotice,
  };
}
