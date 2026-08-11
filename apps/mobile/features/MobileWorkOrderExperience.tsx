import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ChevronLeft, LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MobileConnectScreen from "@/components/MobileConnectScreen";
import WaflToastHost, { type WaflToastMessage } from "@/components/WaflToastHost";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
import WorkOrderDetailOverview, {
  type BasicInfoInlineField,
  type BasicInfoSaveState,
} from "@/features/work-orders/overview/WorkOrderDetailOverview";
import type { MaterialReadStatus } from "@/features/materials/WorkOrderMaterialsReadOnly";
import type { MaterialEditorViewState } from "@/features/materials/WorkOrderMaterialEditor";
import {
  createMaterialInlineEditSession,
  ownsMaterialInlineEditSession,
  type MaterialInlineEditSession,
} from "@/features/materials/materialInlineEditSession";
import WorkOrderListScreen from "@/features/work-orders/list/WorkOrderListScreen";
import WorkOrderCreateSheet from "@/features/work-orders/create/WorkOrderCreateSheet";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import {
  customerGuidance,
  customerMessage,
  materialErrorMessage,
  type MobileErrorState,
} from "@/application/errorPresentation";
import { createExplicitMutationController } from "@/application/mutationController";
import { decideDraftExit, type DraftExitIntent } from "@/application/draftExitPolicy";
import { mobileSessionController } from "@/application/sessionController";
import { useWorkOrderNavigation } from "@/application/useWorkOrderNavigation";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import {
  FACTORY_DELIVERY_MEMO_MAX_LENGTH,
  factoryDeliveryMemoLength,
} from "@/domain/factoryDeliveryMemoPolicy";
import {
  canEditMaterial,
  canEditWorkOrder,
  canPerformMaterialOrderAction,
  materialOrderPolicyFor,
} from "@/domain/workOrderPolicy";
import type { MaterialOrderAction } from "@/domain/materialOrderPolicy";
import {
  type BasicInfoDraft,
  type BasicInfoFieldErrors,
  type MaterialEditorFieldErrors,
  basicInfoDraftFromDetail,
  createMaterialDraft,
  materialDraftFromLine,
  materialCreateDraft,
  materialPatch,
  normalizeMaterialDraft,
  sameMaterialDraft,
  validateBasicInfoDraft,
  validateWorkOrderProductName,
  validateMaterialDraft,
  validateMaterialOrderRequest,
} from "@/domain/workOrderValidation";
import {
  EMPTY_MATERIAL_STATE,
  materialCacheKey,
  putBoundedMaterialEntry,
  type MaterialCacheEntry,
} from "@/features/materials/materialCache";
import { useSizeColorReadController } from "@/features/work-orders/size-color/useSizeColorReadController";
import { readConsistentSizeColorBundle } from "@/features/work-orders/size-color/sizeColorQueryPolicy";
import { useSizeColorStructureEditController } from "@/features/work-orders/size-color/useSizeColorStructureEditController";
import { workOrderMutationController } from "@/features/work-orders/workOrderMutationController";
import { workOrderQueryController } from "@/features/work-orders/workOrderQueryController";
import {
  acquireWorkOrderImage,
  normalizeAcquiredImageFile,
  type WorkOrderImageAcquisitionSource,
} from "@/features/work-orders/images/workOrderImageAcquisition";
import { acquireWorkOrderAttachment } from "@/features/work-orders/images/workOrderAttachmentAcquisition";
import { resolveMobileApiUrl } from "@/lib/apiClient";
import { encodeWorkOrderProductType } from "@/domain/workOrderCategoryPolicy";
import { reconcileCreatedWorkOrderListItem, resolveWorkOrderCreateAttempt, type WorkOrderCreateAttemptIdentity } from "@/domain/workOrderCreatePolicy";
import { MobileApiError, type MaterialDraftFields, type MaterialDraftUpdate, type MaterialType, type MobileCurrentUser, type WorkOrderAttachmentAsset, type WorkOrderDetailCore, type WorkOrderImageAsset, type WorkOrderListItem, type WorkOrderListStatusFilter, type WorkOrderMaterialLine } from "@/domain/mobileContract";

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

