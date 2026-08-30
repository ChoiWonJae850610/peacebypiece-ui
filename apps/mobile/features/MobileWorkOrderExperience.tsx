import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ChevronLeft, LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MobileConnectScreen from "@/components/MobileConnectScreen";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WorkOrderDetailOverview, {
  type BasicInfoInlineField,
  type BasicInfoSaveState,
} from "@/features/work-orders/overview/WorkOrderDetailOverview";
import { useWorkOrderMaterialAuthoringController } from "@/features/materials/useWorkOrderMaterialAuthoringController";
import WorkOrderListScreen from "@/features/work-orders/list/WorkOrderListScreen";
import WorkOrderCreateSheet from "@/features/work-orders/create/WorkOrderCreateSheet";
import { WorkOrderSeriesHistorySheet } from "@/features/work-orders/reorder/WorkOrderReorderSheets";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import {
  customerGuidance,
  customerMessage,
  type MobileErrorState,
} from "@/application/errorPresentation";
import { createExplicitMutationController, createSerializedMutationQueue } from "@/application/mutationController";
import { runWaflProcessingAction } from "@/application/waflActionExecution";
import { beginWaflPresentationFirstOperation, waitForWaflPresentationBoundary } from "@/application/waflPresentationBoundary";
import { type DraftExitIntent } from "@/application/draftExitPolicy";
import { createFirstPendingIntentController } from "@/application/firstPendingIntent";
import { planInlineEditTransition } from "@/application/inlineEditTransition";
import { mobileSessionController } from "@/application/sessionController";
import { useWorkOrderNavigation } from "@/application/useWorkOrderNavigation";
import { createWorkOrderDraftBatchCoordinator, type DraftBatchFlushReason } from "@/application/draftBatchCoordinator";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { canEditConfirmedWorkOrderMutableFields, canEditWorkOrder, materialOrderPolicyFor } from "@/domain/workOrderPolicy";
import {
  type BasicInfoDraft,
  type BasicInfoFieldErrors,
  basicInfoDraftFromDetail,
  validateBasicInfoDraft,
  validateWorkOrderProductName,
} from "@/domain/workOrderValidation";
import { EMPTY_MATERIAL_STATE, materialCacheKey } from "@/features/materials/materialCache";
import { useWorkOrderSizeSpecCoordination } from "@/features/work-orders/size-color/useWorkOrderSizeSpecCoordination";
import { workOrderMutationController } from "@/features/work-orders/workOrderMutationController";
import { workOrderQueryController, workOrderReadinessNeedsCanonicalRefresh } from "@/features/work-orders/workOrderQueryController";
import { useWorkOrderAssetAuthoringController } from "@/features/work-orders/images/useWorkOrderAssetAuthoringController";
import WaflNativeAttachmentViewer from "@/features/work-orders/images/WaflNativeAttachmentViewer";
import WaflActionProcessingBlocker from "@/features/feedback/WaflActionProcessingBlocker";
import type { WaflActionConfirmationState } from "@/features/feedback/WaflActionConfirmationCard";
import WaflDecisionSheet from "@/features/feedback/WaflDecisionSheet";
import WaflFeedbackHost from "@/features/feedback/WaflFeedbackHost";
import { showWaflAlert, type WaflAlertTone } from "@/features/feedback/waflFeedbackStore";
import { encodeWorkOrderProductType } from "@/domain/workOrderCategoryPolicy";
import { hasCategoryDependentWorkOrderData } from "@/domain/categoryResetPolicy";
import { materialNoun } from "@/domain/materialSemanticCopy";
import { reconcileCreatedWorkOrderListItem, resolveWorkOrderCreateAttempt, type WorkOrderCreateAttemptIdentity } from "@/domain/workOrderCreatePolicy";
import { hydrateAuthoritativeCreatedCopy } from "@/domain/workOrderCopyHydrationPolicy";
import { hydrateWorkOrderOpenChildren, type WorkOrderChildProjection } from "@/domain/workOrderOpenHydrationPolicy";
import { canCreateMobileWorkOrderReorder } from "@/domain/workOrderReorderPolicy";
import { runWorkOrderListReorderFlow } from "@/domain/workOrderListReorderFlow";
import { reconcileWorkOrderListItemFromDetail, workOrderListWorkflowChanged } from "@/domain/workOrderListReconciliation";
import { MobileApiError, type MaterialPartnerOption, type MaterialType, type MobileCurrentUser, type WorkOrderCharacterFilter, type WorkOrderDetailCore, type WorkOrderLineageFilter, type WorkOrderListItem, type WorkOrderListStatusFilter, type WorkOrderSeriesHistory } from "@/domain/mobileContract";
import { generateWorkOrderR0 } from "@/lib/api/documentsApi";

type AppPhase =
  | "booting"
  | "session-checking"
  | "developer-auto-connecting"
  | "disconnected-auto-failed"
  | "manual-code-entry"
  | "connecting-manual"
  | "authenticated-loading-list"
  | "list-ready"
  | "detail-loading"
  | "detail-ready"
  | "recoverable-error"
  | "session-expired";

type WorkOrderDetailHydration = {
  readonly detail: WorkOrderDetailCore;
  readonly children: ReturnType<typeof loadWorkOrderChildHydration>;
};

async function loadWorkOrderDetailHydration(workOrderId: string): Promise<WorkOrderDetailHydration> {
  const detail = await workOrderQueryController.detail(workOrderId);
  return { detail, children: loadWorkOrderChildHydration(detail) };
}

function loadWorkOrderChildHydration(detail: WorkOrderDetailCore) {
  return hydrateWorkOrderOpenChildren({
    initialDetail: detail,
    workOrderId: detail.header.id,
    detailVersion: (value) => value.header.entityVersion,
    isSample: (value) => value.header.identity.isSample,
    loadDetail: (workOrderId) => workOrderQueryController.detail(workOrderId),
    loadImages: (workOrderId) => workOrderQueryController.images(workOrderId),
    loadPartners: (workOrderId) => workOrderQueryController.materialPartners(workOrderId),
    loadHistory: (workOrderId) => workOrderQueryController.seriesHistory(workOrderId),
  });
}

function childHydrationLabel(unavailable: readonly WorkOrderChildProjection[]) {
  return unavailable.map((child) => child === "images" ? "이미지" : child === "partners" ? "거래처" : "작업 이력").join("·");
}

function materialLabel(materialType: MaterialType) {
  return materialNoun(materialType);
}

function transientToneFor(message: string): WaflAlertTone {
  if (/못|실패|오류|올바르지|찾을 수 없|열 수 없/.test(message)) return "error";
  if (/확인|없습니다|최대|입력값|현재 상태/.test(message)) return "warning";
  return "success";
}

