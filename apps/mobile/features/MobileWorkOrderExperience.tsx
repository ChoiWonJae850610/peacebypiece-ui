import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ChevronLeft, LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MobileConnectScreen from "@/components/MobileConnectScreen";
import WaflToastHost, { type WaflToastMessage } from "@/components/WaflToastHost";
import WorkOrderDetailOverview, {
  type BasicInfoInlineField,
  type BasicInfoSaveState,
} from "@/features/work-orders/overview/WorkOrderDetailOverview";
import { useWorkOrderMaterialAuthoringController } from "@/features/materials/useWorkOrderMaterialAuthoringController";
import WorkOrderListScreen from "@/features/work-orders/list/WorkOrderListScreen";
import WorkOrderCreateSheet from "@/features/work-orders/create/WorkOrderCreateSheet";
import { WorkOrderReorderCreateSheet, WorkOrderSeriesHistorySheet } from "@/features/work-orders/reorder/WorkOrderReorderSheets";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import {
  customerGuidance,
  customerMessage,
  type MobileErrorState,
} from "@/application/errorPresentation";
import { createExplicitMutationController, createSerializedMutationQueue } from "@/application/mutationController";
import { decideDraftExit, type DraftExitIntent } from "@/application/draftExitPolicy";
import { planInlineEditTransition } from "@/application/inlineEditTransition";
import { mobileSessionController } from "@/application/sessionController";
import { useWorkOrderNavigation } from "@/application/useWorkOrderNavigation";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { canEditWorkOrder, materialOrderPolicyFor } from "@/domain/workOrderPolicy";
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
import { encodeWorkOrderProductType } from "@/domain/workOrderCategoryPolicy";
import { materialNoun } from "@/domain/materialSemanticCopy";
import { reconcileCreatedWorkOrderListItem, resolveWorkOrderCreateAttempt, type WorkOrderCreateAttemptIdentity } from "@/domain/workOrderCreatePolicy";
import { canCreateMobileWorkOrderReorder } from "@/domain/workOrderReorderPolicy";
import { resolveExpectedNextReorderRound } from "@/domain/workOrderReorderConfirmationPolicy";
import { reconcileWorkOrderListItemFromDetail, workOrderListWorkflowChanged } from "@/domain/workOrderListReconciliation";
import { MobileApiError, type MaterialPartnerOption, type MaterialType, type MobileCurrentUser, type WorkOrderCharacterFilter, type WorkOrderDetailCore, type WorkOrderLineageFilter, type WorkOrderListItem, type WorkOrderListStatusFilter, type WorkOrderSeriesHistory } from "@/domain/mobileContract";

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
  readonly images: Awaited<ReturnType<typeof workOrderQueryController.images>>;
  readonly partners: Awaited<ReturnType<typeof workOrderQueryController.materialPartners>>;
  readonly history: WorkOrderSeriesHistory | null;
  readonly historyUnavailable: boolean;
};

async function loadWorkOrderDetailHydration(workOrderId: string): Promise<WorkOrderDetailHydration> {
  const [detail, images, partners] = await Promise.all([
    workOrderQueryController.detail(workOrderId),
    workOrderQueryController.images(workOrderId),
    workOrderQueryController.materialPartners(workOrderId),
  ]);
  if (detail.header.entityVersion !== images.entityVersion || detail.header.entityVersion !== partners.entityVersion) {
    throw new MobileApiError({ code: "CONFLICT", message: "이미지와 작업지시서 버전이 달라 최신 내용을 다시 불러와야 합니다." });
  }
  if (detail.header.identity.isSample) {
    return { detail, images, partners, history: null, historyUnavailable: false };
  }
  try {
    const history = await workOrderQueryController.seriesHistory(workOrderId);
    return { detail, images, partners, history, historyUnavailable: false };
  } catch {
    return { detail, images, partners, history: null, historyUnavailable: true };
  }
}

function materialLabel(materialType: MaterialType) {
  return materialNoun(materialType);
}

