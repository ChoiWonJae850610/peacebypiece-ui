import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { Alert } from "react-native";

import { materialErrorMessage, type MobileErrorState } from "@/application/errorPresentation";
import { createExplicitMutationController, type SerializedMutationQueue } from "@/application/mutationController";
import { planInlineEditTransition } from "@/application/inlineEditTransition";
import type { MaterialEditorViewState } from "@/features/materials/WorkOrderMaterialEditor";
import type { MaterialReadStatus } from "@/features/materials/WorkOrderMaterialsReadOnly";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
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
import { canEditMaterial, canEditWorkOrder, canPerformMaterialOrderAction } from "@/domain/workOrderPolicy";
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
  const queuedMaterialEditorTokens = useRef(new Set<number>());
  const materialLifecycleSequence = useRef(0);
  const materialOrderSequence = useRef(0);

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
    if (!input.prepareOverviewForCreate()) {
      Alert.alert("개요 편집을 완료해 주세요.", `현재 값을 저장하거나 취소한 뒤 ${materialInformationSubject(materialType)}를 추가할 수 있습니다.`);
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
    const currentDetail = detail;
    const label = materialLabel(line.materialType);
    if (
      !currentDetail
      || !canPerformMaterialOrderAction(currentDetail, user, line, action)
      || materialOrderMutation.inFlight
      || selectedWorkOrderId.current !== currentDetail.header.id
    ) return;
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
        Alert.alert("발주 정보를 확인해 주세요.", actionable);
        return;
      }
    }

    if (materialOrderMutation.tryBegin() !== "started") return;
    const requestToken = ++materialOrderSequence.current;
    const sessionGeneration = materialSessionGeneration.current;
    setMaterialOrderBusyId(line.id);
    setMaterialOrderBusyAction(action);
    try {
      const result = await workOrderMutationController.transitionMaterialOrder(
        currentDetail.header.id,
        line.id,
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
      const refreshedLine = activePage.items.find((item) => item.id === line.id);
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
      ) return;
      applyRefreshedMaterialSnapshot(currentDetail.header.id, line.materialType, refreshed, activePage);
      closeMaterialEditorSession();
      setMaterialSaveNotice(
        action === "request" ? "발주요청을 기록했습니다."
          : action === "cancel" ? "발주요청을 취소하고 편집 가능 상태로 복구했습니다."
            : "발주완료를 기록했습니다.",
      );
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
    const label = materialLabel(line.materialType);
    const title = action === "request" ? "발주요청"
      : action === "cancel" ? "발주취소"
        : "발주완료";
    const message = action === "request"
      ? "발주 요청 후에는 정보를 수정할 수 없습니다. 수정이 필요하면 발주요청을 취소해주세요."
      : action === "cancel"
        ? `발주요청을 취소하고 ${label} 편집을 다시 허용합니다.`
        : "공급처가 주문을 접수한 상태로 기록합니다. 완료 후에는 취소하거나 편집할 수 없습니다.";
    input.requestFeatureTransition(() => {
      Alert.alert(title, message, [
        { text: "취소", style: "cancel" },
        {
          text: title,
          style: action === "cancel" ? "destructive" : "default",
          onPress: () => void executeMaterialOrder(line, action),
        },
      ]);
    });
  }

  function requestDeleteMaterial(line: WorkOrderMaterialLine) {
    if (!line.deletable || line.removalMode === "not_allowed") return;
    const label = materialLabel(line.materialType);
    const historyPreserving = line.removalMode === "history_preserving_remove";
    input.requestFeatureTransition(() => {
      confirmWaflDestructiveAction({
        title: `${label} 삭제`,
        message: historyPreserving
          ? `“${line.name}” ${materialInformationSubject(line.materialType)}를 현재 목록에서 삭제합니다. 발주요청과 취소 이력은 그대로 보존됩니다.`
          : `“${line.name}” ${materialInformationSubject(line.materialType)}를 이 작업지시서 초안에서 삭제합니다.`,
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
    const refreshInlineMaterial = async (expectedVersion: number | null) => {
      if (!inlineRollback) return false;
      if (!ownsMaterialInlineEditSession(materialInlineSessionRef.current, inlineOwner as MaterialInlineEditSession)) return true;
      try {
        await refreshMaterialSnapshot({
          workOrderId: editor.workOrderId,
          materialType: editor.materialType,
          token: editor.token,
          expectedVersion,
          sessionGeneration: materialSessionGeneration.current,
        });
      } catch {
        showToast(materialLatestCopy(editor.materialType, "load-failed"), "error");
      }
      closeOwnedMaterialEditorSession(inlineOwner as MaterialInlineEditSession);
      return true;
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

    if (queuedMaterialEditorTokens.current.has(editor.token)) return;
    queuedMaterialEditorTokens.current.add(editor.token);
    try {
    return await inlineMutationQueue.enqueue(async () => {
    if (materialMutation.tryBegin() !== "started") return;
    const saveStartedAt = Date.now();
    const sessionGeneration = materialSessionGeneration.current;
    updateMaterialEditor((current) => current?.token === editor.token ? {
      ...current,
      fieldErrors: {},
      saveState: "saving",
      saveMessage: null,
    } : current);
    let committedNextVersion: number | null = null;
    try {
      const latestDetail = detailRef.current;
      if (!latestDetail || latestDetail.header.id !== editor.workOrderId) return;
      const expectedVersion = latestDetail.header.entityVersion;
      const saved = editor.mode === "create"
        ? await workOrderMutationController.createMaterial(editor.workOrderId, {
          clientRequestId: nextMaterialRequestIdentity("client"),
          expectedVersion,
          materialType: editor.materialType,
          ...normalizedDraft,
        }, editor.idempotencyKey)
        : await workOrderMutationController.updateMaterial(editor.workOrderId, editor.materialLineId ?? "", {
          clientRequestId: nextMaterialRequestIdentity("client"),
          expectedVersion,
          patch,
        });
      if (saved.result.materialType !== editor.materialType) {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "저장된 자재 유형을 확인하지 못했습니다." });
      }
      committedNextVersion = saved.nextVersion;
      const versionedDetail: WorkOrderDetailCore = {
        ...latestDetail,
        header: { ...latestDetail.header, entityVersion: saved.nextVersion },
      };
      detailRef.current = versionedDetail;
      setDetail(versionedDetail);
      if (editor.mode === "edit") {
        const cacheKey = materialCacheKey(editor.workOrderId, editor.materialType);
        updateMaterialCache((entries) => {
          const entry = entries[cacheKey];
          if (!entry) return entries;
          return putBoundedMaterialEntry(entries, cacheKey, {
            ...entry,
            entityVersion: saved.nextVersion,
            items: entry.items.map((item) => item.id === editor.materialLineId ? {
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
              status: saved.result.status,
              lifecycle: saved.result.lifecycle,
            } : item),
            touchedAt: Date.now(),
          });
        });
      }
      const patchCompletedAt = Date.now();
      updateMaterialEditor((current) => current?.token === editor.token ? {
        ...current,
        base: normalizedDraft,
        draft: normalizedDraft,
        committedNextVersion,
        saveState: "saving",
      } : current);
      const shouldRefreshOwnedSession = !inlineOwner || ownsMaterialInlineEditSession(materialInlineSessionRef.current, inlineOwner);
      const applied = shouldRefreshOwnedSession ? await refreshMaterialSnapshot({
          workOrderId: editor.workOrderId,
          materialType: editor.materialType,
          token: editor.token,
          expectedVersion: saved.nextVersion,
          sessionGeneration,
        }) : true;
      if (!applied) return;
      const revalidationCompletedAt = Date.now();
      if (process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") console.info("[WAFL_MATERIAL_SAVE_METRIC]", {
        mode: editor.mode,
        payloadFields: editor.mode === "edit" ? Object.keys(patch).sort() : ["create"],
        patchMs: patchCompletedAt - saveStartedAt,
        canonicalRevalidationMs: revalidationCompletedAt - patchCompletedAt,
        totalMs: revalidationCompletedAt - saveStartedAt,
        canonicalGetCount: 2,
        duplicateCanonicalGetCount: 0,
      });
      if (inlineOwner) closeOwnedMaterialEditorSession(inlineOwner);
      else closeMaterialEditorSession();
      setMaterialSaveNotice(materialMutationSuccessCopy(editor.materialType, editor.mode === "create" ? "create" : "edit"));
    } catch (error) {
      if (committedNextVersion !== null) {
        showToast(materialLatestCopy(editor.materialType, "verify-failed"), "warning");
        updateMaterialEditor((current) => current?.token === editor.token ? {
          ...current,
          base: normalizedDraft,
          draft: normalizedDraft,
          committedNextVersion,
          saveState: "refresh-error",
          saveMessage: materialLatestCopy(editor.materialType, "verify-failed"),
        } : current);
      } else if (error instanceof MobileApiError && error.code === "VALIDATION_ERROR") {
        showToast("입력값을 확인해 주세요.", "warning");
        if (rollbackInlineMaterial()) return;
        const mapped: MaterialEditorFieldErrors = {};
        for (const fieldError of error.fieldErrors) {
          const field = fieldError.field.replace(/^patch\./, "") as keyof MaterialDraftFields;
          if (field in effectiveDraft) mapped[field] = fieldError.message;
        }
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, fieldErrors: mapped, saveState: "validation-error", saveMessage: "입력값을 확인해 주세요." } : current);
      } else if (error instanceof MobileApiError && error.code === "CONFLICT") {
        showToast("다른 변경이 먼저 저장되었습니다.", "warning");
        input.onKnownEntityVersion(editor.workOrderId, error.entityVersion);
        if (await refreshInlineMaterial(error.entityVersion)) return;
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, conflictVersion: error.entityVersion, saveState: "conflict", saveMessage: "다른 변경이 먼저 저장되었습니다." } : current);
      } else if (error instanceof MobileApiError && (error.code === "LOCKED" || error.code === "REVISION_MISMATCH")) {
        showToast(`현재 상태에서는 ${materialInformationSubject(editor.materialType)}를 수정할 수 없습니다.`, "warning");
        if (rollbackInlineMaterial()) return;
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "locked", saveMessage: `현재 상태에서는 ${materialInformationSubject(editor.materialType)}를 수정할 수 없습니다.` } : current);
      } else if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        rollbackInlineMaterial();
        setRequestError(error, "boot");
      } else {
        showToast(error instanceof MobileApiError ? error.message : materialMutationFailureCopy(editor.materialType, "edit"), "error");
        if (rollbackInlineMaterial()) return;
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "save-error", saveMessage: error instanceof MobileApiError ? error.message : materialMutationFailureCopy(editor.materialType, "edit") } : current);
      }
    } finally {
      materialMutation.complete();
    }
    });
    } finally {
      queuedMaterialEditorTokens.current.delete(editor.token);
    }
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