export default function MobileWorkOrderExperience() {
  const { width } = useWindowDimensions();
  const tablet = width >= 768;
  const [phase, setPhase] = useState<AppPhase>("booting");
  const [user, setUser] = useState<MobileCurrentUser | null>(null);
  const [items, setItems] = useState<readonly WorkOrderListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [listNextCursor, setListNextCursor] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState<WorkOrderListStatusFilter>("all");
  const [listCharacterFilter, setListCharacterFilter] = useState<WorkOrderCharacterFilter>("all");
  const [listLineageFilters, setListLineageFilters] = useState<readonly WorkOrderLineageFilter[]>([]);
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const [listSearching, setListSearching] = useState(false);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [createProductName, setCreateProductName] = useState("");
  const [createIsSample, setCreateIsSample] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [reorderPending, setReorderPending] = useState(false);
  const [copyPending, setCopyPending] = useState(false);
  const [actionProcessingMessage, setActionProcessingMessage] = useState<string | null>(null);
  const [actionProcessingHelper, setActionProcessingHelper] = useState<string | null>(null);
  const [actionConfirmation, setActionConfirmation] = useState<WaflActionConfirmationState | null>(null);
  const [pendingIntentSaving, setPendingIntentSaving] = useState(false);
  const setActionProcessing = useCallback((message: string | null, helper: string | null = null) => {
    setActionProcessingMessage(message);
    setActionProcessingHelper(message ? helper : null);
  }, []);
  const [seriesHistory, setSeriesHistory] = useState<WorkOrderSeriesHistory | null>(null);
  const [seriesHistoryVisible, setSeriesHistoryVisible] = useState(false);
  const [failedDraftExitVisible, setFailedDraftExitVisible] = useState(false);
  const failedDraftExitRef = useRef<{ readonly intent: DraftExitIntent; readonly onProceed: () => void } | null>(null);
  const pendingIntentController = useRef(createFirstPendingIntentController()).current;
  const pendingIntentFlush = useRef(false);
  const [samplePending, setSamplePending] = useState(false);
  const { selected, setSelected, selectedWorkOrderId: selectedWorkOrderIdRef, appLifecycle } = useWorkOrderNavigation();
  const [detail, setDetail] = useState<WorkOrderDetailCore | null>(null);
  const detailRef = useRef<WorkOrderDetailCore | null>(null);
  const [materialPartnerOptions, setMaterialPartnerOptions] = useState<readonly MaterialPartnerOption[]>([]);
  const imageMessage = null;
  const [errorState, setErrorState] = useState<MobileErrorState | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeBasicField, setActiveBasicField] = useState<BasicInfoInlineField | null>(null);
  const activeBasicFieldRef = useRef<BasicInfoInlineField | null>(null);
  const activeBasicSessionRef = useRef<{ readonly field: BasicInfoInlineField; readonly token: number } | null>(null);
  const basicInfoSessionSequence = useRef(0);
  const queuedBasicInfoSessions = useRef(new Set<number>());
  const productNameAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productNameAutosaveGenerationRef = useRef(0);
  const productNameAutosaveInFlightRef = useRef<Promise<boolean> | null>(null);
  const [basicInfoDraft, setBasicInfoDraft] = useState<BasicInfoDraft>({
    productName: "",
    dueDate: "",
    totalQuantity: "0",
    targetAudience: "",
    categoryMajor: "",
    categoryDetail: "",
    seasonCode: "",
  });
  const basicInfoDraftRef = useRef(basicInfoDraft);
  const categoryResetIntentRef = useRef<{ readonly workOrderId: string; readonly targetAudience: string; readonly categoryMajor: string; readonly resetApplied: boolean } | null>(null);
  const [basicInfoErrors, setBasicInfoErrors] = useState<BasicInfoFieldErrors>({});
  const [saveState, setSaveState] = useState<BasicInfoSaveState>("read-only");
  const [saveMessage, setSaveMessageState] = useState<string | null>(null);
  const [, setConflictVersion] = useState<number | null>(null);
  const detailRequestInFlight = useRef(false);
  const listRequestInFlight = useRef(false);
  const listReconcileRequired = useRef(false);
  const pendingListSearch = useRef<{ readonly query: string; readonly status: WorkOrderListStatusFilter; readonly character: WorkOrderCharacterFilter; readonly lineage: readonly WorkOrderLineageFilter[] } | null>(null);
  const overviewMutation = useRef(createExplicitMutationController()).current;
  const createMutation = useRef(createExplicitMutationController()).current;
  const reorderMutation = useRef(createExplicitMutationController()).current;
  const copyMutation = useRef(createExplicitMutationController()).current;
  const deleteDraftMutation = useRef(createExplicitMutationController()).current;
  const reorderAttemptIdentity = useRef<{ readonly sourceWorkOrderId: string; readonly clientRequestId: string; readonly idempotencyKey: string } | null>(null);
  const committedReorderRead = useRef<{ readonly workOrderId: string; readonly reorderRound: number } | null>(null);
  const [inlineMutationQueue] = useState(createSerializedMutationQueue);
  const deletedDraftWorkOrderIdsRef = useRef(new Set<string>());
  const [draftBatch] = useState(() => createWorkOrderDraftBatchCoordinator({
    onStatus: (section, status) => {
      if (status === "dirty") { setSaveState("editing"); setSaveMessageState(null); }
      else if (status === "saving") { setSaveState("saving"); setSaveMessageState(null); }
      else if (status === "saved") { setSaveState("saved"); setSaveMessageState(null); }
      else if (status === "error") { setSaveState("save-error"); setSaveMessageState(`${section} 변경을 저장하지 못했습니다.`); }
    },
  }));
  const [canonicalDetailRefreshQueue] = useState(createSerializedMutationQueue);
  const clientRequestCounter = useRef(0);
  const createAttemptIdentity = useRef<WorkOrderCreateAttemptIdentity | null>(null);
  const autoConnectInFlight = useRef(false);
  const manualDisconnectSuppressed = useRef(false);
  const bootStarted = useRef(false);
  const materialAuthenticationErrorRef = useRef<(error: unknown, retryTarget: MobileErrorState["retryTarget"]) => void>(() => undefined);
  const sizeColorAuthenticationErrorRef = useRef<(error: MobileApiError) => void>(() => undefined);
  const forwardSizeColorAuthenticationError = useCallback((error: MobileApiError) => {
    sizeColorAuthenticationErrorRef.current(error);
  }, []);
  useEffect(() => { basicInfoDraftRef.current = basicInfoDraft; }, [basicInfoDraft]);
  useEffect(() => {
    productNameAutosaveGenerationRef.current += 1;
    if (productNameAutosaveTimerRef.current) clearTimeout(productNameAutosaveTimerRef.current);
    productNameAutosaveTimerRef.current = null;
    return () => {
      productNameAutosaveGenerationRef.current += 1;
      if (productNameAutosaveTimerRef.current) clearTimeout(productNameAutosaveTimerRef.current);
      productNameAutosaveTimerRef.current = null;
    };
  }, [detail?.header.id]);
  useEffect(() => { categoryResetIntentRef.current = null; }, [detail?.header.id]);
  useEffect(() => { draftBatch.reset(); }, [draftBatch, selected?.workOrderId]);
  const reconcileCanonicalDetail = useCallback((refreshed: WorkOrderDetailCore) => {
    const workOrderId = refreshed.header.id;
    const previousDetail = detailRef.current;
    if (previousDetail?.header.id === workOrderId
      && (previousDetail.header.status !== refreshed.header.status
        || previousDetail.header.document.status !== refreshed.header.document.status)) {
      listReconcileRequired.current = true;
    }
    detailRef.current = refreshed;
    setDetail(refreshed);
    setBasicInfoDraft((currentDraft) => {
      const next = basicInfoDraftFromDetail(refreshed);
      const currentOwner = activeBasicSessionRef.current;
      return currentOwner ? { ...next, [currentOwner.field]: currentDraft[currentOwner.field] } : next;
    });
    setItems((current) => current.map((item) => {
      if (item.workOrderId !== workOrderId) return item;
      if (workOrderListWorkflowChanged(item, refreshed)) {
        listReconcileRequired.current = true;
      }
      return reconcileWorkOrderListItemFromDetail(item, refreshed);
    }));
    setSelected((current) => current ? reconcileWorkOrderListItemFromDetail(current, refreshed) : current);
  }, [setSelected]);
  const refreshCanonicalDetailAfterMutation = useCallback((workOrderId: string) => canonicalDetailRefreshQueue.enqueue(async () => {
    const refreshed = await workOrderQueryController.detailAfterReadinessRelevantMutation(workOrderId);
    const latest = detailRef.current;
    if (!latest || latest.header.id !== workOrderId || refreshed.header.entityVersion < latest.header.entityVersion) return;
    reconcileCanonicalDetail(refreshed);
  }), [canonicalDetailRefreshQueue, reconcileCanonicalDetail]);
  const reconcileSizeSpecDetail = reconcileCanonicalDetail;
  const reconcileSizeSpecTotal = useCallback((totalQuantity: number, nextVersion: number) => {
    const workOrderId = selectedWorkOrderIdRef.current;
    if (!workOrderId) return;
    setDetail((current) => current?.header.id === workOrderId ? { ...current, header: { ...current.header, totalQuantity, entityVersion: nextVersion } } : current);
    setBasicInfoDraft((current) => ({ ...current, totalQuantity: String(totalQuantity) }));
    setItems((current) => current.map((item) => item.workOrderId === workOrderId ? { ...item, totalQuantity } : item));
    setSelected((current) => current?.workOrderId === workOrderId ? { ...current, totalQuantity } : current);
  }, [selectedWorkOrderIdRef, setSelected]);
  const reconcileSizeSpecVersion = useCallback((nextVersion: number) => {
    const workOrderId = selectedWorkOrderIdRef.current;
    if (!workOrderId) return;
    setDetail((current) => current?.header.id === workOrderId ? { ...current, header: { ...current.header, entityVersion: nextVersion } } : current);
  }, [selectedWorkOrderIdRef]);
  const sizeSpec = useWorkOrderSizeSpecCoordination({
    detail, user, selectedWorkOrderId: selectedWorkOrderIdRef,
    onDetailProjection: reconcileSizeSpecDetail,
    onTotalQuantityProjection: reconcileSizeSpecTotal,
    onVersionProjection: reconcileSizeSpecVersion,
    onAuthenticationError: forwardSizeColorAuthenticationError,
    draftBatch,
  });
  const sizeColor = sizeSpec.boundary;
  const sizeColorEdit = sizeSpec.editBoundary;
  const resetSizeColorSession = sizeSpec.resetSession;

  const basicInfoDirty = detail ? (
    basicInfoDraft.productName !== detail.header.productName
    || basicInfoDraft.dueDate !== (detail.header.dueDate ?? "")
    || basicInfoDraft.targetAudience !== basicInfoDraftFromDetail(detail).targetAudience
    || basicInfoDraft.categoryMajor !== basicInfoDraftFromDetail(detail).categoryMajor
    || basicInfoDraft.categoryDetail !== basicInfoDraftFromDetail(detail).categoryDetail
    || basicInfoDraft.seasonCode !== basicInfoDraftFromDetail(detail).seasonCode
  ) : false;

  const showToast = useCallback((message: string, tone: WaflAlertTone = transientToneFor(message)) => {
    showWaflAlert(message, tone);
  }, []);
  const setSaveMessage = useCallback((message: string | null) => {
    setSaveMessageState(message);
    if (message) showToast(message);
  }, [showToast]);
  function reconcileKnownEntityVersion(workOrderId: string, entityVersion: number | null) {
    const latest = detailRef.current;
    if (!latest || latest.header.id !== workOrderId || entityVersion === null || entityVersion <= latest.header.entityVersion) return;
    const versioned = { ...latest, header: { ...latest.header, entityVersion } };
    detailRef.current = versioned;
    setDetail(versioned);
  }
  function resetBasicOverviewEditing() {
    setEditing(false);
    activeBasicFieldRef.current = null;
    activeBasicSessionRef.current = null;
    setActiveBasicField(null);
    setSaveState("read-only");
    setSaveMessage(null);
  }
  function prepareOverviewForMaterialCreate() {
    if (editing && basicInfoDirty) return false;
    resetBasicOverviewEditing();
    return true;
  }
  function prepareOverviewForMaterialEdit() {
    if (editing && basicInfoDirty) {
      const previousBasic = activeBasicSessionRef.current;
      if (previousBasic) void saveBasicInfo({ [previousBasic.field]: basicInfoDraft[previousBasic.field] }, previousBasic.field, previousBasic.token);
    }
    resetBasicOverviewEditing();
  }
  const nextAssetRequestIdentity = useCallback((kind: "upload" | "representative" | "delete" | "image-output" | "attachment-upload" | "attachment-delete" | "attachment-output" | "memo") => {
    clientRequestCounter.current += 1;
    const suffix = `${Date.now()}-${clientRequestCounter.current}`;
    return {
      clientRequestId: `alpha57-image-${kind}-${suffix}`,
      idempotencyKey: `alpha57-image-${kind}-${suffix}`,
    };
  }, []);
  const reconcileAssetDetail = reconcileCanonicalDetail;
  const assetAuthoring = useWorkOrderAssetAuthoringController({
    detail,
    selected,
    user,
    nextIdentity: nextAssetRequestIdentity,
    beforeAssetMutation: async (workOrderId) => {
      if (detailRef.current?.header.id !== workOrderId) return null;
      const saved = await flushPendingProductName();
      return saved && detailRef.current?.header.id === workOrderId ? detailRef.current : null;
    },
    onDetailProjection: reconcileAssetDetail,
    onMessage: showToast,
  });
  const { hydrate: hydrateAssets, reset: resetAssets } = assetAuthoring;
  const materialAuthoring = useWorkOrderMaterialAuthoringController({
    detail, user, selectedWorkOrderId: selectedWorkOrderIdRef,
    mutationQueue: inlineMutationQueue,
    setDetail, setBasicInfoDraft, setItems, setSelected,
    partnerOptions: materialPartnerOptions,
    prepareOverviewForCreate: prepareOverviewForMaterialCreate,
    prepareOverviewForEdit: prepareOverviewForMaterialEdit,
    requestFeatureTransition: (onProceed) => leaveWithDraftPolicy("feature", onProceed),
    onKnownEntityVersion: reconcileKnownEntityVersion,
    setRequestError: (error, retryTarget) => materialAuthenticationErrorRef.current(error, retryTarget),
    showToast,
    onActionProcessing: setActionProcessing,
    draftBatch,
  });
  const { resetSession: resetMaterialSession } = materialAuthoring;
  const materialCache = materialAuthoring.cache;
  const activeMaterialType = materialAuthoring.activeType;
  const materialEditor = materialAuthoring.editor;
  const activeMaterialField = materialAuthoring.activeField;
  const activeMaterialInlineSession = materialAuthoring.activeInlineSession;
  const materialSaveNotice = materialAuthoring.saveNotice;
  const materialLifecycleBusyId = materialAuthoring.lifecycleBusyId;
  const materialOrderBusyId = materialAuthoring.orderBusyId;
  const materialOrderBusyAction = materialAuthoring.orderBusyAction;
  const materialEditorDirty = materialAuthoring.dirty;
  const setMaterialSaveNotice = materialAuthoring.setSaveNotice;
  const dirty = basicInfoDirty || materialEditorDirty;

  function applyCoreWorkOrderOpen(core: WorkOrderDetailCore, item: WorkOrderListItem) {
    if (deletedDraftWorkOrderIdsRef.current.has(core.header.id)) return;
    selectedWorkOrderIdRef.current = core.header.id;
    detailRef.current = core;
    setSelected(item);
    setDetail(core);
    resetAssets();
    setMaterialPartnerOptions([]);
    setSeriesHistory(null);
    setBasicInfoDraft(basicInfoDraftFromDetail(core));
    setBasicInfoErrors({});
    setEditing(false);
    setSaveState("read-only");
    setSaveMessage(null);
    setErrorState(null);
    setPhase("detail-ready");
  }

  async function reconcileOpenChildren(
    workOrderId: string,
    childrenPromise: ReturnType<typeof loadWorkOrderChildHydration>,
    contextLabel: "레시피" | "복사본" | "리오더",
  ) {
    if (deletedDraftWorkOrderIdsRef.current.has(workOrderId)) return;
    try {
      const children = await childrenPromise;
      if (selectedWorkOrderIdRef.current !== workOrderId) return;
      if (children.detail.header.entityVersion > (detailRef.current?.header.entityVersion ?? 0)) {
        detailRef.current = children.detail;
        setDetail(children.detail);
        if (activeBasicFieldRef.current === null) setBasicInfoDraft(basicInfoDraftFromDetail(children.detail));
      }
      if (children.images) hydrateAssets(children.images.items, children.images.attachments);
      if (children.partners) setMaterialPartnerOptions(children.partners.items);
      setSeriesHistory(children.history);
      if (children.unavailable.length > 0) {
        showToast(`${contextLabel}는 열렸지만 ${childHydrationLabel(children.unavailable)} 정보를 불러오지 못했습니다. 해당 영역에서 다시 시도해 주세요.`, "warning");
      }
    } catch {
      if (selectedWorkOrderIdRef.current === workOrderId) {
        showToast(`${contextLabel}는 열렸지만 부가 정보를 불러오지 못했습니다. 해당 영역에서 다시 시도해 주세요.`, "warning");
      }
    }
  }

  const setRequestError = useCallback((error: unknown, retryTarget: MobileErrorState["retryTarget"]) => {
    if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
      setUser(null);
      setItems([]);
      setSelected(null);
      selectedWorkOrderIdRef.current = null;
      setDetail(null);
      resetAssets();
      resetMaterialSession();
      resetSizeColorSession();
      setEditing(false);
      setActiveBasicField(null);
      setSaveState("read-only");
      setErrorState({ message: "연결이 만료되었습니다.", guidance: "개발자 자동 연결을 다시 실행해 주세요.", correlationId: error.correlationId, retryTarget: "boot" });
      setPhase("session-expired");
      return;
    }
    setErrorState({
      message: customerMessage(error),
      guidance: customerGuidance(error, retryTarget),
      correlationId: error instanceof MobileApiError ? error.correlationId : null,
      retryTarget,
    });
    setPhase("recoverable-error");
  }, [resetAssets, resetMaterialSession, resetSizeColorSession, selectedWorkOrderIdRef, setSelected]);
  useEffect(() => {
    materialAuthenticationErrorRef.current = setRequestError;
    sizeColorAuthenticationErrorRef.current = (error) => setRequestError(error, "boot");
  }, [setRequestError]);

  async function loadListFor(query: string, status: WorkOrderListStatusFilter, character: WorkOrderCharacterFilter = listCharacterFilter, lineage: readonly WorkOrderLineageFilter[] = listLineageFilters, mode: "blocking" | "search" = "blocking") {
    if (listRequestInFlight.current) {
      if (mode === "search") pendingListSearch.current = { query, status, character, lineage };
      return;
    }
    listRequestInFlight.current = true;
    setErrorState(null);
    if (mode === "search") setListSearching(true);
    else setPhase("authenticated-loading-list");
    try {
      const page = await workOrderQueryController.list({ query, status, character, lineage });
      setItems(page.items.filter((item) => !deletedDraftWorkOrderIdsRef.current.has(item.workOrderId)));
      setHasMore(page.hasMore);
      setListNextCursor(page.nextCursor);
      setListQuery(query);
      setListStatusFilter(status);
      setListCharacterFilter(character);
      setListLineageFilters(lineage);
      if (mode === "blocking") {
        setSelected(null);
        selectedWorkOrderIdRef.current = null;
        setDetail(null);
        resetAssets();
        setPhase("list-ready");
      }
    } catch (error) {
      setRequestError(error, "list");
    } finally {
      listRequestInFlight.current = false;
      if (mode === "search") setListSearching(false);
      const pending = pendingListSearch.current;
      pendingListSearch.current = null;
      if (pending && (pending.query !== query || pending.status !== status || pending.character !== character || pending.lineage.join(",") !== lineage.join(","))) void loadListFor(pending.query, pending.status, pending.character, pending.lineage, "search");
    }
  }

  async function loadList() {
    await loadListFor(listQuery, listStatusFilter, listCharacterFilter, listLineageFilters);
  }

  const authenticateAndLoadList = useCallback(async (authenticatedUser?: MobileCurrentUser) => {
    const currentUser = authenticatedUser ?? await mobileSessionController.current();
    setUser(currentUser);
    const page = await workOrderQueryController.list();
    setItems(page.items.filter((item) => !deletedDraftWorkOrderIdsRef.current.has(item.workOrderId)));
    setHasMore(page.hasMore);
    setListNextCursor(page.nextCursor);
    setListQuery("");
    setListStatusFilter("all");
    setListCharacterFilter("all");
    setListLineageFilters([]);
    setPhase("list-ready");
  }, []);

  const autoConnect = useCallback(async () => {
    if (autoConnectInFlight.current || manualDisconnectSuppressed.current) return;
    autoConnectInFlight.current = true;
    setErrorState(null);
    setPhase("developer-auto-connecting");
    try {
      await authenticateAndLoadList(await mobileSessionController.autoConnect());
    } catch (error) {
      setErrorState({ message: "개발자 자동 연결을 사용할 수 없습니다.", guidance: customerGuidance(error, "boot"), correlationId: error instanceof MobileApiError ? error.correlationId : null, retryTarget: "boot" });
      setPhase("disconnected-auto-failed");
    } finally {
      autoConnectInFlight.current = false;
    }
  }, [authenticateAndLoadList]);

  const boot = useCallback(async () => {
    setPhase("session-checking");
    try {
      await authenticateAndLoadList();
    } catch (error) {
      if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        await autoConnect();
        return;
      }
      setRequestError(error, "boot");
    }
  }, [authenticateAndLoadList, autoConnect, setRequestError]);

  useEffect(() => {
    detailRef.current = detail;
    activeBasicFieldRef.current = activeBasicField;
  }, [activeBasicField, detail]);

  useEffect(() => {
    if (!detail || !workOrderReadinessNeedsCanonicalRefresh(detail)) return;
    void refreshCanonicalDetailAfterMutation(detail.header.id).catch(() => {
      showToast("저장됐지만 발행 전 확인을 새로고침하지 못했습니다. 최신 내용을 다시 불러와 주세요.", "warning");
    });
  }, [detail, refreshCanonicalDetailAfterMutation, showToast]);

  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    void boot().catch(() => undefined);
  }, [boot]);

  async function connect(code: string) {
    setErrorState(null);
    setPhase("connecting-manual");
    try {
      await authenticateAndLoadList(await mobileSessionController.connectWithCode(code));
    } catch (error) {
      setErrorState({ message: customerMessage(error), guidance: customerGuidance(error, "boot"), correlationId: error instanceof MobileApiError ? error.correlationId : null, retryTarget: "boot" });
      setPhase("manual-code-entry");
    }
  }

  async function selectItem(item: WorkOrderListItem) {
    if (deletedDraftWorkOrderIdsRef.current.has(item.workOrderId)) return;
    if (detailRequestInFlight.current) return;
    detailRequestInFlight.current = true;
    selectedWorkOrderIdRef.current = item.workOrderId;
    resetMaterialSession();
    setSelected(item);
    setDetail(null);
    resetAssets();
    setMaterialPartnerOptions([]);
    setErrorState(null);
    setPhase("detail-loading");
    try {
      const hydrated = await loadWorkOrderDetailHydration(item.workOrderId);
      if (deletedDraftWorkOrderIdsRef.current.has(item.workOrderId)) {
        if (selectedWorkOrderIdRef.current === item.workOrderId) clearDetailAndReturnToList();
        return;
      }
      if (selectedWorkOrderIdRef.current !== item.workOrderId) return;
      applyCoreWorkOrderOpen(hydrated.detail, item);
      void reconcileOpenChildren(item.workOrderId, hydrated.children, "레시피");
    } catch (error) {
      setRequestError(error, "detail");
    } finally {
      detailRequestInFlight.current = false;
    }
  }

  function clearDetailAndReturnToList() {
    const shouldReconcileList = listReconcileRequired.current;
    listReconcileRequired.current = false;
    selectedWorkOrderIdRef.current = null;
    setSelected(null);
    setDetail(null);
    resetAssets();
    setMaterialPartnerOptions([]);
    setSeriesHistory(null);
    setSeriesHistoryVisible(false);
    committedReorderRead.current = null;
    reorderAttemptIdentity.current = null;
    setErrorState(null);
    setEditing(false);
    setActiveBasicField(null);
    setBasicInfoErrors({});
    setSaveState("read-only");
    setSaveMessage(null);
    resetMaterialSession();
    setPhase("list-ready");
    if (shouldReconcileList) {
      void loadListFor(listQuery, listStatusFilter, listCharacterFilter, listLineageFilters, "search");
    }
  }

  function discardActiveEditors() {
    if (detail) setBasicInfoDraft(basicInfoDraftFromDetail(detail));
    setBasicInfoErrors({});
    setConflictVersion(null);
    setEditing(false);
    setActiveBasicField(null);
    setSaveState("read-only");
    setSaveMessage(null);
    materialAuthoring.closeEditorSession();
    setMaterialSaveNotice(null);
  }

  function leaveWithDraftPolicy(intent: DraftExitIntent, onProceed: () => void) {
    const reason: DraftBatchFlushReason = intent === "feature" ? "tab-change" : intent === "list" || intent === "work-order" ? "detail-exit" : "explicit";
    const saveInFlight = overviewMutation.inFlight || productNameAutosaveInFlightRef.current !== null || productNameAutosaveTimerRef.current !== null || materialAuthoring.isMutationInFlight() || assetAuthoring.isMutationInFlight()
      || draftBatch.status("overview") === "saving" || draftBatch.status("sizes") === "saving" || draftBatch.status("materials") === "saving" || draftBatch.status("production") === "saving" || draftBatch.status("finished-spec") === "saving";
    if (saveInFlight || draftBatch.isDirty() || pendingIntentFlush.current) {
      const captured = pendingIntentController.capture({ key: intent, isValid: () => true, run: onProceed });
      if (!captured || pendingIntentFlush.current) return;
      pendingIntentFlush.current = true;
      void beginWaflPresentationFirstOperation({ enterPending: () => setPendingIntentSaving(true) }).then(async () => {
        const nameCommitted = await flushPendingProductName();
        return nameCommitted ? draftBatch.flushAll(reason) : false;
      }).then((committed) => {
        pendingIntentFlush.current = false;
        setPendingIntentSaving(false);
        if (!committed) {
          pendingIntentController.drop();
          showToast("저장하지 못한 변경이 남아 있습니다. 연결을 확인한 뒤 다시 시도해 주세요.", "error");
          return;
        }
        if (editing || materialEditor || dirty) discardActiveEditors();
        pendingIntentController.replay();
      });
      return;
    }
    void flushPendingProductName().then((nameCommitted) => nameCommitted ? draftBatch.flushAll(reason) : false).then((committed) => {
      if (!committed) {
        showToast("저장하지 못한 변경이 남아 있습니다. 연결을 확인한 뒤 다시 시도해 주세요.", "error");
        failedDraftExitRef.current = { intent, onProceed };
        setFailedDraftExitVisible(true);
        return;
      }
      if (editing || materialEditor || dirty) discardActiveEditors();
      onProceed();
    });
  }

  function retryFailedDraftExit() {
    const pending = failedDraftExitRef.current;
    if (!pending) return;
    const reason: DraftBatchFlushReason = pending.intent === "feature" ? "tab-change" : pending.intent === "list" || pending.intent === "work-order" ? "detail-exit" : "explicit";
    void draftBatch.flushAll(reason).then((committed) => {
      if (!committed) { showToast("변경을 다시 저장하지 못했습니다.", "error"); return; }
      failedDraftExitRef.current = null;
      setFailedDraftExitVisible(false);
      if (editing || materialEditor || dirty) discardActiveEditors();
      pending.onProceed();
    });
  }

  function discardFailedDraftExit() {
    const pending = failedDraftExitRef.current;
    failedDraftExitRef.current = null;
    setFailedDraftExitVisible(false);
    draftBatch.reset();
    discardActiveEditors();
    resetSizeColorSession();
    resetMaterialSession();
    pending?.onProceed();
  }

  function returnToList() {
    leaveWithDraftPolicy("list", clearDetailAndReturnToList);
  }

  function selectItemSafely(item: WorkOrderListItem) {
    if (selected?.workOrderId === item.workOrderId) return;
    leaveWithDraftPolicy("work-order", () => void selectItem(item));
  }

  async function executeReorderCreation(source: WorkOrderDetailCore) {
    clientRequestCounter.current += 1;
    const existing = reorderAttemptIdentity.current;
    const identity = existing && existing.sourceWorkOrderId === source.header.id
      ? existing
      : {
          sourceWorkOrderId: source.header.id,
          clientRequestId: `alpha67-reorder-${Date.now()}-${clientRequestCounter.current}`,
          idempotencyKey: `alpha67-reorder-${Date.now()}-${clientRequestCounter.current}`,
        };
    reorderAttemptIdentity.current = identity;
    const created = await workOrderMutationController.createReorder(source.header.id, {
      clientRequestId: identity.clientRequestId,
      totalQuantity: 0,
      dueDate: null,
    }, identity.idempotencyKey);
    committedReorderRead.current = { workOrderId: created.result.workOrderId, reorderRound: created.result.reorderRound };
    selectedWorkOrderIdRef.current = created.result.workOrderId;
    setSelected(null);
    setDetail(null);
    showToast(`${created.result.reorderRound}차 리오더를 만들었습니다.`, "success");
    await hydrateCommittedReorder();
  }

  async function createReorderFromList(item: WorkOrderListItem) {
    if (item.status === "draft" || item.identity.isSample || item.identity.derivationKind === "rework") return;
    if (reorderMutation.tryBegin() !== "started") return;
    try {
      await runWorkOrderListReorderFlow({
        onProcessing: setReorderPending,
        present: waitForWaflPresentationBoundary,
        loadSourceCore: async () => detail?.header.id === item.workOrderId
          ? detail
          : workOrderQueryController.detail(item.workOrderId),
        validateSource: canCreateMobileWorkOrderReorder,
        createAndOpenAuthoritativeResult: executeReorderCreation,
      });
    } catch (error) {
      if (committedReorderRead.current) {
        setPhase("list-ready");
        showToast("리오더는 생성되었습니다. 같은 리오더를 다시 열어 주세요.", "warning");
      } else {
        showToast(customerMessage(error), "error");
      }
    } finally {
      reorderMutation.complete();
    }
  }

  async function createCopyFromList(item: WorkOrderListItem) {
    if (copyMutation.tryBegin() !== "started") return;
    await beginWaflPresentationFirstOperation({ enterPending: () => setCopyPending(true) });
    clientRequestCounter.current += 1;
    const suffix = `${Date.now()}-${clientRequestCounter.current}`;
    try {
      const created = await workOrderMutationController.createCopy(item.workOrderId, { clientRequestId: `alpha68-copy-${suffix}` }, `alpha68-copy-${suffix}`);
      const createdWorkOrderId = created.result.workOrderId;
      const copiedDetail = await hydrateAuthoritativeCreatedCopy(createdWorkOrderId, (workOrderId) => workOrderQueryController.detail(workOrderId));
      if (copiedDetail.header.id !== createdWorkOrderId || copiedDetail.header.status !== "draft") {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "복사된 레시피 초안을 확인하지 못했습니다." });
      }
      const copiedItem = listItemFromCreatedDraft(copiedDetail);
      setItems((current) => reconcileCreatedWorkOrderListItem(current, copiedItem));
      selectedWorkOrderIdRef.current = copiedItem.workOrderId;
      setSelected(copiedItem);
      detailRef.current = copiedDetail;
      setDetail(copiedDetail);
      resetAssets();
      setMaterialPartnerOptions([]);
      setSeriesHistory(null);
      setBasicInfoDraft(basicInfoDraftFromDetail(copiedDetail));
      setPhase("detail-ready");
      setCopyPending(false);
      showToast("레시피가 복사되었습니다.", "success");
      void reconcileOpenChildren(createdWorkOrderId, loadWorkOrderChildHydration(copiedDetail), "복사본");
    } catch (error) {
      setCopyPending(false);
      showToast(customerMessage(error), "error");
    } finally {
      copyMutation.complete();
    }
  }

  function requestDeleteWorkOrder(item: WorkOrderListItem) {
    setActionConfirmation({
      title: "레시피를 삭제합니다",
      helper: "삭제한 레시피는 복구할 수 없습니다.",
      cancelAccessibilityLabel: "레시피 삭제 취소",
      confirmAccessibilityLabel: "레시피 삭제",
      destructive: true,
      safeOptionLabel: "유지",
      actionOptionLabel: "삭제",
      onCancel: () => setActionConfirmation(null),
      onConfirm: () => { setActionConfirmation(null); void deleteDraftWorkOrderFromList(item); },
    });
  }

  async function deleteDraftWorkOrderFromList(item: WorkOrderListItem) {
    if (item.status !== "draft") { showToast("초안 레시피만 삭제할 수 있습니다.", "warning"); return; }
    if (deleteDraftMutation.tryBegin() !== "started") return;
    try {
      await runWaflProcessingAction({
        processingMessage: "레시피를 삭제 중입니다.",
        successMessage: "레시피가 삭제되었습니다.",
        onProcessing: setActionProcessing,
        onSuccess: (message) => showToast(message, "success"),
        command: async () => {
          const deleted = await workOrderMutationController.deleteDraft(item.workOrderId);
          deletedDraftWorkOrderIdsRef.current.add(deleted.workOrderId);
          setItems((current) => current.filter((candidate) => candidate.workOrderId !== deleted.workOrderId));
          if (selectedWorkOrderIdRef.current === deleted.workOrderId) clearDetailAndReturnToList();
        },
      });
    } catch (error) { showToast(customerMessage(error), "error"); }
    finally { deleteDraftMutation.complete(); }
  }

  function openCreateSheet() {
    if (createMutation.inFlight) return;
    createAttemptIdentity.current = null;
    setCreateProductName("");
    setCreateIsSample(true);
    setCreateError(null);
    setCreateSheetVisible(true);
  }

  function cancelCreateSheet() {
    if (createMutation.inFlight) return;
    createAttemptIdentity.current = null;
    setCreateError(null);
    setCreateSheetVisible(false);
  }

  function changeCreateProductName(value: string) {
    if (createAttemptIdentity.current?.productName !== value.trim()) createAttemptIdentity.current = null;
    setCreateProductName(value);
    if (createError) setCreateError(null);
  }

  function listItemFromCreatedDraft(created: WorkOrderDetailCore): WorkOrderListItem {
    return {
      workOrderId: created.header.id,
      displayDocumentNumber: created.header.document.displayDocumentNumber,
      productName: created.header.productName,
      status: created.header.status,
      dueDate: created.header.dueDate,
      totalQuantity: created.header.totalQuantity,
      estimatedAmountSummary: { currency: created.amounts.currency, estimatedTotal: created.amounts.estimatedTotal },
      representativeThumbnail: created.header.representativeImage,
      incompleteMaterialSummary: { incompleteFabricCount: 0, incompleteAccessoryCount: 0 },
      processCount: 0,
      latestDocumentStatus: created.header.document.status,
      createdAt: created.header.createdAt,
      updatedAt: created.header.updatedAt,
      identity: created.header.identity,
    };
  }

  async function refreshCurrentFilteredListAfterCreate() {
    try {
      const page = await workOrderQueryController.list({ query: listQuery, status: listStatusFilter, character: listCharacterFilter, lineage: listLineageFilters });
      setItems(page.items.filter((item) => !deletedDraftWorkOrderIdsRef.current.has(item.workOrderId)));
      setHasMore(page.hasMore);
      setListNextCursor(page.nextCursor);
    } catch {
      showToast("리오더는 열렸지만 현재 목록을 새로고침하지 못했습니다.", "warning");
    }
  }

  async function hydrateCommittedReorder() {
    const committed = committedReorderRead.current;
    if (!committed || detailRequestInFlight.current) return;
    detailRequestInFlight.current = true;
    setErrorState(null);
    setPhase("detail-loading");
    try {
      const reorderedDetail = await workOrderQueryController.detail(committed.workOrderId);
      if (reorderedDetail.header.id !== committed.workOrderId || reorderedDetail.header.identity.derivationKind !== "reorder" || reorderedDetail.header.identity.isSample) {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "생성된 리오더의 초기 상태를 확인하지 못했습니다." });
      }
      const item = listItemFromCreatedDraft(reorderedDetail);
      selectedWorkOrderIdRef.current = committed.workOrderId;
      setSelected(item);
      setItems((current) => reconcileCreatedWorkOrderListItem(current, item));
      detailRef.current = reorderedDetail;
      setDetail(reorderedDetail);
      resetAssets();
      setMaterialPartnerOptions([]);
      setSeriesHistory(null);
      setBasicInfoDraft(basicInfoDraftFromDetail(reorderedDetail));
      setBasicInfoErrors({});
      setEditing(false);
      setSaveState("read-only");
      setSaveMessage(null);
      setPhase("detail-ready");
      setErrorState(null);
      committedReorderRead.current = null;
      reorderAttemptIdentity.current = null;
      setReorderPending(false);
      void reconcileOpenChildren(committed.workOrderId, loadWorkOrderChildHydration(reorderedDetail), "리오더");
      void refreshCurrentFilteredListAfterCreate();
    } catch (error) {
      setErrorState({
        message: "리오더는 생성되었습니다.",
        guidance: customerGuidance(error, "post-create-detail"),
        correlationId: error instanceof MobileApiError ? error.correlationId : null,
        retryTarget: "post-create-detail",
      });
      setPhase("recoverable-error");
    } finally {
      detailRequestInFlight.current = false;
    }
  }

  async function createWorkOrderDraftFromMobile() {
    const productName = createProductName.trim();
    const validationError = validateWorkOrderProductName(productName);
    if (validationError) {
      setCreateError(validationError);
      return;
    }
    if (createMutation.tryBegin() !== "started") return;
    await beginWaflPresentationFirstOperation({ enterPending: () => setCreatePending(true) });
    setCreateError(null);
    clientRequestCounter.current += 1;
    const identity = resolveWorkOrderCreateAttempt(
      createAttemptIdentity.current,
      productName,
      createIsSample,
      `${Date.now()}-${clientRequestCounter.current}`,
    );
    createAttemptIdentity.current = identity;
    try {
      const created = await workOrderMutationController.createDraft({ clientRequestId: identity.clientRequestId, productName, isSample: createIsSample }, identity.idempotencyKey);
      const [createdDetail, createdImages, partnerPage] = await Promise.all([
        workOrderQueryController.detail(created.result.workOrderId),
        workOrderQueryController.images(created.result.workOrderId),
        workOrderQueryController.materialPartners(created.result.workOrderId),
      ]);
      if (
        createdDetail.header.id !== created.result.workOrderId
        || createdDetail.header.status !== "draft"
        || createdDetail.revision.status !== "draft"
        || createdDetail.header.totalQuantity !== 0
        || createdImages.entityVersion !== createdDetail.header.entityVersion
        || partnerPage.entityVersion !== createdDetail.header.entityVersion
      ) {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "생성된 레시피의 초기 상태를 확인하지 못했습니다." });
      }
      const item = listItemFromCreatedDraft(createdDetail);
      setItems((current) => reconcileCreatedWorkOrderListItem(current, item));
      selectedWorkOrderIdRef.current = item.workOrderId;
      setSelected(item);
      setDetail(createdDetail);
      hydrateAssets(createdImages.items, createdImages.attachments);
      setMaterialPartnerOptions(partnerPage.items);
      setBasicInfoDraft(basicInfoDraftFromDetail(createdDetail));
      setBasicInfoErrors({});
      setEditing(false);
      setSaveState("read-only");
      setSaveMessage(null);
      setErrorState(null);
      setCreateSheetVisible(false);
      setCreateProductName("");
      setPhase("detail-ready");
      createAttemptIdentity.current = null;
    } catch (error) {
      setCreateError(customerMessage(error));
    } finally {
      createMutation.complete();
      setCreatePending(false);
    }
  }

  async function createReorderFromMobile(sourceOverride?: WorkOrderDetailCore) {
    const source = sourceOverride ?? detail;
    if (!source || !canCreateMobileWorkOrderReorder(source)) return;
    if (reorderMutation.tryBegin() !== "started") return;
    await beginWaflPresentationFirstOperation({ enterPending: () => setReorderPending(true) });
    try {
      await executeReorderCreation(source);
    } catch (error) {
      if (committedReorderRead.current) {
        setErrorState({
          message: "리오더는 생성되었습니다.",
          guidance: customerGuidance(error, "post-create-detail"),
          correlationId: error instanceof MobileApiError ? error.correlationId : null,
          retryTarget: "post-create-detail",
        });
        setPhase("recoverable-error");
      } else {
        showToast(customerMessage(error), "error");
      }
    } finally {
      reorderMutation.complete();
      setReorderPending(false);
    }
  }

  async function openSeriesWorkOrder(workOrderId: string) {
    if (workOrderId === selected?.workOrderId) {
      setSeriesHistoryVisible(false);
      return;
    }
    setSeriesHistoryVisible(false);
    selectedWorkOrderIdRef.current = workOrderId;
    setPhase("detail-loading");
    try {
      const hydrated = await loadWorkOrderDetailHydration(workOrderId);
      if (selectedWorkOrderIdRef.current !== workOrderId) return;
      const item = listItemFromCreatedDraft(hydrated.detail);
      applyCoreWorkOrderOpen(hydrated.detail, item);
      void reconcileOpenChildren(workOrderId, hydrated.children, "레시피");
    } catch (error) {
      setRequestError(error, "detail");
    }
  }

  function loadListSafely() {
    leaveWithDraftPolicy("list", () => void loadList());
  }

  function applyListSearch(query: string) {
    const normalized = query.trim();
    if (normalized === listQuery) return;
    void loadListFor(normalized, listStatusFilter, listCharacterFilter, listLineageFilters, "search");
  }

  function applyListStatusFilter(status: WorkOrderListStatusFilter) {
    if (status === listStatusFilter) return;
    void loadListFor(listQuery, status, listCharacterFilter, listLineageFilters, "search");
  }

  function applyListIdentityFilters(character: WorkOrderCharacterFilter, lineage: readonly WorkOrderLineageFilter[]) {
    const normalizedLineage = (["reorder", "rework"] as const).filter((value) => lineage.includes(value));
    if (character === listCharacterFilter && normalizedLineage.join(",") === listLineageFilters.join(",")) return;
    void loadListFor(listQuery, listStatusFilter, character, normalizedLineage, "search");
  }

  async function loadMoreList() {
    if (!listNextCursor || !hasMore || listRequestInFlight.current) return;
    listRequestInFlight.current = true;
    setListLoadingMore(true);
    try {
      const page = await workOrderQueryController.list({ query: listQuery, status: listStatusFilter, character: listCharacterFilter, lineage: listLineageFilters, cursor: listNextCursor });
      setItems((current) => {
        const known = new Set(current.map((item) => item.workOrderId));
        return [...current, ...page.items.filter((item) => !known.has(item.workOrderId))];
      });
      setHasMore(page.hasMore);
      setListNextCursor(page.nextCursor);
    } catch (error) {
      setRequestError(error, "list");
    } finally {
      listRequestInFlight.current = false;
      setListLoadingMore(false);
    }
  }

  async function disconnect() {
    setErrorState(null);
    try {
      await mobileSessionController.disconnect();
      manualDisconnectSuppressed.current = true;
      setUser(null);
      setItems([]);
      setHasMore(false);
      setListNextCursor(null);
      selectedWorkOrderIdRef.current = null;
      setSelected(null);
      setDetail(null);
      resetAssets();
      resetMaterialSession();
      resetSizeColorSession();
      setEditing(false);
      setSaveState("read-only");
      setErrorState(null);
      setPhase("disconnected-auto-failed");
    } catch (error) {
      setRequestError(error, "disconnect");
    }
  }


  function disconnectSafely() {
    leaveWithDraftPolicy("session-loss", () => void disconnect());
  }

  function beginBasicInfoEdit(field: BasicInfoInlineField) {
    if (!canEditWorkOrder(detail, user) && !(field === "dueDate" && canEditConfirmedWorkOrderMutableFields(detail, user))) return;
    if (overviewMutation.inFlight || pendingIntentFlush.current) {
      const targetWorkOrderId = detail?.header.id ?? null;
      const captured = pendingIntentController.capture({
        key: `field:${field}`,
        isValid: () => detailRef.current?.header.id === targetWorkOrderId,
        run: () => beginBasicInfoEdit(field),
      });
      if (!captured || pendingIntentFlush.current) return;
      pendingIntentFlush.current = true;
      setPendingIntentSaving(true);
      void draftBatch.flushAll("explicit").then((committed) => {
        pendingIntentFlush.current = false;
        setPendingIntentSaving(false);
        if (committed) pendingIntentController.replay();
        else pendingIntentController.drop();
      });
      return;
    }
    if (materialEditor && materialEditorDirty) {
      const previousMaterial = activeMaterialInlineSession;
      if (!previousMaterial) {
        const label = materialLabel(materialEditor.materialType);
        showWaflAlert(`${label} 편집을 완료한 뒤 개요를 수정해 주세요.`, "warning");
        return;
      }
      void materialAuthoring.save({ [previousMaterial.field]: materialEditor.draft[previousMaterial.field] }, previousMaterial);
    }
    if (editing) {
      const basicTransition = planInlineEditTransition({ currentField: activeBasicField, nextField: field, currentDirty: basicInfoDirty });
      if (activeBasicField !== field) {
        const previousSession = activeBasicSessionRef.current;
        if (basicTransition.commitCurrent && previousSession) {
          void saveBasicInfo({ [previousSession.field]: basicInfoDraft[previousSession.field] }, previousSession.field, previousSession.token);
        }
        activeBasicFieldRef.current = field;
        activeBasicSessionRef.current = { field, token: ++basicInfoSessionSequence.current };
      }
      setActiveBasicField(field);
      return;
    }
    materialAuthoring.closeEditorSession();
    setMaterialSaveNotice(null);
    if (!draftBatch.isDirty("overview")) {
      const canonicalDraft = basicInfoDraftFromDetail(detail);
      basicInfoDraftRef.current = canonicalDraft;
      setBasicInfoDraft(canonicalDraft);
    }
    setBasicInfoErrors({});
    setConflictVersion(null);
    setSaveState("editing");
    setSaveMessage(null);
    setEditing(true);
    activeBasicFieldRef.current = field;
    activeBasicSessionRef.current = { field, token: ++basicInfoSessionSequence.current };
    setActiveBasicField(field);
  }

  function changeBasicInfoDraft(field: keyof BasicInfoDraft, value: string) {
    setBasicInfoDraft((current) => {
      const next = { ...current, [field]: value };
      basicInfoDraftRef.current = next;
      return next;
    });
    setBasicInfoErrors((current) => ({ ...current, [field]: undefined }));
    if (saveState !== "saving") setSaveState("editing");
    setSaveMessage(null);
    if (field === "productName") scheduleProductNameAutosave(value);
    else draftBatch.stage("overview");
  }

  function cancelProductNameAutosaveTimer() {
    productNameAutosaveGenerationRef.current += 1;
    if (productNameAutosaveTimerRef.current) clearTimeout(productNameAutosaveTimerRef.current);
    productNameAutosaveTimerRef.current = null;
  }

  function scheduleProductNameAutosave(value: string) {
    cancelProductNameAutosaveTimer();
    const generation = productNameAutosaveGenerationRef.current;
    productNameAutosaveTimerRef.current = setTimeout(() => {
      productNameAutosaveTimerRef.current = null;
      if (generation !== productNameAutosaveGenerationRef.current) return;
      void persistProductName(value, true);
    }, 500);
  }

  async function persistProductName(value: string, preserveEditor: boolean) {
    const workOrderId = detailRef.current?.header.id;
    if (!workOrderId || selected?.workOrderId !== workOrderId) return false;
    const owner = activeBasicSessionRef.current?.field === "productName" ? activeBasicSessionRef.current : null;
    const operation = Promise.resolve(saveBasicInfo(
      { productName: value },
      owner?.field ?? "productName",
      owner?.token ?? null,
      true,
      false,
      { preserveEditor, productNameOnly: true },
    )).then((result) => result !== false);
    productNameAutosaveInFlightRef.current = operation;
    try {
      return await operation;
    } finally {
      if (productNameAutosaveInFlightRef.current === operation) productNameAutosaveInFlightRef.current = null;
      const latest = basicInfoDraftRef.current.productName;
      if (preserveEditor && detailRef.current?.header.id === workOrderId && latest !== value) scheduleProductNameAutosave(latest);
    }
  }

  async function flushPendingProductName(preserveEditor = activeBasicSessionRef.current?.field === "productName") {
    cancelProductNameAutosaveTimer();
    const active = productNameAutosaveInFlightRef.current;
    if (active && !(await active)) return false;
    cancelProductNameAutosaveTimer();
    const latestDetail = detailRef.current;
    if (!latestDetail) return true;
    const latestValue = basicInfoDraftRef.current.productName;
    if (latestValue.trim() === latestDetail.header.productName) return true;
    return persistProductName(latestValue, preserveEditor);
  }

  async function finalizeProductNameOnBlur(value: string) {
    if (basicInfoDraftRef.current.productName !== value) changeBasicInfoDraft("productName", value);
    const saved = await flushPendingProductName(false);
    if (!saved) return;
    if (activeBasicSessionRef.current?.field === "productName") {
      activeBasicFieldRef.current = null;
      activeBasicSessionRef.current = null;
      setEditing(false);
      setActiveBasicField(null);
      setSaveState(draftBatch.isDirty("overview") ? "editing" : "read-only");
      setSaveMessage(null);
    }
  }

  function cancelBasicInfoEdit() {
    if (detail) setBasicInfoDraft(basicInfoDraftFromDetail(detail));
    setBasicInfoErrors({});
    setConflictVersion(null);
    setSaveState("read-only");
    setSaveMessage(null);
    setEditing(false);
    activeBasicFieldRef.current = null;
    activeBasicSessionRef.current = null;
    setActiveBasicField(null);
    categoryResetIntentRef.current = null;
  }

  function nextClientRequestId() {
    clientRequestCounter.current += 1;
    return `alpha46-mobile-basic-${Date.now()}-${clientRequestCounter.current}`;
  }

  async function saveBasicInfo(
    override?: Partial<BasicInfoDraft>,
    ownerField = activeBasicSessionRef.current?.field ?? null,
    ownerToken = activeBasicSessionRef.current?.token ?? null,
    commitImmediately = false,
    dependentResetConfirmed = false,
    options: { readonly preserveEditor?: boolean; readonly productNameOnly?: boolean } = {},
  ) {
    const categoryOverride = override?.categoryMajor;
    const targetOverride = override?.targetAudience;
    const currentCategory = detail ? basicInfoDraftFromDetail(detail).categoryMajor : "";
    const currentTarget = detail ? basicInfoDraftFromDetail(detail).targetAudience : "";
    const dependentField = targetOverride !== undefined && targetOverride !== currentTarget
      ? "targetAudience"
      : categoryOverride !== undefined && categoryOverride !== currentCategory
        ? "categoryMajor"
        : null;
    const confirmedCategoryReset = detail && dependentField !== null
      && categoryResetIntentRef.current?.workOrderId === detail.header.id
      && categoryResetIntentRef.current.targetAudience === (targetOverride ?? basicInfoDraftRef.current.targetAudience)
      && categoryResetIntentRef.current.categoryMajor === (categoryOverride ?? basicInfoDraftRef.current.categoryMajor);
    if (!commitImmediately && dependentField !== null && !dependentResetConfirmed && !confirmedCategoryReset && detail) {
      const matrix = sizeColor.state.bundle?.matrix;
      const spec = sizeColor.state.bundle?.specifications;
      const hasDependents = hasCategoryDependentWorkOrderData({
        itemCode: detail.header.itemCode,
        totalQuantity: detail.header.totalQuantity,
        sizeCount: detail.tabCounts.sizes,
        colorCount: detail.tabCounts.colors,
        allocationCount: matrix?.quantityCells.length ?? 0,
        specPomCount: spec?.pomColumns.length ?? 0,
        specCellCount: spec?.cells.length ?? 0,
        sourceTemplateId: spec?.templateId ?? null,
      });
      if (hasDependents) {
        setActionConfirmation({
          title: dependentField === "targetAudience" ? "성별을 변경할까요?" : "대분류를 변경할까요?",
          helper: "적용 중인 사이즈와 스펙 정보가 초기화됩니다.",
          cancelAccessibilityLabel: `${dependentField === "targetAudience" ? "성별" : "대분류"} 변경 취소`,
          confirmAccessibilityLabel: `${dependentField === "targetAudience" ? "성별" : "대분류"} 변경 실행`,
          safeOptionLabel: "취소",
          actionOptionLabel: "변경",
          onCancel: () => {
            setActionConfirmation(null);
            categoryResetIntentRef.current = null;
            const next = { ...basicInfoDraftRef.current, targetAudience: currentTarget, categoryMajor: currentCategory };
            basicInfoDraftRef.current = next;
            setBasicInfoDraft(next);
            activeBasicFieldRef.current = null;
            activeBasicSessionRef.current = null;
            setEditing(false);
            setActiveBasicField(null);
            setSaveState("read-only");
            setSaveMessage(null);
          },
          onConfirm: () => {
            setActionConfirmation(null);
            const next = { ...basicInfoDraftRef.current, ...override, categoryDetail: "" };
            basicInfoDraftRef.current = next;
            setBasicInfoDraft(next);
            categoryResetIntentRef.current = { workOrderId: detail.header.id, targetAudience: next.targetAudience, categoryMajor: next.categoryMajor, resetApplied: false };
            activeBasicFieldRef.current = null;
            activeBasicSessionRef.current = null;
            setEditing(false);
            setActiveBasicField(null);
            draftBatch.stage("overview");
          },
        });
        return "confirmation" as const;
      }
    }
    if (!commitImmediately && dependentResetConfirmed && dependentField !== null && detail && override) {
      override = { ...override, categoryDetail: "" };
      const next = { ...basicInfoDraftRef.current, ...override };
      categoryResetIntentRef.current = {
        workOrderId: detail.header.id,
        targetAudience: next.targetAudience,
        categoryMajor: next.categoryMajor,
        resetApplied: false,
      };
    }
    let staged = false;
    if (!commitImmediately && override) {
      const next = { ...basicInfoDraftRef.current, ...override };
      staged = JSON.stringify(next) !== JSON.stringify(basicInfoDraftRef.current);
      basicInfoDraftRef.current = next;
      setBasicInfoDraft(next);
    }
    if (!commitImmediately) {
      if (staged || !override) draftBatch.stage("overview");
      if (activeBasicSessionRef.current?.token === ownerToken) {
        activeBasicFieldRef.current = null;
        activeBasicSessionRef.current = null;
        setEditing(false);
        setActiveBasicField(null);
      }
      setSaveState("editing");
      setSaveMessage(null);
      return staged || !override ? "staged" as const : "already-staged" as const;
    }
    const currentDetail = detailRef.current;
    if (!currentDetail || !selected || currentDetail.header.id !== selected.workOrderId) return;
    const effectiveDraft = override ? { ...basicInfoDraftRef.current, ...override } : basicInfoDraftRef.current;
    const inlineRollback = ownerField === "productName"
      || ownerField === "targetAudience"
      || ownerField === "categoryMajor"
      || ownerField === "categoryDetail"
      || ownerField === "seasonCode";
    const rollbackBasicInline = (refreshLatest = false) => {
      if (!inlineRollback) return false;
      if (options.preserveEditor) return false;
      if (activeBasicSessionRef.current?.token !== ownerToken) return true;
      if (refreshLatest) reloadLatestBasicInfo();
      else cancelBasicInfoEdit();
      return true;
    };
    const effectiveDirty = effectiveDraft.productName !== currentDetail.header.productName
      || effectiveDraft.dueDate !== (currentDetail.header.dueDate ?? "")
      || effectiveDraft.targetAudience !== basicInfoDraftFromDetail(currentDetail).targetAudience
      || effectiveDraft.categoryMajor !== basicInfoDraftFromDetail(currentDetail).categoryMajor
      || effectiveDraft.categoryDetail !== basicInfoDraftFromDetail(currentDetail).categoryDetail
      || effectiveDraft.seasonCode !== basicInfoDraftFromDetail(currentDetail).seasonCode;
    if (!effectiveDirty) {
      if (!options.preserveEditor && activeBasicSessionRef.current?.token === ownerToken) cancelBasicInfoEdit();
      return;
    }
    const productNameError = options.productNameOnly ? validateWorkOrderProductName(effectiveDraft.productName.trim()) : null;
    const fieldErrors = options.productNameOnly
      ? productNameError ? { productName: productNameError } : {}
      : validateBasicInfoDraft(effectiveDraft);
    if (Object.keys(fieldErrors).length > 0) {
      setSaveMessage("입력값을 확인해 주세요.");
      if (rollbackBasicInline()) return;
      setBasicInfoErrors(fieldErrors);
      setSaveState("validation-error");
      return;
    }

    type BasicInfoPatch = {
      productName?: string;
      productTypeCode?: string | null;
      seasonCode?: string | null;
      itemCode?: string | null;
      dueDate?: string | null;
      resetCategoryDependents?: true;
    };
    const ownsPatchField = (field: keyof BasicInfoDraft) => !override || Object.prototype.hasOwnProperty.call(override, field);
    const buildPatch = (baseline: WorkOrderDetailCore): BasicInfoPatch => {
      const patch: BasicInfoPatch = {};
      const categoryResetIntent = categoryResetIntentRef.current?.workOrderId === baseline.header.id
        && categoryResetIntentRef.current.targetAudience === effectiveDraft.targetAudience
        && categoryResetIntentRef.current.categoryMajor === effectiveDraft.categoryMajor
        ? categoryResetIntentRef.current
        : null;
      const productName = effectiveDraft.productName.trim();
      if (ownsPatchField("productName") && productName !== baseline.header.productName) patch.productName = productName;
      const dueDate = effectiveDraft.dueDate || null;
      if (ownsPatchField("dueDate") && dueDate !== baseline.header.dueDate) patch.dueDate = dueDate;
      const productTypeCode = encodeWorkOrderProductType(effectiveDraft);
      if ((ownsPatchField("targetAudience") || ownsPatchField("categoryMajor")) && productTypeCode !== baseline.header.productTypeCode) patch.productTypeCode = productTypeCode;
      if (productTypeCode !== baseline.header.productTypeCode
        && !categoryResetIntent?.resetApplied
        && (ownsPatchField("categoryMajor") || (ownsPatchField("targetAudience") && categoryResetIntent !== null))) patch.resetCategoryDependents = true;
      const categoryDetail = effectiveDraft.categoryDetail.trim() || null;
      if (!patch.resetCategoryDependents && ownsPatchField("categoryDetail") && categoryDetail !== baseline.header.itemCode) patch.itemCode = categoryDetail;
      const seasonCode = effectiveDraft.seasonCode.trim() || null;
      if (ownsPatchField("seasonCode") && seasonCode !== baseline.header.seasonCode) patch.seasonCode = seasonCode;
      return patch;
    };
    if (Object.keys(buildPatch(currentDetail)).length === 0) {
      if (!options.preserveEditor && activeBasicSessionRef.current?.token === ownerToken) cancelBasicInfoEdit();
      return;
    }

    if (ownerToken !== null && queuedBasicInfoSessions.current.has(ownerToken)) return;
    if (ownerToken !== null) queuedBasicInfoSessions.current.add(ownerToken);
    try {
    return await inlineMutationQueue.enqueue(async () => {
    overviewMutation.tryBegin();
    const saveStartedAt = Date.now();
    setBasicInfoErrors({});
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const latestDetail = detailRef.current;
      if (!latestDetail || latestDetail.header.id !== selected.workOrderId) return;
      const patch = buildPatch(latestDetail);
      if (Object.keys(patch).length === 0) return true;
      let saved = await workOrderMutationController.updateOverview(selected.workOrderId, {
        clientRequestId: nextClientRequestId(),
        expectedVersion: latestDetail.header.entityVersion,
        patch,
      });
      let persistedBaseline = latestDetail;
      if (patch.resetCategoryDependents) {
        const resetRefreshed: WorkOrderDetailCore = {
          ...latestDetail,
          header: {
            ...latestDetail.header,
            productName: saved.result.productName,
            productTypeCode: saved.result.productTypeCode,
            seasonCode: saved.result.seasonCode,
            itemCode: saved.result.itemCode,
            dueDate: saved.result.dueDate,
            totalQuantity: saved.result.totalQuantity,
            entityVersion: saved.nextVersion,
          },
          revision: { ...latestDetail.revision, factoryDeliveryMemo: saved.result.factoryDeliveryMemo },
          tabCounts: { ...latestDetail.tabCounts, colors: 0, sizes: 0 },
        };
        detailRef.current = resetRefreshed;
        setDetail(resetRefreshed);
        resetSizeColorSession();
        categoryResetIntentRef.current = {
          workOrderId: selected.workOrderId,
          targetAudience: effectiveDraft.targetAudience,
          categoryMajor: effectiveDraft.categoryMajor,
          resetApplied: true,
        };
        persistedBaseline = resetRefreshed;
        const desiredItemCode = effectiveDraft.categoryDetail.trim() || null;
        if (desiredItemCode !== null) {
          saved = await workOrderMutationController.updateOverview(selected.workOrderId, {
            clientRequestId: nextClientRequestId(),
            expectedVersion: saved.nextVersion,
            patch: { itemCode: desiredItemCode },
          });
        }
      }
      const patchCompletedAt = Date.now();
      const refreshed: WorkOrderDetailCore = {
        ...persistedBaseline,
        header: {
          ...persistedBaseline.header,
          productName: saved.result.productName,
          productTypeCode: saved.result.productTypeCode,
          seasonCode: saved.result.seasonCode,
          itemCode: saved.result.itemCode,
          dueDate: saved.result.dueDate,
          totalQuantity: saved.result.totalQuantity,
          entityVersion: saved.nextVersion,
        },
        revision: { ...persistedBaseline.revision, factoryDeliveryMemo: saved.result.factoryDeliveryMemo },
        tabCounts: patch.resetCategoryDependents ? { ...persistedBaseline.tabCounts, colors: 0, sizes: 0 } : persistedBaseline.tabCounts,
      };
      detailRef.current = refreshed;
      setDetail(refreshed);
      setBasicInfoDraft((currentDraft) => {
        const next = basicInfoDraftFromDetail(refreshed);
        const currentOwner = activeBasicSessionRef.current;
        const stagedChangedDuringRequest = basicInfoDraftRef.current !== effectiveDraft
          && JSON.stringify(basicInfoDraftRef.current) !== JSON.stringify(effectiveDraft);
        const resolved = options.preserveEditor && currentOwner?.field === "productName"
          ? { ...next, productName: currentDraft.productName }
          : stagedChangedDuringRequest
          ? currentDraft
          : currentOwner && currentOwner.token !== ownerToken
            ? { ...next, [currentOwner.field]: currentDraft[currentOwner.field] }
            : next;
        basicInfoDraftRef.current = resolved;
        return resolved;
      });
      setItems((current) => current.map((item) => item.workOrderId === selected.workOrderId ? {
        ...item,
        productName: refreshed.header.productName,
        dueDate: refreshed.header.dueDate,
        totalQuantity: refreshed.header.totalQuantity,
        updatedAt: refreshed.header.updatedAt,
      } : item));
      setSelected((current) => current ? {
        ...current,
        productName: refreshed.header.productName,
        dueDate: refreshed.header.dueDate,
        totalQuantity: refreshed.header.totalQuantity,
        updatedAt: refreshed.header.updatedAt,
      } : current);
      setConflictVersion(null);
      if (!options.preserveEditor && (!activeBasicSessionRef.current || activeBasicSessionRef.current.token === ownerToken)) {
        activeBasicFieldRef.current = null;
        activeBasicSessionRef.current = null;
        setEditing(false);
        setActiveBasicField(null);
        setSaveState("saved");
        setSaveMessage(null);
      } else {
        setSaveState("editing");
      }
      const completedAt = Date.now();
      if (process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") console.info("[WAFL_OVERVIEW_SAVE_METRIC]", {
        payloadFields: Object.keys(patch).sort(),
        patchMs: patchCompletedAt - saveStartedAt,
        canonicalRevalidationMs: completedAt - patchCompletedAt,
        totalMs: completedAt - saveStartedAt,
        canonicalGetCount: 0,
        duplicateCanonicalGetCount: 0,
      });
      if (latestDetail.header.status !== "draft") await refreshConfirmedDocumentAfterMutableChange(refreshed);
      if (categoryResetIntentRef.current?.workOrderId === selected.workOrderId
        && categoryResetIntentRef.current.targetAudience === effectiveDraft.targetAudience
        && categoryResetIntentRef.current.categoryMajor === effectiveDraft.categoryMajor) {
        categoryResetIntentRef.current = null;
      }
      return true;
    } catch (error) {
      if (error instanceof MobileApiError && error.code === "VALIDATION_ERROR") {
        const mapped: BasicInfoFieldErrors = {};
        for (const fieldError of error.fieldErrors) {
          if (fieldError.field.endsWith("productName")) mapped.productName = fieldError.message;
          if (fieldError.field.endsWith("dueDate")) mapped.dueDate = fieldError.message;
          if (fieldError.field.endsWith("productTypeCode")) {
            mapped.targetAudience = fieldError.message;
            mapped.categoryMajor = fieldError.message;
          }
          if (fieldError.field.endsWith("itemCode")) mapped.categoryDetail = fieldError.message;
          if (fieldError.field.endsWith("seasonCode")) mapped.seasonCode = fieldError.message;
        }
        setSaveMessage("입력값을 확인해 주세요.");
        if (rollbackBasicInline()) return;
        setBasicInfoErrors(mapped);
        setSaveState("validation-error");
      } else if (error instanceof MobileApiError && error.code === "CONFLICT") {
        setSaveMessage("다른 변경이 먼저 저장되었습니다.");
        reconcileKnownEntityVersion(selected.workOrderId, error.entityVersion);
        if (rollbackBasicInline(true)) return;
        setConflictVersion(error.entityVersion);
        setSaveState("conflict");
      } else if (error instanceof MobileApiError && (error.code === "LOCKED" || error.code === "REVISION_MISMATCH")) {
        setSaveMessage("현재 상태에서는 수정할 수 없습니다.");
        if (rollbackBasicInline()) return;
        setEditing(false);
        setActiveBasicField(null);
        setSaveState("locked");
      } else if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        rollbackBasicInline();
        setRequestError(error, "boot");
      } else {
        setSaveState("save-error");
        setSaveMessage(`${error instanceof MobileApiError ? error.message : "저장하지 못했습니다."}${error instanceof MobileApiError && error.correlationId ? ` · 오류 참조 ${error.correlationId}` : ""}`);
        rollbackBasicInline();
      }
      return false;
    } finally {
      overviewMutation.complete();
    }
    });
    } finally {
      if (ownerToken !== null) queuedBasicInfoSessions.current.delete(ownerToken);
    }
  }

  async function applyBasicInfoPicker(override: Partial<BasicInfoDraft>, dependentResetConfirmed = false) {
    await saveBasicInfo(override, null, null, false, dependentResetConfirmed);
  }

  useEffect(() => draftBatch.register("overview", async () => {
    const candidate = basicInfoDraftRef.current;
    const errors = validateBasicInfoDraft(candidate);
    if (Object.keys(errors).length > 0) {
      setBasicInfoErrors(errors);
      setSaveMessage("입력값을 확인해 주세요.");
      return false;
    }
    const result = await saveBasicInfo(candidate, null, null, true);
    return result !== false;
  }), [detail?.header.id, draftBatch, selected?.workOrderId]);

  useEffect(() => {
    if (appLifecycle === "background") {
      void flushPendingProductName().then((nameCommitted) => nameCommitted ? draftBatch.flushAll("app-background") : false);
    }
  }, [appLifecycle, draftBatch]);

  async function reloadLatestBasicInfo() {
    if (!selected || detailRequestInFlight.current) return;
    detailRequestInFlight.current = true;
    try {
      const refreshed = await workOrderQueryController.detail(selected.workOrderId);
      activeBasicFieldRef.current = null;
      activeBasicSessionRef.current = null;
      setActiveBasicField(null);
      setEditing(false);
      if (!draftBatch.discardSection("overview")) throw new Error("OVERVIEW_RELOAD_IN_FLIGHT");
      categoryResetIntentRef.current = null;
      reconcileCanonicalDetail(refreshed);
      setBasicInfoErrors({});
      setConflictVersion(null);
      setEditing(false);
      setSaveState("read-only");
      setSaveMessage(null);
    } catch (error) {
      setSaveState("save-error");
      setSaveMessage(error instanceof MobileApiError ? error.message : "최신 내용을 불러오지 못했습니다.");
    } finally {
      detailRequestInFlight.current = false;
    }
  }

  async function refreshConfirmedDocumentAfterMutableChange(candidate?: WorkOrderDetailCore) {
    const target = candidate ?? detailRef.current;
    if (!target || !["issued", "revised", "completed"].includes(target.header.status)) return;
    try {
      const refreshed = await workOrderQueryController.detail(target.header.id);
      reconcileCanonicalDetail(refreshed);
      const clientRequestId = `alpha68-confirmed-pdf-refresh-${Date.now()}-${++clientRequestCounter.current}`;
      await generateWorkOrderR0(refreshed.header.id, refreshed.header.currentRevisionId, clientRequestId, true);
      showToast("최신 내용으로 PDF와 공유 문서를 갱신했습니다.", "success");
    } catch (error) {
      showToast(error instanceof MobileApiError ? error.message : "변경은 저장됐지만 PDF를 갱신하지 못했습니다. 문서 탭에서 다시 시도해 주세요.", "warning");
    }
  }

  async function setSelectedWorkOrderSample(isSample: boolean) {
    if (!detail || samplePending || detail.header.identity.isSample === isSample) return;
    setSamplePending(true);
    clientRequestCounter.current += 1;
    const requestId = `alpha66-sample-${Date.now()}-${clientRequestCounter.current}`;
    try {
      await workOrderMutationController.setSample(detail.header.id, {
        clientRequestId: requestId,
        expectedVersion: detail.header.entityVersion,
        isSample,
      }, requestId);
      const refreshed = await workOrderQueryController.detail(detail.header.id);
      setDetail(refreshed);
      setItems((current) => current.map((item) => item.workOrderId === refreshed.header.id ? { ...item, identity: refreshed.header.identity, updatedAt: refreshed.header.updatedAt } : item));
      setSelected((current) => current?.workOrderId === refreshed.header.id ? { ...current, identity: refreshed.header.identity, updatedAt: refreshed.header.updatedAt } : current);
      showToast(isSample ? "샘플로 변경했습니다." : "본생산으로 변경했습니다.", "success");
    } catch (error) {
      showToast(customerMessage(error), "error");
    } finally {
      setSamplePending(false);
    }
  }

  function retry() {
    if (!errorState) return;
    if (errorState.retryTarget === "detail" && selected) void selectItem(selected);
    else if (errorState.retryTarget === "post-create-detail") void hydrateCommittedReorder();
    else if (errorState.retryTarget === "disconnect") void disconnect();
    else if (errorState.retryTarget === "list" && user) void loadList();
    else {
      setErrorState(null);
      setPhase("booting");
      void boot();
    }
  }

  if (phase === "booting" || phase === "session-checking") {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={WAFL_THEME.color.brickOrange} size="large" /><Text style={styles.loadingText}>연결 상태를 확인하고 있습니다.</Text></View></SafeAreaView>;
  }

  if (phase === "developer-auto-connecting" || phase === "disconnected-auto-failed" || phase === "manual-code-entry" || phase === "connecting-manual" || phase === "session-expired") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.connectPage}>
          <MobileConnectScreen
            autoConnecting={phase === "developer-auto-connecting"}
            manualConnecting={phase === "connecting-manual"}
            manualEntry={phase === "manual-code-entry" || phase === "connecting-manual"}
            message={errorState?.message ?? null}
            onAutoConnect={() => {
              manualDisconnectSuppressed.current = false;
              void autoConnect();
            }}
            onConnect={(code) => void connect(code)}
            onUseCode={() => setPhase("manual-code-entry")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const detailPane = phase === "detail-loading" ? (
    <DelayedLoadingMessage
      identity={`detail:${selected?.workOrderId ?? "none"}`}
      loading
      scope="detail"
    />
  ) : phase === "recoverable-error" && (errorState?.retryTarget === "detail" || errorState?.retryTarget === "post-create-detail") ? (
    <ErrorPanel error={errorState} onRetry={retry} onReturnToList={returnToList} />
  ) : detail ? (
    <WorkOrderDetailOverview
      canEdit={canEditWorkOrder(detail, user)}
      canEditConfirmedMutable={canEditConfirmedWorkOrderMutableFields(detail, user)}
      canEditMaterials={canEditWorkOrder(detail, user)}
      detail={detail}
      draftBatch={draftBatch}
      media={{
        projection: {
          images: assetAuthoring.images,
          attachments: assetAuthoring.attachments,
        },
        mutation: {
          busy: assetAuthoring.busy,
          busyAssetId: assetAuthoring.busyId,
          message: imageMessage,
        },
        imageActions: {
          acquire: (source) => { void assetAuthoring.acquireImage(source); },
          delete: assetAuthoring.requestDeleteImage,
          setRepresentative: (image) => { void assetAuthoring.setRepresentativeImage(image); },
          setOutputInclude: (image, includeInDocument) => { void assetAuthoring.setImageOutputInclude(image, includeInDocument); },
        },
        attachmentActions: {
          acquire: () => { void assetAuthoring.acquireAttachment(); },
          applyOutputSelection: assetAuthoring.setAttachmentOutputIncludes,
          delete: assetAuthoring.requestDeleteAttachment,
          open: (attachment) => { void assetAuthoring.openAttachment(attachment); },
        },
      }}
      dirty={basicInfoDirty}
      draft={basicInfoDraft}
      activeBasicField={activeBasicField}
      fieldErrors={basicInfoErrors}
      materialEditor={materialEditor}
      activeMaterialField={activeMaterialField}
      activeMaterialInlineSession={activeMaterialInlineSession}
      materialEditorDirty={materialEditorDirty}
      materialLifecycleBusyId={materialLifecycleBusyId}
      materialOrderBusyId={materialOrderBusyId}
      materialOrderBusyAction={materialOrderBusyAction}
      materialOrderPolicy={(line) => materialOrderPolicyFor(detail, user, line)}
      onBack={returnToList}
      onBeginEdit={beginBasicInfoEdit}
      onBeginMaterialCreate={materialAuthoring.beginCreate}
      onBeginMaterialEdit={materialAuthoring.beginEdit}
      onDeleteMaterial={materialAuthoring.requestDelete}
      onMaterialOrderAction={materialAuthoring.requestOrderAction}
      onActionProcessing={setActionProcessing}
      onRequestActionConfirmation={setActionConfirmation}
      onActionSuccess={(message) => showToast(message, "success")}
      onCancelEdit={cancelBasicInfoEdit}
      onCancelMaterialEditor={materialAuthoring.cancelEditor}
      onCancelMaterialInlineEditor={materialAuthoring.cancelOwnedEditor}
      onChangeDraft={changeBasicInfoDraft}
      onChangeMaterialDraft={materialAuthoring.changeDraft}
      onChangeMaterialInlineDraft={(field, value, owner) => materialAuthoring.changeDraft(field, value, owner)}
      onReloadLatest={reloadLatestBasicInfo}
      onSetSample={(isSample) => void setSelectedWorkOrderSample(isSample)}
      samplePending={samplePending}
      onRefreshDocuments={reloadLatestBasicInfo}
      onRefreshConfirmedDocument={refreshConfirmedDocumentAfterMutableChange}
      onReloadLatestMaterial={materialAuthoring.reloadLatest}
      materials={{
        fabric: materialCache[materialCacheKey(detail.header.id, "fabric")] ?? EMPTY_MATERIAL_STATE,
        accessory: materialCache[materialCacheKey(detail.header.id, "accessory")] ?? EMPTY_MATERIAL_STATE,
      }}
      materialIdentityKeys={{
        fabric: materialCacheKey(detail.header.id, "fabric"),
        accessory: materialCacheKey(detail.header.id, "accessory"),
      }}
      materialSaveNotice={materialSaveNotice}
      materialPartnerOptions={materialPartnerOptions}
      onLoadMoreMaterials={(materialType) => void materialAuthoring.loadMaterials(detail.header.id, materialType, "more")}
      onOpenMaterials={(materialFocus) => {
        const materialType = materialFocus ?? activeMaterialType;
        if (materialEditor?.materialType !== materialType) materialAuthoring.closeEditorSession();
        materialAuthoring.setActiveType(materialType);
        setMaterialSaveNotice(null);
        void materialAuthoring.loadMaterials(detail.header.id, "fabric", "initial");
        void materialAuthoring.loadMaterials(detail.header.id, "accessory", "initial");
      }}
      sizeColor={sizeColor}
      sizeColorEdit={sizeColorEdit}
      onRequestSectionChange={(onProceed) => leaveWithDraftPolicy("feature", onProceed)}
      onRetryMaterials={(materialType) => void materialAuthoring.loadMaterials(detail.header.id, materialType, "retry")}
      onRefreshReadinessAfterMutation={() => {
        if (!detail) return;
        void refreshCanonicalDetailAfterMutation(detail.header.id).catch(() => {
          showToast("저장됐지만 발행 전 확인을 새로고침하지 못했습니다. 최신 내용을 다시 불러와 주세요.", "warning");
        });
      }}
      canCreateReorder={canCreateMobileWorkOrderReorder(detail)}
      seriesHistoryCount={seriesHistory?.items.length ?? 0}
      onOpenReorder={() => { void createReorderFromMobile(detail); }}
      onOpenSeriesHistory={() => setSeriesHistoryVisible(true)}
      onSave={(override) => {
        if (override && Object.keys(override).length === 1 && override.productName !== undefined) {
          void finalizeProductNameOnBlur(override.productName);
          return;
        }
        void saveBasicInfo(override);
      }}
      onApplyPicker={(override, dependentResetConfirmed) => void applyBasicInfoPicker(override, dependentResetConfirmed)}
      onSaveDate={(value) => {
        changeBasicInfoDraft("dueDate", value);
        void saveBasicInfo(
          { dueDate: value },
          activeBasicSessionRef.current?.field ?? null,
          activeBasicSessionRef.current?.token ?? null,
          canEditConfirmedWorkOrderMutableFields(detail, user),
        );
      }}
      onSaveMaterial={(draftOverride) => void materialAuthoring.save(draftOverride)}
      onSaveMaterialInline={(draftOverride, owner) => void materialAuthoring.save(draftOverride, owner)}
      phone={!tablet}
      saveMessage={saveMessage}
      saveState={saveState}
    />
  ) : (
    <View style={styles.placeholder}><Text style={styles.placeholderTitle}>레시피를 선택하세요.</Text><Text style={styles.placeholderBody}>왼쪽 목록에서 레시피를 선택하면 실제 상세 개요가 표시됩니다.</Text></View>
  );

  const globalError = phase === "recoverable-error" && errorState?.retryTarget !== "detail" && errorState?.retryTarget !== "post-create-detail";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.app, tablet && styles.appTablet]}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.brand}>WAFL</Text>
            <Text numberOfLines={1} style={styles.context}>{user?.companyName} · {user?.name}</Text>
            <Text style={styles.readOnly}>dev/test 제한 연결</Text>
          </View>
          <Pressable accessibilityLabel="개발용 연결 해제" accessibilityRole="button" onPress={disconnectSafely} style={({ pressed }) => [styles.disconnect, pressed && styles.pressed]}>
            <LogOut color="#67584c" size={19} /><Text style={styles.disconnectText}>연결 해제</Text>
          </Pressable>
        </View>
        <WaflFeedbackHost />
        <WaflNativeAttachmentViewer onClose={assetAuthoring.closeAttachmentPreview} preview={assetAuthoring.attachmentPreview} />

        {globalError && errorState ? <ErrorPanel error={errorState} onRetry={retry} /> : tablet ? (
          <View style={styles.split}>
            <View style={styles.listPane}>
              <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={selected?.workOrderId ?? null} loading={phase === "authenticated-loading-list"} loadingMore={listLoadingMore} searching={listSearching} query={listQuery} statusFilter={listStatusFilter} characterFilter={listCharacterFilter} lineageFilters={listLineageFilters} onCreate={openCreateSheet} onCopy={(item)=>void createCopyFromList(item)} onDelete={requestDeleteWorkOrder} onReorder={createReorderFromList} onIdentityFilters={applyListIdentityFilters} onLoadMore={() => void loadMoreList()} onRefresh={loadListSafely} onSearch={applyListSearch} onStatusFilter={applyListStatusFilter} onSelect={selectItemSafely} />
            </View>
            <View style={styles.detailPane}>{detailPane}</View>
          </View>
        ) : selected ? (
          <View style={styles.phoneBody}>{detailPane}</View>
        ) : (
          <View style={styles.phoneBody}>
            <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={null} loading={phase === "authenticated-loading-list"} loadingMore={listLoadingMore} searching={listSearching} query={listQuery} statusFilter={listStatusFilter} characterFilter={listCharacterFilter} lineageFilters={listLineageFilters} onCreate={openCreateSheet} onCopy={(item)=>void createCopyFromList(item)} onDelete={requestDeleteWorkOrder} onReorder={createReorderFromList} onIdentityFilters={applyListIdentityFilters} onLoadMore={() => void loadMoreList()} onRefresh={loadListSafely} onSearch={applyListSearch} onStatusFilter={applyListStatusFilter} onSelect={selectItemSafely} />
          </View>
        )}
      </View>
      <WaflActionProcessingBlocker
        helper={pendingIntentSaving ? "잠시만 기다려 주세요." : actionProcessingHelper}
        message={pendingIntentSaving ? "변경사항을 저장 중입니다." : actionProcessingMessage ?? (copyPending || reorderPending ? "레시피를 생성 중입니다." : null)}
        testID={copyPending || reorderPending ? "work-order-creation-blocker" : "work-order-action-processing-blocker"}
      />
      <WaflDecisionSheet decision={actionConfirmation} testID="work-order-action-confirmation" />
      <WorkOrderCreateSheet error={createError} isSample={createIsSample} onCancel={cancelCreateSheet} onChangeProductName={changeCreateProductName} onChangeSample={(value) => { createAttemptIdentity.current = null; setCreateIsSample(value); }} onConfirm={createWorkOrderDraftFromMobile} pending={createPending} productName={createProductName} visible={createSheetVisible} />
      <WorkOrderSeriesHistorySheet history={seriesHistory} onClose={() => setSeriesHistoryVisible(false)} onSelect={(workOrderId) => void openSeriesWorkOrder(workOrderId)} visible={seriesHistoryVisible} />
      <WaflInputSheet cancelAccessibilityLabel="저장 실패 변경 취소 후 나가기" cancelActionLabel="변경 취소 후 나가기" confirmAccessibilityLabel="변경 다시 저장" confirmActionLabel="다시 저장" onCancel={discardFailedDraftExit} onConfirm={retryFailedDraftExit} sizing="contentFit" title="저장하지 못한 변경" visible={failedDraftExitVisible}>
        <View style={styles.failedExitBody}><Text style={styles.failedExitText}>입력한 값은 화면에 유지되어 있습니다. 다시 저장하거나, 변경을 취소하고 이동할 수 있습니다.</Text></View>
      </WaflInputSheet>
    </SafeAreaView>
  );
}