function materialLabel(materialType: MaterialType) {
  return materialType === "accessory" ? "부자재" : "원단";
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
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const [listSearching, setListSearching] = useState(false);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [createProductName, setCreateProductName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const { selected, setSelected, selectedWorkOrderId } = useWorkOrderNavigation();
  const [detail, setDetail] = useState<WorkOrderDetailCore | null>(null);
  const [images, setImages] = useState<readonly WorkOrderImageAsset[]>([]);
  const [attachments, setAttachments] = useState<readonly WorkOrderAttachmentAsset[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageBusyId, setImageBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<WaflToastMessage | null>(null);
  const imageMessage = null;
  const [errorState, setErrorState] = useState<MobileErrorState | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeBasicField, setActiveBasicField] = useState<BasicInfoInlineField | null>(null);
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
  const [materialCache, setMaterialCache] = useState<Readonly<Record<string, MaterialCacheEntry>>>({});
  const [activeMaterialType, setActiveMaterialType] = useState<MaterialType>("fabric");
  const [materialEditor, setMaterialEditor] = useState<MaterialEditorViewState | null>(null);
  const [activeMaterialField, setActiveMaterialField] = useState<keyof MaterialDraftFields | null>(null);
  const [activeMaterialInlineSession, setActiveMaterialInlineSession] = useState<MaterialInlineEditSession | null>(null);
  const materialSaveNotice = null;
  const [materialLifecycleBusyId, setMaterialLifecycleBusyId] = useState<string | null>(null);
  const [materialOrderBusyId, setMaterialOrderBusyId] = useState<string | null>(null);
  const [materialOrderBusyAction, setMaterialOrderBusyAction] = useState<MaterialOrderAction | null>(null);
  const detailRequestInFlight = useRef(false);
  const listRequestInFlight = useRef(false);
  const pendingListSearch = useRef<{ readonly query: string; readonly status: WorkOrderListStatusFilter } | null>(null);
  const overviewMutation = useRef(createExplicitMutationController()).current;
  const createMutation = useRef(createExplicitMutationController()).current;
  const materialMutation = useRef(createExplicitMutationController()).current;
  const materialLifecycleMutation = useRef(createExplicitMutationController()).current;
  const materialOrderMutation = useRef(createExplicitMutationController()).current;
  const imageMutation = useRef(createExplicitMutationController()).current;
  const clientRequestCounter = useRef(0);
  const createAttemptIdentity = useRef<WorkOrderCreateAttemptIdentity | null>(null);
  const autoConnectInFlight = useRef(false);
  const manualDisconnectSuppressed = useRef(false);
  const bootStarted = useRef(false);
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
  const sizeColorAuthenticationError = useRef<(error: MobileApiError) => void>(() => undefined);
  const toastSequence = useRef(0);
  const forwardSizeColorAuthenticationError = useCallback((error: MobileApiError) => {
    sizeColorAuthenticationError.current(error);
  }, []);
  const {
    boundary: sizeColor,
    resetSession: resetSizeColorSession,
    reconcileMutation: reconcileSizeColorMutation,
  } = useSizeColorReadController({
    workOrderId: detail?.header.id ?? null,
    entityVersion: detail?.header.entityVersion ?? null,
    selectedWorkOrderId,
    onAuthenticationError: forwardSizeColorAuthenticationError,
  });
  const refreshSizeColorProjection = useCallback(async (expectedVersion?: number) => {
    const workOrderId = selectedWorkOrderId.current;
    if (!workOrderId) return;
    const refreshed = await workOrderQueryController.detail(workOrderId);
    if (expectedVersion !== undefined && refreshed.header.entityVersion !== expectedVersion) {
      throw new MobileApiError({ code: "CONFLICT", message: "저장된 사이즈·색상 버전을 확인하지 못했습니다." });
    }
    const bundle = await readConsistentSizeColorBundle({
      workOrderId,
      expectedEntityVersion: refreshed.header.entityVersion,
      readMatrix: () => workOrderQueryController.sizeColor(workOrderId),
      readSpecifications: () => workOrderQueryController.sizeSpec(workOrderId),
    });
    if (selectedWorkOrderId.current !== workOrderId) return;
    setDetail(refreshed);
    setBasicInfoDraft(basicInfoDraftFromDetail(refreshed));
    setItems((current) => current.map((item) => item.workOrderId === workOrderId ? {
      ...item,
      productName: refreshed.header.productName,
      dueDate: refreshed.header.dueDate,
      totalQuantity: refreshed.header.totalQuantity,
      updatedAt: refreshed.header.updatedAt,
    } : item));
    setSelected((current) => current?.workOrderId === workOrderId ? {
      ...current,
      productName: refreshed.header.productName,
      dueDate: refreshed.header.dueDate,
      totalQuantity: refreshed.header.totalQuantity,
      updatedAt: refreshed.header.updatedAt,
    } : current);
    reconcileSizeColorMutation(() => bundle, refreshed.header.entityVersion);
    return { bundle, entityVersion: refreshed.header.entityVersion };
  }, [reconcileSizeColorMutation, selectedWorkOrderId, setSelected]);
  const { boundary: sizeColorEdit } = useSizeColorStructureEditController({
    workOrderId: detail?.header.id ?? null,
    entityVersion: detail?.header.entityVersion ?? null,
    canEdit: canEditWorkOrder(detail, user),
    bundle: sizeColor.state.bundle,
    onReconcile: reconcileSizeColorMutation,
    onTotalQuantityReconcile: (totalQuantity, nextVersion) => {
      const workOrderId = selectedWorkOrderId.current;
      if (!workOrderId) return;
      setDetail((current) => current?.header.id === workOrderId ? {
        ...current,
        header: { ...current.header, totalQuantity, entityVersion: nextVersion },
      } : current);
      setBasicInfoDraft((current) => ({ ...current, totalQuantity: String(totalQuantity) }));
      setItems((current) => current.map((item) => item.workOrderId === workOrderId
        ? { ...item, totalQuantity }
        : item));
      setSelected((current) => current?.workOrderId === workOrderId
        ? { ...current, totalQuantity }
        : current);
    },
    onCommitted: async (nextVersion) => { await refreshSizeColorProjection(nextVersion); },
    onConflict: async () => { await refreshSizeColorProjection(); },
    onRefreshLatest: refreshSizeColorProjection,
    onAuthenticationError: forwardSizeColorAuthenticationError,
  });

  const showToast = useCallback((message: string, tone: WaflToastMessage["tone"] = transientToneFor(message)) => {
    toastSequence.current += 1;
    setToast({ id: toastSequence.current, message, tone });
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToast((current) => current?.id === id ? null : current);
  }, []);
  const setImageMessage = useCallback((message: string | null) => {
    if (message) showToast(message);
  }, [showToast]);
  const setMaterialSaveNotice = useCallback((message: string | null) => {
    if (message) showToast(message);
  }, [showToast]);
  const setSaveMessage = useCallback((message: string | null) => {
    setSaveMessageState(message);
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

  const resetMaterialSession = useCallback(() => {
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

  const basicInfoDirty = detail ? (
    basicInfoDraft.productName !== detail.header.productName
    || basicInfoDraft.dueDate !== (detail.header.dueDate ?? "")
    || basicInfoDraft.targetAudience !== basicInfoDraftFromDetail(detail).targetAudience
    || basicInfoDraft.categoryMajor !== basicInfoDraftFromDetail(detail).categoryMajor
    || basicInfoDraft.categoryDetail !== basicInfoDraftFromDetail(detail).categoryDetail
    || basicInfoDraft.seasonCode !== basicInfoDraftFromDetail(detail).seasonCode
  ) : false;
  const materialEditorDirty = materialEditor ? !sameMaterialDraft(materialEditor.base, materialEditor.draft) : false;
  const dirty = basicInfoDirty || materialEditorDirty;

  const setRequestError = useCallback((error: unknown, retryTarget: MobileErrorState["retryTarget"]) => {
    if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
      setUser(null);
      setItems([]);
      setSelected(null);
      selectedWorkOrderId.current = null;
      setDetail(null);
      setImages([]);
      setAttachments([]);
      setImageMessage(null);
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
  }, [resetMaterialSession, resetSizeColorSession, selectedWorkOrderId, setImageMessage, setSelected]);
  sizeColorAuthenticationError.current = (error) => setRequestError(error, "boot");

  const loadListFor = useCallback(async (query: string, status: WorkOrderListStatusFilter, mode: "blocking" | "search" = "blocking") => {
    if (listRequestInFlight.current) {
      if (mode === "search") pendingListSearch.current = { query, status };
      return;
    }
    listRequestInFlight.current = true;
    setErrorState(null);
    if (mode === "search") setListSearching(true);
    else setPhase("authenticated-loading-list");
    try {
      const page = await workOrderQueryController.list({ query, status });
      setItems(page.items);
      setHasMore(page.hasMore);
      setListNextCursor(page.nextCursor);
      setListQuery(query);
      setListStatusFilter(status);
      if (mode === "blocking") {
        setSelected(null);
        selectedWorkOrderId.current = null;
        setDetail(null);
        setImages([]);
        setAttachments([]);
        setImageMessage(null);
        setPhase("list-ready");
      }
    } catch (error) {
      setRequestError(error, "list");
    } finally {
      listRequestInFlight.current = false;
      if (mode === "search") setListSearching(false);
      const pending = pendingListSearch.current;
      pendingListSearch.current = null;
      if (pending && (pending.query !== query || pending.status !== status)) void loadListFor(pending.query, pending.status, "search");
    }
  }, [selectedWorkOrderId, setImageMessage, setRequestError, setSelected]);

  const loadList = useCallback(async () => loadListFor(listQuery, listStatusFilter), [listQuery, listStatusFilter, loadListFor]);

  const authenticateAndLoadList = useCallback(async (authenticatedUser?: MobileCurrentUser) => {
    const currentUser = authenticatedUser ?? await mobileSessionController.current();
    setUser(currentUser);
    const page = await workOrderQueryController.list();
    setItems(page.items);
    setHasMore(page.hasMore);
    setListNextCursor(page.nextCursor);
    setListQuery("");
    setListStatusFilter("all");
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
    selectedWorkOrderId.current = item.workOrderId;
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setActiveMaterialField(null);
    setMaterialSaveNotice(null);
    setSelected(item);
    setDetail(null);
    setImages([]);
    setAttachments([]);
    setImageMessage(null);
    setErrorState(null);
    setPhase("detail-loading");
    try {
      const [result, imagePage] = await Promise.all([
        workOrderQueryController.detail(item.workOrderId),
        workOrderQueryController.images(item.workOrderId),
      ]);
      if (result.header.entityVersion !== imagePage.entityVersion) {
        throw new MobileApiError({ code: "CONFLICT", message: "이미지와 작업지시서 버전이 달라 최신 내용을 다시 불러와야 합니다." });
      }
      setDetail(result);
      setImages(imagePage.items);
      setAttachments(imagePage.attachments);
      setBasicInfoDraft(basicInfoDraftFromDetail(result));
      setBasicInfoErrors({});
      setEditing(false);
      setSaveState("read-only");
      setSaveMessage(null);
      setPhase("detail-ready");
    } catch (error) {
      setRequestError(error, "detail");
    } finally {
      detailRequestInFlight.current = false;
    }
  }

  function clearDetailAndReturnToList() {
    selectedWorkOrderId.current = null;
    setSelected(null);
    setDetail(null);
    setImages([]);
    setAttachments([]);
    setImageMessage(null);
    setErrorState(null);
    setEditing(false);
    setActiveBasicField(null);
    setBasicInfoErrors({});
    setSaveState("read-only");
    setSaveMessage(null);
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setActiveMaterialField(null);
    setMaterialSaveNotice(null);
    setPhase("list-ready");
  }

  function discardActiveEditors() {
    if (detail) setBasicInfoDraft(basicInfoDraftFromDetail(detail));
    setBasicInfoErrors({});
    setConflictVersion(null);
    setEditing(false);
    setActiveBasicField(null);
    setSaveState("read-only");
    setSaveMessage(null);
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setActiveMaterialField(null);
    setMaterialSaveNotice(null);
  }

  function leaveWithDraftPolicy(intent: DraftExitIntent, onProceed: () => void) {
    const decision = decideDraftExit({ intent, mutationInFlight: overviewMutation.inFlight || materialMutation.inFlight || imageMutation.inFlight });
    if (decision === "preserve") return;
    if (decision === "blocked-saving") {
      Alert.alert("저장 중입니다.", "저장이 끝난 뒤 이동해 주세요.");
      return;
    }
    if (editing || materialEditorRef.current || dirty) discardActiveEditors();
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
    };
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
      `${Date.now()}-${clientRequestCounter.current}`,
    );
    createAttemptIdentity.current = identity;
    try {
      const created = await workOrderMutationController.createDraft({ clientRequestId: identity.clientRequestId, productName }, identity.idempotencyKey);
      const [createdDetail, createdImages] = await Promise.all([
        workOrderQueryController.detail(created.result.workOrderId),
        workOrderQueryController.images(created.result.workOrderId),
      ]);
      if (
        createdDetail.header.id !== created.result.workOrderId
        || createdDetail.header.status !== "draft"
        || createdDetail.revision.status !== "draft"
        || createdDetail.header.totalQuantity !== 0
        || createdImages.entityVersion !== createdDetail.header.entityVersion
      ) {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "생성된 작업지시서의 초기 상태를 확인하지 못했습니다." });
      }
      const item = listItemFromCreatedDraft(createdDetail);
      setItems((current) => reconcileCreatedWorkOrderListItem(current, item));
      selectedWorkOrderId.current = item.workOrderId;
      setSelected(item);
      setDetail(createdDetail);
      setImages(createdImages.items);
      setAttachments(createdImages.attachments);
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

  function loadListSafely() {
    leaveWithDraftPolicy("list", () => void loadList());
  }

  function applyListSearch(query: string) {
    const normalized = query.trim();
    if (normalized === listQuery) return;
    void loadListFor(normalized, listStatusFilter, "search");
  }

  function applyListStatusFilter(status: WorkOrderListStatusFilter) {
    if (status === listStatusFilter) return;
    void loadListFor(listQuery, status, "search");
  }

  async function loadMoreList() {
    if (!listNextCursor || !hasMore || listRequestInFlight.current) return;
    listRequestInFlight.current = true;
    setListLoadingMore(true);
    try {
      const page = await workOrderQueryController.list({ query: listQuery, status: listStatusFilter, cursor: listNextCursor });
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
      selectedWorkOrderId.current = null;
      setSelected(null);
      setDetail(null);
      setImages([]);
      setAttachments([]);
      setImageMessage(null);
      resetMaterialSession();
      resetSizeColorSession();
      setEditing(false);
      setSaveState("read-only");
      materialEditorRef.current = null;
      setMaterialEditor(null);
      setActiveMaterialField(null);
      setMaterialSaveNotice(null);
      setErrorState(null);
      setPhase("disconnected-auto-failed");
    } catch (error) {
      setRequestError(error, "disconnect");
    }
  }


  function disconnectSafely() {
    leaveWithDraftPolicy("session-loss", () => void disconnect());
  }

  function nextImageRequestIdentity(kind: "upload" | "representative" | "delete" | "attachment-upload" | "attachment-delete" | "memo") {
    clientRequestCounter.current += 1;
    const suffix = `${Date.now()}-${clientRequestCounter.current}`;
    return {
      clientRequestId: `alpha57-image-${kind}-${suffix}`,
      idempotencyKey: `alpha57-image-${kind}-${suffix}`,
    };
  }

  async function refreshImageProjection(workOrderId: string, expectedVersion: number) {
    const [refreshedDetail, refreshedImages] = await Promise.all([
      workOrderQueryController.detail(workOrderId),
      workOrderQueryController.images(workOrderId),
    ]);
    if (
      refreshedDetail.header.entityVersion !== expectedVersion
      || refreshedImages.entityVersion !== expectedVersion
    ) {
      throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 변경 후 최신 버전을 확인하지 못했습니다." });
    }
    setDetail(refreshedDetail);
    setImages(refreshedImages.items);
    setAttachments(refreshedImages.attachments);
    setBasicInfoDraft(basicInfoDraftFromDetail(refreshedDetail));
    const representativeThumbnail = refreshedDetail.header.representativeImage;
    setItems((current) => current.map((item) => item.workOrderId === workOrderId
      ? { ...item, representativeThumbnail, updatedAt: refreshedDetail.header.updatedAt }
      : item));
    setSelected((current) => current?.workOrderId === workOrderId
      ? { ...current, representativeThumbnail, updatedAt: refreshedDetail.header.updatedAt }
      : current);
  }

  async function acquireImage(source: WorkOrderImageAcquisitionSource) {
    if (!detail || !selected || !canEditWorkOrder(detail, user)) return;
    if (imageMutation.tryBegin() !== "started") return;
    setImageBusy(true);
    setImageBusyId(null);
    setImageMessage(null);
    try {
      const acquired = await acquireWorkOrderImage(source);
      if (acquired.status === "cancelled") return;
      if (acquired.status === "denied") {
        setImageMessage(acquired.message);
        return;
      }
      if (images.length >= 20) {
        setImageMessage("작업지시서 이미지는 최대 20장까지 등록할 수 있습니다.");
        return;
      }
      const localResponse = await fetch(acquired.asset.uri);
      if (!localResponse.ok) throw new Error("LOCAL_IMAGE_READ_FAILED");
      const blob = await localResponse.blob();
      const file = normalizeAcquiredImageFile(acquired.asset, blob);
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
        setImageMessage("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
        return;
      }
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
        setImageMessage("이미지는 1장당 10MB 이하만 등록할 수 있습니다.");
        return;
      }

      const uploadTarget = await workOrderMutationController.prepareImageUpload(selected.workOrderId, file);
      await workOrderMutationController.putImageBlob(uploadTarget, blob);
      const identity = nextImageRequestIdentity("upload");
      const result = await workOrderMutationController.completeImageUpload(selected.workOrderId, {
        expectedVersion: detail.header.entityVersion,
        ...identity,
        uploadTarget,
      });
      await refreshImageProjection(selected.workOrderId, result.nextVersion);
        setImageMessage(result.isRepresentative
          ? "첫 이미지를 등록하고 대표이미지로 지정했습니다."
          : "이미지를 등록했습니다. 기존 대표이미지는 유지됩니다.");
    } catch (error) {
      setImageMessage(error instanceof MobileApiError ? error.message : "이미지를 등록하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      imageMutation.complete();
      setImageBusy(false);
      setImageBusyId(null);
    }
  }

  async function acquireAttachment() {
    if (!detail || !selected || !canEditWorkOrder(detail, user)) return;
    if (imageMutation.tryBegin() !== "started") return;
    setImageBusy(true);
    setImageBusyId(null);
    setImageMessage(null);
    try {
      if (images.length + attachments.length >= 20) {
        setImageMessage("이미지와 첨부는 합쳐 최대 20개까지 등록할 수 있습니다.");
        return;
      }
      const acquired = await acquireWorkOrderAttachment();
      if (acquired.status === "cancelled") return;
      if (acquired.status === "invalid") {
        setImageMessage(acquired.message);
        return;
      }
      const localResponse = await fetch(acquired.asset.uri);
      if (!localResponse.ok) throw new Error("LOCAL_ATTACHMENT_READ_FAILED");
      const blob = await localResponse.blob();
      if (blob.size !== acquired.asset.size) throw new Error("LOCAL_ATTACHMENT_SIZE_MISMATCH");
      const file = {
        name: acquired.asset.name,
        type: acquired.asset.mimeType,
        size: acquired.asset.size,
      };
      const uploadTarget = await workOrderMutationController.prepareAttachmentUpload(selected.workOrderId, file);
      await workOrderMutationController.putImageBlob(uploadTarget, blob);
      const identity = nextImageRequestIdentity("attachment-upload");
      const result = await workOrderMutationController.completeAttachmentUpload(selected.workOrderId, {
        expectedVersion: detail.header.entityVersion,
        ...identity,
        uploadTarget,
      });
      await refreshImageProjection(selected.workOrderId, result.nextVersion);
      setImageMessage("첨부파일을 등록했습니다.");
    } catch (error) {
      setImageMessage(error instanceof MobileApiError ? error.message : "첨부파일을 등록하지 못했습니다.");
    } finally {
      imageMutation.complete();
      setImageBusy(false);
      setImageBusyId(null);
    }
  }

  async function deleteAttachment(attachment: WorkOrderAttachmentAsset) {
    if (!detail || !selected || !canEditWorkOrder(detail, user)) return;
    if (imageMutation.tryBegin() !== "started") return;
    setImageBusy(true);
    setImageBusyId(attachment.id);
    setImageMessage(null);
    try {
      const identity = nextImageRequestIdentity("attachment-delete");
      const result = await workOrderMutationController.deleteAttachment(
        selected.workOrderId,
        attachment.id,
        { expectedVersion: detail.header.entityVersion, ...identity },
      );
      await refreshImageProjection(selected.workOrderId, result.nextVersion);
      setImageMessage("첨부파일을 삭제했습니다.");
    } catch (error) {
      setImageMessage(error instanceof MobileApiError ? error.message : "첨부파일을 삭제하지 못했습니다.");
    } finally {
      imageMutation.complete();
      setImageBusy(false);
      setImageBusyId(null);
    }
  }

  function requestDeleteAttachment(attachment: WorkOrderAttachmentAsset) {
    if (imageBusy) return;
    confirmWaflDestructiveAction({
      title: "첨부파일을 삭제할까요?",
      message: attachment.filename,
      onConfirm: () => void deleteAttachment(attachment),
    });
  }

  async function openAttachment(attachment: WorkOrderAttachmentAsset) {
    try {
      if (!selected) throw new Error("WORK_ORDER_NOT_SELECTED");
      const preview = await workOrderMutationController.issueAttachmentPreview(selected.workOrderId, attachment.id);
      const url = resolveMobileApiUrl(preview.previewUrl);
      if (!url) throw new Error("ATTACHMENT_PREVIEW_URL_INVALID");
      await Linking.openURL(url);
    } catch (error) {
      setImageMessage(error instanceof MobileApiError ? error.message : "첨부파일을 열 수 없습니다.");
    }
  }

  async function saveFactoryDeliveryMemo(memo: string): Promise<boolean> {
    if (!detail || !selected || !canEditWorkOrder(detail, user)) return false;
    if (factoryDeliveryMemoLength(memo) > FACTORY_DELIVERY_MEMO_MAX_LENGTH) {
      setImageMessage(`공장 전달 메모는 ${FACTORY_DELIVERY_MEMO_MAX_LENGTH}자까지 입력할 수 있습니다.`);
      return false;
    }
    if (memo === (detail.revision.factoryDeliveryMemo ?? "")) {
      return true;
    }
    if (imageMutation.tryBegin() !== "started") return false;
    setImageBusy(true);
    setImageBusyId(null);
    setImageMessage(null);
    try {
      const identity = nextImageRequestIdentity("memo");
      const saved = await workOrderMutationController.updateOverview(selected.workOrderId, {
        clientRequestId: identity.clientRequestId,
        expectedVersion: detail.header.entityVersion,
        patch: { factoryDeliveryMemo: memo.length > 0 ? memo : null },
      });
      await refreshImageProjection(selected.workOrderId, saved.nextVersion);
      setImageMessage("공장 전달 메모를 저장했습니다.");
      return true;
    } catch (error) {
      setImageMessage(error instanceof MobileApiError ? error.message : "공장 전달 메모를 저장하지 못했습니다.");
      return false;
    } finally {
      imageMutation.complete();
      setImageBusy(false);
      setImageBusyId(null);
    }
  }

  async function setRepresentativeImage(image: WorkOrderImageAsset) {
    if (!detail || !selected || image.isRepresentative || !canEditWorkOrder(detail, user)) return;
    if (imageMutation.tryBegin() !== "started") return;
    setImageBusy(true);
    setImageBusyId(image.id);
    setImageMessage(null);
    try {
      const identity = nextImageRequestIdentity("representative");
      const result = await workOrderMutationController.setRepresentativeImage(
        selected.workOrderId,
        image.id,
        { expectedVersion: detail.header.entityVersion, ...identity },
      );
      await refreshImageProjection(selected.workOrderId, result.nextVersion);
      setImageMessage("대표이미지를 변경했습니다.");
    } catch (error) {
      setImageMessage(error instanceof MobileApiError ? error.message : "대표이미지를 변경하지 못했습니다.");
    } finally {
      imageMutation.complete();
      setImageBusy(false);
      setImageBusyId(null);
    }
  }

  async function deleteImage(image: WorkOrderImageAsset) {
    if (!detail || !selected || !canEditWorkOrder(detail, user)) return;
    if (imageMutation.tryBegin() !== "started") return;
    setImageBusy(true);
    setImageBusyId(image.id);
    setImageMessage(null);
    try {
      const identity = nextImageRequestIdentity("delete");
      const result = await workOrderMutationController.deleteImage(
        selected.workOrderId,
        image.id,
        { expectedVersion: detail.header.entityVersion, ...identity },
      );
      await refreshImageProjection(selected.workOrderId, result.nextVersion);
      setImageMessage(image.isRepresentative
        ? "대표이미지를 삭제했습니다. 다른 이미지가 자동으로 대표 지정되지는 않습니다."
        : "이미지를 삭제했습니다.");
    } catch (error) {
      setImageMessage(error instanceof MobileApiError ? error.message : "이미지를 삭제하지 못했습니다.");
    } finally {
      imageMutation.complete();
      setImageBusy(false);
      setImageBusyId(null);
    }
  }

  function requestDeleteImage(image: WorkOrderImageAsset) {
    if (imageBusy) return;
    confirmWaflDestructiveAction({
      title: "이미지를 삭제할까요?",
      message: image.isRepresentative
        ? "대표이미지를 삭제하면 대표가 없는 상태로 돌아갑니다."
        : "삭제한 이미지는 앱에서 더 이상 표시되지 않습니다.",
      onConfirm: () => void deleteImage(image),
    });
  }

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

  function beginMaterialCreate() {
    if (!canEditWorkOrder(detail, user)) return;
    const label = materialLabel(activeMaterialType);
    if (editing && basicInfoDirty) {
      Alert.alert("개요 편집을 완료해 주세요.", `현재 값을 저장하거나 취소한 뒤 ${label}를 추가할 수 있습니다.`);
      return;
    }
    setEditing(false);
    setActiveBasicField(null);
    setSaveState("read-only");
    setSaveMessage(null);
    const token = ++materialEditorSequence.current;
    const base = materialCreateDraft(activeMaterialType);
    updateMaterialEditor(() => ({
      token,
      mode: "create",
      workOrderId: detail.header.id,
      materialLineId: null,
      materialType: activeMaterialType,
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
    const label = materialLabel(line.materialType);
    if (editing && basicInfoDirty) {
      Alert.alert("개요 편집을 완료해 주세요.", `현재 값을 저장하거나 취소한 뒤 ${label}를 수정할 수 있습니다.`);
      return;
    }
    const current = materialEditorRef.current;
    if (current && current.materialLineId !== line.id && materialEditorDirty) {
      Alert.alert(`현재 ${label} 편집을 완료해 주세요.`, `값을 저장하거나 취소한 뒤 다른 ${label}를 수정할 수 있습니다.`);
      return;
    }
    setEditing(false);
    setActiveBasicField(null);
    setSaveState("read-only");
    setSaveMessage(null);
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
    if (materialMutation.inFlight) return;
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
      throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "저장 후 최신 원단 버전을 확인할 수 없습니다." });
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
    const label = materialLabel(line.materialType);
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
      const result = await workOrderMutationController.deleteMaterial(
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
        || result.result.deleted !== true
        || activePage.materialType !== line.materialType
        || refreshed.header.id !== currentDetail.header.id
      ) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: `${label} lifecycle 최신 상태를 확인할 수 없습니다.` });
      if (
        materialSessionGeneration.current !== sessionGeneration
        || materialLifecycleSequence.current !== requestToken
        || selectedWorkOrderId.current !== currentDetail.header.id
      ) return;
      applyRefreshedMaterialSnapshot(currentDetail.header.id, line.materialType, refreshed, activePage);
      if (materialEditorRef.current?.materialLineId === line.id) closeMaterialEditorSession();
      setMaterialSaveNotice(`${label}를 삭제했습니다.`);
    } catch (error) {
      if (materialSessionGeneration.current !== sessionGeneration || materialLifecycleSequence.current !== requestToken) return;
      setMaterialSaveNotice(error instanceof MobileApiError ? error.message : `${label} 상태를 변경하지 못했습니다.`);
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
        Alert.alert("발주 정보를 확인해 주세요.", Object.values(errors)[0] ?? "발주수량과 단위를 확인해 주세요.");
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
      ? "실제 공급처에 주문을 넣은 상태로 기록하고 일반 편집을 잠급니다."
      : action === "cancel"
        ? `발주요청을 취소하고 ${label} 편집을 다시 허용합니다.`
        : "공급처가 주문을 접수한 상태로 기록합니다. 완료 후에는 취소하거나 편집할 수 없습니다.";
    leaveWithDraftPolicy("feature", () => {
      Alert.alert(title, message, [
        { text: "닫기", style: "cancel" },
        {
          text: title,
          style: action === "cancel" ? "destructive" : "default",
          onPress: () => void executeMaterialOrder(line, action),
        },
      ]);
    });
  }

  function requestDeleteMaterial(line: WorkOrderMaterialLine) {
    if (!line.deletable) return;
    const label = materialLabel(line.materialType);
    leaveWithDraftPolicy("feature", () => {
      confirmWaflDestructiveAction({
        title: `${label} 영구 삭제`,
        message: `“${line.name}” ${label}를 이 작업지시서 초안에서 영구 삭제합니다. 발주 이력이 없는 항목만 삭제할 수 있습니다.`,
        onConfirm: () => void executeMaterialDelete(line),
      });
    });
  }

  async function saveMaterial(draftOverride?: MaterialDraftUpdate, inlineOwner?: MaterialInlineEditSession) {
    if (inlineOwner && !ownsMaterialInlineEditSession(materialInlineSessionRef.current, inlineOwner)) return;
    const editor = materialEditorRef.current;
    if (!detail || !editor || materialMutation.inFlight || editor.committedNextVersion !== null) return;
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
      try {
        await refreshMaterialSnapshot({
          workOrderId: editor.workOrderId,
          materialType: editor.materialType,
          token: editor.token,
          expectedVersion,
          sessionGeneration: materialSessionGeneration.current,
        });
      } catch {
        showToast(`최신 ${materialLabel(editor.materialType)}를 불러오지 못했습니다.`, "error");
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
      fieldErrors = validateMaterialDraft(effectiveDraft, editor.materialType);
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
      const expectedVersion = detail.header.entityVersion;
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
      const patchCompletedAt = Date.now();
      updateMaterialEditor((current) => current?.token === editor.token ? {
        ...current,
        base: normalizedDraft,
        draft: normalizedDraft,
        committedNextVersion,
        saveState: "saving",
      } : current);
      const applied = await refreshMaterialSnapshot({
        workOrderId: editor.workOrderId,
        materialType: editor.materialType,
        token: editor.token,
        expectedVersion: saved.nextVersion,
        sessionGeneration,
      });
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
      const label = materialLabel(editor.materialType);
      setMaterialSaveNotice(editor.mode === "create" ? `${label}를 추가했습니다.` : `${label}를 저장했습니다.`);
    } catch (error) {
      if (committedNextVersion !== null) {
        showToast(`저장은 반영됐지만 최신 ${materialLabel(editor.materialType)}를 확인하지 못했습니다.`, "warning");
        updateMaterialEditor((current) => current?.token === editor.token ? {
          ...current,
          base: normalizedDraft,
          draft: normalizedDraft,
          committedNextVersion,
          saveState: "refresh-error",
          saveMessage: `저장은 반영됐지만 최신 ${materialLabel(editor.materialType)}를 확인하지 못했습니다.`,
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
        if (await refreshInlineMaterial(error.entityVersion)) return;
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, conflictVersion: error.entityVersion, saveState: "conflict", saveMessage: "다른 변경이 먼저 저장되었습니다." } : current);
      } else if (error instanceof MobileApiError && (error.code === "LOCKED" || error.code === "REVISION_MISMATCH")) {
        showToast(`현재 상태에서는 ${materialLabel(editor.materialType)}를 수정할 수 없습니다.`, "warning");
        if (rollbackInlineMaterial()) return;
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "locked", saveMessage: `현재 상태에서는 ${materialLabel(editor.materialType)}를 수정할 수 없습니다.` } : current);
      } else if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        rollbackInlineMaterial();
        setRequestError(error, "boot");
      } else {
        showToast(error instanceof MobileApiError ? error.message : `${materialLabel(editor.materialType)}를 저장하지 못했습니다.`, "error");
        if (rollbackInlineMaterial()) return;
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "save-error", saveMessage: error instanceof MobileApiError ? error.message : `${materialLabel(editor.materialType)}를 저장하지 못했습니다.` } : current);
      }
    } finally {
      materialMutation.complete();
    }
  }

  function reloadLatestMaterial() {
    const editor = materialEditorRef.current;
    if (!editor || materialMutation.inFlight) return;
    const load = async () => {
      materialMutation.tryBegin();
      const sessionGeneration = materialSessionGeneration.current;
      updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "saving", saveMessage: `최신 ${materialLabel(editor.materialType)}를 확인하고 있습니다.` } : current);
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
        setMaterialSaveNotice(editor.committedNextVersion === null ? null : `저장된 ${materialLabel(editor.materialType)}를 확인했습니다.`);
      } catch (error) {
        showToast(error instanceof MobileApiError ? error.message : `최신 ${materialLabel(editor.materialType)}를 불러오지 못했습니다.`, "error");
        updateMaterialEditor((current) => current?.token === editor.token ? {
          ...current,
          saveState: editor.committedNextVersion === null ? "conflict" : "refresh-error",
          saveMessage: error instanceof MobileApiError ? error.message : `최신 ${materialLabel(editor.materialType)}를 불러오지 못했습니다.`,
        } : current);
      } finally {
        materialMutation.complete();
      }
    };
    void load();
  }

  function beginBasicInfoEdit(field: BasicInfoInlineField) {
    if (!canEditWorkOrder(detail, user)) return;
    if (materialEditorRef.current && materialEditorDirty) {
      const label = materialLabel(materialEditorRef.current.materialType);
      Alert.alert(`${label} 편집을 완료해 주세요.`, "현재 값을 저장하거나 취소한 뒤 개요를 수정할 수 있습니다.");
      return;
    }
    if (editing) {
      if (basicInfoDirty && activeBasicField !== field) {
        Alert.alert("현재 필드 편집을 완료해 주세요.", "값을 저장하거나 취소한 뒤 다른 필드를 수정할 수 있습니다.");
        return;
      }
      setActiveBasicField(field);
      return;
    }
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setActiveMaterialField(null);
    setMaterialSaveNotice(null);
    setBasicInfoDraft(basicInfoDraftFromDetail(detail));
    setBasicInfoErrors({});
    setConflictVersion(null);
    setSaveState("editing");
    setSaveMessage(null);
    setEditing(true);
    setActiveBasicField(field);
  }

  function changeBasicInfoDraft(field: keyof BasicInfoDraft, value: string) {
    setBasicInfoDraft((current) => ({ ...current, [field]: value }));
    setBasicInfoErrors((current) => ({ ...current, [field]: undefined }));
    if (saveState !== "saving") setSaveState("editing");
    setSaveMessage(null);
  }

  function cancelBasicInfoEdit() {
    if (overviewMutation.inFlight) return;
    if (detail) setBasicInfoDraft(basicInfoDraftFromDetail(detail));
    setBasicInfoErrors({});
    setConflictVersion(null);
    setSaveState("read-only");
    setSaveMessage(null);
    setEditing(false);
    setActiveBasicField(null);
  }

  function nextClientRequestId() {
    clientRequestCounter.current += 1;
    return `alpha46-mobile-basic-${Date.now()}-${clientRequestCounter.current}`;
  }

  async function saveBasicInfo(override?: Partial<BasicInfoDraft>) {
    if (!detail || !selected || !editing || overviewMutation.inFlight) return;
    const effectiveDraft = override ? { ...basicInfoDraft, ...override } : basicInfoDraft;
    const inlineRollback = activeBasicField === "productName"
      || activeBasicField === "targetAudience"
      || activeBasicField === "categoryMajor"
      || activeBasicField === "categoryDetail"
      || activeBasicField === "seasonCode";
    const rollbackBasicInline = (refreshLatest = false) => {
      if (!inlineRollback) return false;
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
      cancelBasicInfoEdit();
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
    if (productName !== detail.header.productName) patch.productName = productName;
    const dueDate = effectiveDraft.dueDate || null;
    if (dueDate !== detail.header.dueDate) patch.dueDate = dueDate;
    const productTypeCode = encodeWorkOrderProductType(effectiveDraft);
    if (productTypeCode !== detail.header.productTypeCode) patch.productTypeCode = productTypeCode;
    const categoryDetail = effectiveDraft.categoryDetail.trim() || null;
    if (categoryDetail !== detail.header.itemCode) patch.itemCode = categoryDetail;
    const seasonCode = effectiveDraft.seasonCode.trim() || null;
    if (seasonCode !== detail.header.seasonCode) patch.seasonCode = seasonCode;
    if (Object.keys(patch).length === 0) {
      cancelBasicInfoEdit();
      return;
    }

    overviewMutation.tryBegin();
    const saveStartedAt = Date.now();
    setBasicInfoErrors({});
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const saved = await workOrderMutationController.updateOverview(selected.workOrderId, {
        clientRequestId: nextClientRequestId(),
        expectedVersion: detail.header.entityVersion,
        patch,
      });
      const patchCompletedAt = Date.now();
      const refreshed = await workOrderQueryController.detail(selected.workOrderId);
      if (refreshed.header.entityVersion !== saved.nextVersion) {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "저장 후 최신 버전을 확인할 수 없습니다." });
      }
      setDetail(refreshed);
      setBasicInfoDraft(basicInfoDraftFromDetail(refreshed));
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
      setEditing(false);
      setActiveBasicField(null);
      setSaveState("saved");
      setSaveMessage("저장됨");
      const completedAt = Date.now();
      if (process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") console.info("[WAFL_OVERVIEW_SAVE_METRIC]", {
        payloadFields: Object.keys(patch).sort(),
        patchMs: patchCompletedAt - saveStartedAt,
        canonicalRevalidationMs: completedAt - patchCompletedAt,
        totalMs: completedAt - saveStartedAt,
        canonicalGetCount: 1,
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
  }

  function reloadLatestBasicInfo() {
    if (!selected || detailRequestInFlight.current) return;
    const load = async () => {
      detailRequestInFlight.current = true;
      try {
        const refreshed = await workOrderQueryController.detail(selected.workOrderId);
        setDetail(refreshed);
        setBasicInfoDraft(basicInfoDraftFromDetail(refreshed));
        setBasicInfoErrors({});
        setConflictVersion(null);
        setEditing(false);
        setSaveState("read-only");
        setSaveMessage(null);
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
      } catch (error) {
        setSaveState("save-error");
        setSaveMessage(error instanceof MobileApiError ? error.message : "최신 내용을 불러오지 못했습니다.");
      } finally {
        detailRequestInFlight.current = false;
      }
    };
    void load();
  }

  function retry() {
    if (!errorState) return;
    if (errorState.retryTarget === "detail" && selected) void selectItem(selected);
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
  ) : phase === "recoverable-error" && errorState?.retryTarget === "detail" ? (
    <ErrorPanel error={errorState} onRetry={retry} onReturnToList={returnToList} />
  ) : detail ? (
    <WorkOrderDetailOverview
      canEdit={canEditWorkOrder(detail, user)}
      canEditMaterials={canEditWorkOrder(detail, user)}
      detail={detail}
      images={images}
      attachments={attachments}
      imageBusy={imageBusy}
      imageBusyId={imageBusyId}
      imageMessage={imageMessage}
      dirty={basicInfoDirty}
      draft={basicInfoDraft}
      activeBasicField={activeBasicField}
      fieldErrors={basicInfoErrors}
      materialEditor={materialEditor}
      materialType={activeMaterialType}
      activeMaterialField={activeMaterialField}
      activeMaterialInlineSession={activeMaterialInlineSession}
      materialEditorDirty={materialEditorDirty}
      materialLifecycleBusyId={materialLifecycleBusyId}
      materialOrderBusyId={materialOrderBusyId}
      materialOrderBusyAction={materialOrderBusyAction}
      materialOrderPolicy={(line) => materialOrderPolicyFor(detail, user, line)}
      onBack={returnToList}
        onAcquireImage={(source) => void acquireImage(source)}
        onAcquireAttachment={() => void acquireAttachment()}
      onBeginEdit={beginBasicInfoEdit}
      onBeginMaterialCreate={beginMaterialCreate}
      onBeginMaterialEdit={beginMaterialEdit}
      onDeleteMaterial={requestDeleteMaterial}
      onMaterialOrderAction={requestMaterialOrderAction}
      onCancelEdit={cancelBasicInfoEdit}
      onCancelMaterialEditor={cancelMaterialEditor}
      onCancelMaterialInlineEditor={cancelOwnedMaterialEditor}
      onChangeDraft={changeBasicInfoDraft}
      onChangeMaterialDraft={changeMaterialDraft}
      onChangeMaterialInlineDraft={(field, value, owner) => changeMaterialDraft(field, value, owner)}
      onReloadLatest={reloadLatestBasicInfo}
      onReloadLatestMaterial={reloadLatestMaterial}
      materials={materialCache[materialCacheKey(detail.header.id, activeMaterialType)] ?? EMPTY_MATERIAL_STATE}
      materialIdentityKey={materialCacheKey(detail.header.id, activeMaterialType)}
      materialSaveNotice={materialSaveNotice}
      onLoadMoreMaterials={() => void loadMaterials(detail.header.id, activeMaterialType, "more")}
      onOpenMaterials={(materialType) => {
        if (materialEditorRef.current?.materialType !== materialType) closeMaterialEditorSession();
        setActiveMaterialType(materialType);
        setMaterialSaveNotice(null);
        void loadMaterials(detail.header.id, materialType, "initial");
      }}
      sizeColor={sizeColor}
      sizeColorEdit={sizeColorEdit}
      onRequestSectionChange={(onProceed) => leaveWithDraftPolicy("feature", onProceed)}
      onRetryMaterials={() => void loadMaterials(detail.header.id, activeMaterialType, "retry")}
        onDeleteImage={requestDeleteImage}
        onDeleteAttachment={requestDeleteAttachment}
        onOpenAttachment={(attachment) => void openAttachment(attachment)}
        onSaveFactoryDeliveryMemo={saveFactoryDeliveryMemo}
      onSetRepresentativeImage={(image) => void setRepresentativeImage(image)}
      onSave={(override) => void saveBasicInfo(override)}
      onSaveDate={(value) => {
        changeBasicInfoDraft("dueDate", value);
        void saveBasicInfo({ dueDate: value });
      }}
      onSaveMaterial={(draftOverride) => void saveMaterial(draftOverride)}
      onSaveMaterialInline={(draftOverride, owner) => void saveMaterial(draftOverride, owner)}
      phone={!tablet}
      saveMessage={saveMessage}
      saveState={saveState}
    />
  ) : (
    <View style={styles.placeholder}><Text style={styles.placeholderTitle}>작업지시서를 선택하세요.</Text><Text style={styles.placeholderBody}>왼쪽 목록에서 작업지시서를 선택하면 실제 상세 개요가 표시됩니다.</Text></View>
  );

  const globalError = phase === "recoverable-error" && errorState?.retryTarget !== "detail";

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
              <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={selected?.workOrderId ?? null} loading={phase === "authenticated-loading-list"} loadingMore={listLoadingMore} searching={listSearching} query={listQuery} statusFilter={listStatusFilter} onCreate={openCreateSheet} onLoadMore={() => void loadMoreList()} onRefresh={loadListSafely} onSearch={applyListSearch} onStatusFilter={applyListStatusFilter} onSelect={selectItemSafely} />
            </View>
            <View style={styles.detailPane}>{detailPane}</View>
          </View>
        ) : selected ? (
          <View style={styles.phoneBody}>{detailPane}</View>
        ) : (
          <View style={styles.phoneBody}>
            <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={null} loading={phase === "authenticated-loading-list"} loadingMore={listLoadingMore} searching={listSearching} query={listQuery} statusFilter={listStatusFilter} onCreate={openCreateSheet} onLoadMore={() => void loadMoreList()} onRefresh={loadListSafely} onSearch={applyListSearch} onStatusFilter={applyListStatusFilter} onSelect={selectItemSafely} />
          </View>
        )}
      </View>
      <WorkOrderCreateSheet error={createError} onCancel={cancelCreateSheet} onChangeProductName={changeCreateProductName} onConfirm={createWorkOrderDraftFromMobile} pending={createPending} productName={createProductName} visible={createSheetVisible} />
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
  app: { alignSelf: "center", flex: 1, maxWidth: 1180, paddingHorizontal: 14, width: "100%" },
  appTablet: { paddingHorizontal: 22 },
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