function transientToneFor(message: string): WaflToastMessage["tone"] {
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
  const [reorderSheetVisible, setReorderSheetVisible] = useState(false);
  const [reorderRequestError, setReorderRequestError] = useState<string | null>(null);
  const [reorderPending, setReorderPending] = useState(false);
  const [seriesHistory, setSeriesHistory] = useState<WorkOrderSeriesHistory | null>(null);
  const [seriesHistoryVisible, setSeriesHistoryVisible] = useState(false);
  const [samplePending, setSamplePending] = useState(false);
  const { selected, setSelected, selectedWorkOrderId: selectedWorkOrderIdRef } = useWorkOrderNavigation();
  const [detail, setDetail] = useState<WorkOrderDetailCore | null>(null);
  const detailRef = useRef<WorkOrderDetailCore | null>(null);
  const [materialPartnerOptions, setMaterialPartnerOptions] = useState<readonly MaterialPartnerOption[]>([]);
  const [toast, setToast] = useState<WaflToastMessage | null>(null);
  const imageMessage = null;
  const [errorState, setErrorState] = useState<MobileErrorState | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeBasicField, setActiveBasicField] = useState<BasicInfoInlineField | null>(null);
  const activeBasicFieldRef = useRef<BasicInfoInlineField | null>(null);
  const activeBasicSessionRef = useRef<{ readonly field: BasicInfoInlineField; readonly token: number } | null>(null);
  const basicInfoSessionSequence = useRef(0);
  const queuedBasicInfoSessions = useRef(new Set<number>());
  const [basicInfoDraft, setBasicInfoDraft] = useState<BasicInfoDraft>({
    productName: "",
    dueDate: "",
    totalQuantity: "0",
    targetAudience: "",
    categoryMajor: "",
    categoryDetail: "",
    seasonCode: "",
  });
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
  const reorderAttemptIdentity = useRef<{ readonly sourceWorkOrderId: string; readonly clientRequestId: string; readonly idempotencyKey: string } | null>(null);
  const committedReorderRead = useRef<{ readonly workOrderId: string; readonly reorderRound: number } | null>(null);
  const [inlineMutationQueue] = useState(createSerializedMutationQueue);
  const [canonicalDetailRefreshQueue] = useState(createSerializedMutationQueue);
  const clientRequestCounter = useRef(0);
  const createAttemptIdentity = useRef<WorkOrderCreateAttemptIdentity | null>(null);
  const autoConnectInFlight = useRef(false);
  const manualDisconnectSuppressed = useRef(false);
  const bootStarted = useRef(false);
  const materialAuthenticationErrorRef = useRef<(error: unknown, retryTarget: MobileErrorState["retryTarget"]) => void>(() => undefined);
  const sizeColorAuthenticationErrorRef = useRef<(error: MobileApiError) => void>(() => undefined);
  const toastSequence = useRef(0);
  const forwardSizeColorAuthenticationError = useCallback((error: MobileApiError) => {
    sizeColorAuthenticationErrorRef.current(error);
  }, []);
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

  const showToast = useCallback((message: string, tone: WaflToastMessage["tone"] = transientToneFor(message)) => {
    toastSequence.current += 1;
    setToast({ id: toastSequence.current, message, tone });
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToast((current) => current?.id === id ? null : current);
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
  const nextAssetRequestIdentity = useCallback((kind: "upload" | "representative" | "delete" | "attachment-upload" | "attachment-delete" | "memo") => {
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
      setItems(page.items);
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
    setItems(page.items);
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
      setDetail(hydrated.detail);
      hydrateAssets(hydrated.images.items, hydrated.images.attachments);
      setMaterialPartnerOptions(hydrated.partners.items);
      setSeriesHistory(hydrated.history);
      setBasicInfoDraft(basicInfoDraftFromDetail(hydrated.detail));
      setBasicInfoErrors({});
      setEditing(false);
      setSaveState("read-only");
      setSaveMessage(null);
      setPhase("detail-ready");
      if (hydrated.historyUnavailable) showToast("작업지시서는 열렸지만 작업 이력을 불러오지 못했습니다.", "warning");
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
    setReorderSheetVisible(false);
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
    const decision = decideDraftExit({ intent, mutationInFlight: overviewMutation.inFlight || materialAuthoring.isMutationInFlight() || assetAuthoring.isMutationInFlight() });
    if (decision === "preserve") return;
    if (decision === "blocked-saving") {
      Alert.alert("저장 중입니다.", "저장이 끝난 뒤 이동해 주세요.");
      return;
    }
    if (editing || materialEditor || dirty) discardActiveEditors();
    onProceed();
  }

  function returnToList() {
    leaveWithDraftPolicy("list", clearDetailAndReturnToList);
  }

  function selectItemSafely(item: WorkOrderListItem) {
    if (selected?.workOrderId === item.workOrderId) return;
    leaveWithDraftPolicy("work-order", () => void selectItem(item));
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
      updatedAt: created.header.updatedAt,
      identity: created.header.identity,
    };
  }

  function listItemFromCommittedReorder(
    result: Awaited<ReturnType<typeof workOrderMutationController.createReorder>>["result"],
    source: WorkOrderListItem | null,
  ): WorkOrderListItem {
    return {
      workOrderId: result.workOrderId,
      displayDocumentNumber: null,
      productName: result.productName,
      status: "draft",
      dueDate: result.dueDate,
      totalQuantity: result.totalQuantity,
      estimatedAmountSummary: source?.estimatedAmountSummary ?? { currency: "KRW", estimatedTotal: "0" },
      representativeThumbnail: null,
      incompleteMaterialSummary: { incompleteFabricCount: 0, incompleteAccessoryCount: 0 },
      processCount: 0,
      latestDocumentStatus: null,
      updatedAt: source?.updatedAt ?? "1970-01-01T00:00:00.000Z",
      identity: {
        isSample: false,
        derivationKind: "reorder",
        reorderRound: result.reorderRound,
        sourceWorkOrderId: result.sourceWorkOrderId,
        sourceRevisionId: result.sourceRevisionId,
        seriesRootWorkOrderId: result.seriesRootWorkOrderId,
      },
    };
  }

  async function refreshCurrentFilteredListAfterCreate() {
    try {
      const page = await workOrderQueryController.list({ query: listQuery, status: listStatusFilter, character: listCharacterFilter, lineage: listLineageFilters });
      setItems(page.items);
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
      const hydrated = await loadWorkOrderDetailHydration(committed.workOrderId);
      if (hydrated.detail.header.id !== committed.workOrderId || hydrated.detail.header.identity.derivationKind !== "reorder" || hydrated.detail.header.identity.isSample) {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "생성된 리오더의 초기 상태를 확인하지 못했습니다." });
      }
      const item = listItemFromCreatedDraft(hydrated.detail);
      selectedWorkOrderIdRef.current = committed.workOrderId;
      setSelected(item);
      setDetail(hydrated.detail);
      hydrateAssets(hydrated.images.items, hydrated.images.attachments);
      setMaterialPartnerOptions(hydrated.partners.items);
      setSeriesHistory(hydrated.history);
      setBasicInfoDraft(basicInfoDraftFromDetail(hydrated.detail));
      setBasicInfoErrors({});
      setEditing(false);
      setSaveState("read-only");
      setSaveMessage(null);
      setPhase("detail-ready");
      setErrorState(null);
      committedReorderRead.current = null;
      reorderAttemptIdentity.current = null;
      if (hydrated.historyUnavailable) showToast("리오더는 열렸지만 작업 이력을 불러오지 못했습니다.", "warning");
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
    setCreatePending(true);
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
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "생성된 작업지시서의 초기 상태를 확인하지 못했습니다." });
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

  function openReorderSheet() {
    if (!detail || !canCreateMobileWorkOrderReorder(detail) || reorderMutation.inFlight) return;
    reorderAttemptIdentity.current = null;
    setReorderRequestError(null);
    setReorderSheetVisible(true);
  }

  function cancelReorderSheet() {
    if (reorderMutation.inFlight) return;
    reorderAttemptIdentity.current = null;
    setReorderSheetVisible(false);
    setReorderRequestError(null);
  }

  async function createReorderFromMobile() {
    const source = detail;
    if (!source || !canCreateMobileWorkOrderReorder(source)) return;
    if (reorderMutation.tryBegin() !== "started") return;
    setReorderPending(true);
    setReorderRequestError(null);
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
    try {
      const created = await workOrderMutationController.createReorder(source.header.id, {
        clientRequestId: identity.clientRequestId,
        totalQuantity: 0,
        dueDate: null,
      }, identity.idempotencyKey);
      committedReorderRead.current = { workOrderId: created.result.workOrderId, reorderRound: created.result.reorderRound };
      const committedItem = listItemFromCommittedReorder(created.result, selected);
      selectedWorkOrderIdRef.current = created.result.workOrderId;
      setSelected(committedItem);
      setDetail(null);
      setReorderSheetVisible(false);
      showToast(`${created.result.reorderRound}차 리오더를 만들었습니다.`, "success");
      await hydrateCommittedReorder();
    } catch (error) {
      if (committedReorderRead.current) {
        setReorderSheetVisible(false);
        setErrorState({
          message: "리오더는 생성되었습니다.",
          guidance: customerGuidance(error, "post-create-detail"),
          correlationId: error instanceof MobileApiError ? error.correlationId : null,
          retryTarget: "post-create-detail",
        });
        setPhase("recoverable-error");
      } else {
        setReorderRequestError(customerMessage(error));
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
    const hydrated = await loadWorkOrderDetailHydration(workOrderId);
    const item = listItemFromCreatedDraft(hydrated.detail);
    selectedWorkOrderIdRef.current = workOrderId;
    setSelected(item);
    setDetail(hydrated.detail);
    hydrateAssets(hydrated.images.items, hydrated.images.attachments);
    setMaterialPartnerOptions(hydrated.partners.items);
    setSeriesHistory(hydrated.history);
    setBasicInfoDraft(basicInfoDraftFromDetail(hydrated.detail));
    setPhase("detail-ready");
    if (hydrated.historyUnavailable) showToast("작업지시서는 열렸지만 작업 이력을 불러오지 못했습니다.", "warning");
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
    if (!canEditWorkOrder(detail, user)) return;
    if (materialEditor && materialEditorDirty) {
      const previousMaterial = activeMaterialInlineSession;
      if (!previousMaterial) {
        const label = materialLabel(materialEditor.materialType);
        Alert.alert(`${label} 편집을 완료해 주세요.`, "현재 값을 저장하거나 취소한 뒤 개요를 수정할 수 있습니다.");
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
    setBasicInfoDraft(basicInfoDraftFromDetail(detail));
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
    setBasicInfoDraft((current) => ({ ...current, [field]: value }));
    setBasicInfoErrors((current) => ({ ...current, [field]: undefined }));
    if (saveState !== "saving") setSaveState("editing");
    setSaveMessage(null);
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
  }

  function nextClientRequestId() {
    clientRequestCounter.current += 1;
    return `alpha46-mobile-basic-${Date.now()}-${clientRequestCounter.current}`;
  }

  async function saveBasicInfo(
    override?: Partial<BasicInfoDraft>,
    ownerField = activeBasicSessionRef.current?.field ?? null,
    ownerToken = activeBasicSessionRef.current?.token ?? null,
  ) {
    if (!detail || !selected || !editing) return;
    const effectiveDraft = override ? { ...basicInfoDraft, ...override } : basicInfoDraft;
    const inlineRollback = ownerField === "productName"
      || ownerField === "targetAudience"
      || ownerField === "categoryMajor"
      || ownerField === "categoryDetail"
      || ownerField === "seasonCode";
    const rollbackBasicInline = (refreshLatest = false) => {
      if (!inlineRollback) return false;
      if (activeBasicSessionRef.current?.token !== ownerToken) return true;
      if (refreshLatest) reloadLatestBasicInfo();
      else cancelBasicInfoEdit();
      return true;
    };
    const effectiveDirty = effectiveDraft.productName !== detail.header.productName
      || effectiveDraft.dueDate !== (detail.header.dueDate ?? "")
      || effectiveDraft.targetAudience !== basicInfoDraftFromDetail(detail).targetAudience
      || effectiveDraft.categoryMajor !== basicInfoDraftFromDetail(detail).categoryMajor
      || effectiveDraft.categoryDetail !== basicInfoDraftFromDetail(detail).categoryDetail
      || effectiveDraft.seasonCode !== basicInfoDraftFromDetail(detail).seasonCode;
    if (!effectiveDirty) {
      if (activeBasicSessionRef.current?.token === ownerToken) cancelBasicInfoEdit();
      return;
    }
    const fieldErrors = validateBasicInfoDraft(effectiveDraft);
    if (Object.keys(fieldErrors).length > 0) {
      setSaveMessage("입력값을 확인해 주세요.");
      if (rollbackBasicInline()) return;
      setBasicInfoErrors(fieldErrors);
      setSaveState("validation-error");
      return;
    }

    const patch: {
      productName?: string;
      productTypeCode?: string | null;
      seasonCode?: string | null;
      itemCode?: string | null;
      dueDate?: string | null;
    } = {};
    const productName = effectiveDraft.productName.trim();
    const ownsPatchField = (field: keyof BasicInfoDraft) => !override || Object.prototype.hasOwnProperty.call(override, field);
    if (ownsPatchField("productName") && productName !== detail.header.productName) patch.productName = productName;
    const dueDate = effectiveDraft.dueDate || null;
    if (ownsPatchField("dueDate") && dueDate !== detail.header.dueDate) patch.dueDate = dueDate;
    const productTypeCode = encodeWorkOrderProductType(effectiveDraft);
    if ((ownsPatchField("targetAudience") || ownsPatchField("categoryMajor")) && productTypeCode !== detail.header.productTypeCode) patch.productTypeCode = productTypeCode;
    const categoryDetail = effectiveDraft.categoryDetail.trim() || null;
    if (ownsPatchField("categoryDetail") && categoryDetail !== detail.header.itemCode) patch.itemCode = categoryDetail;
    const seasonCode = effectiveDraft.seasonCode.trim() || null;
    if (ownsPatchField("seasonCode") && seasonCode !== detail.header.seasonCode) patch.seasonCode = seasonCode;
    if (Object.keys(patch).length === 0) {
      if (activeBasicSessionRef.current?.token === ownerToken) cancelBasicInfoEdit();
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
      const saved = await workOrderMutationController.updateOverview(selected.workOrderId, {
        clientRequestId: nextClientRequestId(),
        expectedVersion: latestDetail.header.entityVersion,
        patch,
      });
      const patchCompletedAt = Date.now();
      const refreshed: WorkOrderDetailCore = {
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
      };
      detailRef.current = refreshed;
      setDetail(refreshed);
      setBasicInfoDraft((currentDraft) => {
        const next = basicInfoDraftFromDetail(refreshed);
        const currentOwner = activeBasicSessionRef.current;
        return currentOwner && currentOwner.token !== ownerToken ? { ...next, [currentOwner.field]: currentDraft[currentOwner.field] } : next;
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
      if (activeBasicSessionRef.current?.token === ownerToken) {
        activeBasicFieldRef.current = null;
        activeBasicSessionRef.current = null;
        setEditing(false);
        setActiveBasicField(null);
        setSaveState("saved");
        setSaveMessage("저장됨");
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
    } finally {
      overviewMutation.complete();
    }
    });
    } finally {
      if (ownerToken !== null) queuedBasicInfoSessions.current.delete(ownerToken);
    }
  }

  async function reloadLatestBasicInfo() {
    if (!selected || detailRequestInFlight.current) return;
    detailRequestInFlight.current = true;
    try {
      const refreshed = await workOrderQueryController.detail(selected.workOrderId);
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
      canEditMaterials={canEditWorkOrder(detail, user)}
      detail={detail}
      images={assetAuthoring.images}
      attachments={assetAuthoring.attachments}
      imageBusy={assetAuthoring.busy}
      imageBusyId={assetAuthoring.busyId}
      imageMessage={imageMessage}
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
      onAcquireImage={(source) => void assetAuthoring.acquireImage(source)}
      onAcquireAttachment={() => void assetAuthoring.acquireAttachment()}
      onBeginEdit={beginBasicInfoEdit}
      onBeginMaterialCreate={materialAuthoring.beginCreate}
      onBeginMaterialEdit={materialAuthoring.beginEdit}
      onDeleteMaterial={materialAuthoring.requestDelete}
      onMaterialOrderAction={materialAuthoring.requestOrderAction}
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
      onDeleteImage={assetAuthoring.requestDeleteImage}
      onDeleteAttachment={assetAuthoring.requestDeleteAttachment}
      onOpenAttachment={(attachment) => void assetAuthoring.openAttachment(attachment)}
      onSetRepresentativeImage={(image) => void assetAuthoring.setRepresentativeImage(image)}
      onRefreshReadinessAfterMutation={() => {
        if (!detail) return;
        void refreshCanonicalDetailAfterMutation(detail.header.id).catch(() => {
          showToast("저장됐지만 발행 전 확인을 새로고침하지 못했습니다. 최신 내용을 다시 불러와 주세요.", "warning");
        });
      }}
      canCreateReorder={canCreateMobileWorkOrderReorder(detail)}
      seriesHistoryCount={seriesHistory?.items.length ?? 0}
      onOpenReorder={openReorderSheet}
      onOpenSeriesHistory={() => setSeriesHistoryVisible(true)}
      onSave={(override) => void saveBasicInfo(override)}
      onSaveDate={(value) => {
        changeBasicInfoDraft("dueDate", value);
        void saveBasicInfo({ dueDate: value });
      }}
      onSaveMaterial={(draftOverride) => void materialAuthoring.save(draftOverride)}
      onSaveMaterialInline={(draftOverride, owner) => void materialAuthoring.save(draftOverride, owner)}
      phone={!tablet}
      saveMessage={saveMessage}
      saveState={saveState}
    />
  ) : (
    <View style={styles.placeholder}><Text style={styles.placeholderTitle}>작업지시서를 선택하세요.</Text><Text style={styles.placeholderBody}>왼쪽 목록에서 작업지시서를 선택하면 실제 상세 개요가 표시됩니다.</Text></View>
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
        <WaflToastHost onDismiss={dismissToast} toast={toast} />

        {globalError && errorState ? <ErrorPanel error={errorState} onRetry={retry} /> : tablet ? (
          <View style={styles.split}>
            <View style={styles.listPane}>
              <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={selected?.workOrderId ?? null} loading={phase === "authenticated-loading-list"} loadingMore={listLoadingMore} searching={listSearching} query={listQuery} statusFilter={listStatusFilter} characterFilter={listCharacterFilter} lineageFilters={listLineageFilters} onCreate={openCreateSheet} onIdentityFilters={applyListIdentityFilters} onLoadMore={() => void loadMoreList()} onRefresh={loadListSafely} onSearch={applyListSearch} onStatusFilter={applyListStatusFilter} onSelect={selectItemSafely} />
            </View>
            <View style={styles.detailPane}>{detailPane}</View>
          </View>
        ) : selected ? (
          <View style={styles.phoneBody}>{detailPane}</View>
        ) : (
          <View style={styles.phoneBody}>
            <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={null} loading={phase === "authenticated-loading-list"} loadingMore={listLoadingMore} searching={listSearching} query={listQuery} statusFilter={listStatusFilter} characterFilter={listCharacterFilter} lineageFilters={listLineageFilters} onCreate={openCreateSheet} onIdentityFilters={applyListIdentityFilters} onLoadMore={() => void loadMoreList()} onRefresh={loadListSafely} onSearch={applyListSearch} onStatusFilter={applyListStatusFilter} onSelect={selectItemSafely} />
          </View>
        )}
      </View>
      <WorkOrderCreateSheet error={createError} isSample={createIsSample} onCancel={cancelCreateSheet} onChangeProductName={changeCreateProductName} onChangeSample={(value) => { createAttemptIdentity.current = null; setCreateIsSample(value); }} onConfirm={createWorkOrderDraftFromMobile} pending={createPending} productName={createProductName} visible={createSheetVisible} />
      <WorkOrderReorderCreateSheet
        expectedRound={resolveExpectedNextReorderRound(seriesHistory?.items.map((item) => item.reorderRound) ?? [detail?.header.identity.reorderRound ?? 0])}
        onCancel={cancelReorderSheet}
        onConfirm={createReorderFromMobile}
        pending={reorderPending}
        requestError={reorderRequestError}
        sourceLabel={detail?.header.productName ?? ""}
        visible={reorderSheetVisible}
      />
      <WorkOrderSeriesHistorySheet history={seriesHistory} onClose={() => setSeriesHistoryVisible(false)} onSelect={(workOrderId) => void openSeriesWorkOrder(workOrderId)} visible={seriesHistoryVisible} />
    </SafeAreaView>
  );
}

function ErrorPanel({ error, onRetry, onReturnToList }: { readonly error: MobileErrorState; readonly onRetry: () => void; readonly onReturnToList?: () => void }) {
  return (
    <View style={styles.errorPanel}>
      {onReturnToList ? (
        <Pressable accessibilityLabel="작업지시서 목록으로 돌아가기" accessibilityRole="button" onPress={onReturnToList} style={({ pressed }) => [styles.errorBack, pressed && styles.pressed]}>
          <ChevronLeft color="#3f352d" size={22} /><Text style={styles.errorBackText}>뒤로가기</Text>
        </Pressable>
      ) : null}
      <Text accessibilityRole="alert" style={styles.errorTitle}>{error.message}</Text>
      <Text style={styles.errorBody}>{error.guidance}</Text>
      <Text style={styles.errorPolicy}>자동으로 다시 요청하지 않습니다.</Text>
      {error.correlationId ? <Text selectable style={styles.correlation}>오류 참조 {error.correlationId}</Text> : null}
      <View style={styles.errorActions}>
        {onReturnToList ? (
          <Pressable accessibilityLabel="작업지시서 목록으로" accessibilityRole="button" onPress={onReturnToList} style={({ pressed }) => [styles.returnToList, pressed && styles.pressed]}><Text style={styles.returnToListText}>목록으로</Text></Pressable>
        ) : null}
        <Pressable accessibilityLabel="작업지시서 상세 다시 시도" accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>다시 시도</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1 },
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