function ErrorPanel({ error, onRetry, onReturnToList }: { readonly error: MobileErrorState; readonly onRetry: () => void; readonly onReturnToList?: () => void }) {
  return (
    <View style={styles.errorPanel}>
      {onReturnToList ? (
        <Pressable accessibilityLabel="레시피 목록으로 돌아가기" accessibilityRole="button" onPress={onReturnToList} style={({ pressed }) => [styles.errorBack, pressed && styles.pressed]}>
          <ChevronLeft color="#3f352d" size={22} /><Text style={styles.errorBackText}>뒤로가기</Text>
        </Pressable>
      ) : null}
      <Text accessibilityRole="alert" style={styles.errorTitle}>{error.message}</Text>
      <Text style={styles.errorBody}>{error.guidance}</Text>
      <Text style={styles.errorPolicy}>자동으로 다시 요청하지 않습니다.</Text>
      {error.correlationId ? <Text selectable style={styles.correlation}>오류 참조 {error.correlationId}</Text> : null}
      <View style={styles.errorActions}>
        {onReturnToList ? (
          <Pressable accessibilityLabel="레시피 목록으로" accessibilityRole="button" onPress={onReturnToList} style={({ pressed }) => [styles.returnToList, pressed && styles.pressed]}><Text style={styles.returnToListText}>목록으로</Text></Pressable>
        ) : null}
        <Pressable accessibilityLabel="레시피 상세 다시 시도" accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>다시 시도</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1 },
  failedExitBody: { paddingVertical: WAFL_THEME.spacing.md },
  failedExitText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 13, lineHeight: 20 },
  app: { alignSelf: "center", flex: 1, maxWidth: 1180, paddingHorizontal: WAFL_THEME.layout.screenGutterPhone, width: "100%" },
  appTablet: { paddingHorizontal: WAFL_THEME.layout.screenGutterTablet },
  connectPage: { flex: 1, justifyContent: "center", padding: 18 },
  header: { alignItems: "center", borderBottomColor: "#d9cfc2", borderBottomWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingVertical: 12 },
  headerMain: { flex: 1, minWidth: 0 },
  brand: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.black, fontSize: 18, letterSpacing: 1.5 },
  context: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 14, marginTop: 1 },
  readOnly: { color: "#7a6d61", fontFamily: WAFL_FONTS.regular, fontSize: 10, marginTop: 1 },
  disconnect: { alignItems: "center", borderColor: "#d8cabc", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 44, paddingHorizontal: 11 },
  disconnectText: { color: "#67584c", fontFamily: WAFL_FONTS.semibold, fontSize: 12 },
  pressed: { opacity: 0.68 },
  phoneBody: { flex: 1, minHeight: 0, paddingTop: 14 },
  split: { flex: 1, flexDirection: "row", gap: 18, minHeight: 0, paddingTop: 16 },
  listPane: { flexBasis: 360, flexGrow: 0, flexShrink: 0, minHeight: 0 },
  detailPane: { flex: 1, minHeight: 0, minWidth: 0 },
  center: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  loadingText: { color: "#665a50", fontFamily: WAFL_FONTS.medium, fontSize: 13 },
  placeholder: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 16, borderStyle: "dashed", borderWidth: 1, gap: 6, justifyContent: "center", minHeight: 220, padding: 30 },
  placeholderTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 17 },
  placeholderBody: { color: "#786c61", fontFamily: WAFL_FONTS.regular, fontSize: 13, lineHeight: 20, textAlign: "center" },
  errorPanel: { alignItems: "center", alignSelf: "center", backgroundColor: "#fffdf8", borderColor: "#e1c3bb", borderRadius: 16, borderWidth: 1, gap: 8, justifyContent: "center", marginTop: 20, maxWidth: 520, padding: 24, width: "100%" },
  errorBack: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", minHeight: 44, paddingRight: 8 },
  errorBackText: { color: "#3f352d", fontFamily: WAFL_FONTS.semibold, fontSize: 14 },
  errorTitle: { color: "#992f2b", fontFamily: WAFL_FONTS.bold, fontSize: 16, textAlign: "center" },
  errorBody: { color: "#75695e", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 18, textAlign: "center" },
  errorPolicy: { color: "#8a7d71", fontFamily: WAFL_FONTS.regular, fontSize: 11, textAlign: "center" },
  correlation: { color: "#8a7d71", fontFamily: WAFL_FONTS.regular, fontSize: 10 },
  errorActions: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 5 },
  returnToList: { alignItems: "center", backgroundColor: "#17263d", borderRadius: 11, justifyContent: "center", minHeight: 44, minWidth: 120, paddingHorizontal: 18 },
  returnToListText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  retry: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#b9aa9a", borderRadius: 11, borderWidth: 1, justifyContent: "center", minHeight: 44, minWidth: 120, paddingHorizontal: 18 },
  retryText: { color: "#3f352d", fontFamily: WAFL_FONTS.bold, fontSize: 13 },
});
