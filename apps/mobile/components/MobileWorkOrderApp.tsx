import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ChevronLeft, LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MobileConnectScreen from "@/components/MobileConnectScreen";
import WorkOrderDetailOverview, {
  type BasicInfoDraft,
  type BasicInfoFieldErrors,
  type BasicInfoSaveState,
} from "@/components/WorkOrderDetailOverview";
import type { MaterialReadStatus, MaterialReadViewState } from "@/components/WorkOrderMaterialsReadOnly";
import type { MaterialEditorFieldErrors, MaterialEditorViewState } from "@/components/WorkOrderMaterialEditor";
import WorkOrderListScreen from "@/components/WorkOrderListScreen";
import { WAFL_FONTS } from "@/constants/fonts";
import {
  assertMobileApiOrigin,
  archiveWorkOrderMaterial,
  connectTailscaleDeveloper,
  createWorkOrderMaterial,
  disconnectMobileSession,
  exchangeMobileConnectCode,
  getCurrentMobileUser,
  getWorkOrderDetail,
  getWorkOrderList,
  getWorkOrderMaterials,
  patchWorkOrderMaterial,
  patchWorkOrderBasicInfo,
  restoreWorkOrderMaterial,
} from "@/lib/apiClient";
import { MobileApiError, type MaterialDraftFields, type MobileCurrentUser, type WorkOrderDetailCore, type WorkOrderListItem, type WorkOrderMaterialLine } from "@/lib/apiTypes";

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

type ErrorState = {
  readonly message: string;
  readonly guidance: string;
  readonly correlationId: string | null;
  readonly retryTarget: "boot" | "list" | "detail" | "disconnect";
};

type MaterialCacheEntry = MaterialReadViewState & {
  readonly nextCursor: string | null;
  readonly failedCursor: string | null;
  readonly entityVersion: number | null;
  readonly touchedAt: number;
  readonly archivedStatus?: MaterialReadStatus;
  readonly archivedItems?: readonly WorkOrderMaterialLine[];
  readonly archivedNextCursor?: string | null;
  readonly archivedHasMore?: boolean;
  readonly archivedTotalCount?: number;
  readonly archivedErrorMessage?: string | null;
};

const MATERIAL_CACHE_LIMIT = 6;
const EMPTY_MATERIAL_STATE: MaterialReadViewState = {
  status: "not-loaded",
  items: [],
  hasMore: false,
  errorMessage: null,
};

function archivedMaterialState(entry: MaterialCacheEntry | undefined): MaterialReadViewState {
  return {
    status: entry?.archivedStatus ?? "not-loaded",
    items: entry?.archivedItems ?? [],
    hasMore: entry?.archivedHasMore ?? false,
    errorMessage: entry?.archivedErrorMessage ?? null,
  };
}

function materialErrorMessage(error: unknown) {
  if (!(error instanceof MobileApiError)) return "원단 정보를 불러오지 못했습니다";
  if (error.code === "FORBIDDEN" || error.status === 403) return "원단 정보를 볼 권한이 없습니다";
  if (error.code === "NOT_FOUND" || error.status === 404) return "제작 카드 또는 원단 정보를 찾을 수 없습니다";
  if (error.code === "CONFLICT" || error.status === 409) return "원단 정보를 최신 상태로 불러오지 못했습니다";
  return "원단 정보를 불러오지 못했습니다";
}

function putBoundedMaterialEntry(
  cache: Readonly<Record<string, MaterialCacheEntry>>,
  workOrderId: string,
  entry: MaterialCacheEntry,
) {
  const next: Record<string, MaterialCacheEntry> = { ...cache, [workOrderId]: entry };
  const keys = Object.keys(next);
  if (keys.length <= MATERIAL_CACHE_LIMIT) return next;
  const eviction = keys
    .filter((key) => key !== workOrderId)
    .sort((left, right) => next[left].touchedAt - next[right].touchedAt)[0];
  if (eviction) delete next[eviction];
  return next;
}

function customerMessage(error: unknown) {
  if (!(error instanceof MobileApiError)) return "요청을 처리하지 못했습니다.";
  if (error.code === "AUTH_REQUIRED" || error.status === 401) return "연결이 필요합니다.";
  if (error.code === "FORBIDDEN" || error.status === 403) return "제작 카드를 볼 권한이 없습니다.";
  if (error.code === "NOT_FOUND" || error.status === 404) return "제작 카드를 찾을 수 없습니다.";
  if (error.code === "MOBILE_CONNECT_CODE_UNAVAILABLE") return "연결 코드가 만료되었거나 사용할 수 없습니다.";
  if (error.code === "API_ORIGIN_INVALID") return error.message;
  if (error.code === "TIMEOUT") return "요청 시간이 초과되었습니다. 연결 상태를 확인한 뒤 다시 시도하세요.";
  if (error.code === "NETWORK_ERROR") return "연결 상태를 확인한 뒤 다시 시도하세요.";
  return "제작 카드를 불러오지 못했습니다.";
}

function customerGuidance(error: unknown, retryTarget: ErrorState["retryTarget"]) {
  if (retryTarget === "detail" && error instanceof MobileApiError && (error.code === "NOT_FOUND" || error.status === 404)) {
    return "목록으로 돌아가 다른 제작 카드를 선택하세요.";
  }
  if (retryTarget === "detail" && error instanceof MobileApiError && (error.code === "FORBIDDEN" || error.status === 403)) {
    return "목록으로 돌아가 볼 수 있는 제작 카드를 선택하세요.";
  }
  if (error instanceof MobileApiError && (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT" || error.status >= 500)) {
    return "연결 상태를 확인한 뒤 직접 다시 시도하세요.";
  }
  return "자동으로 다시 요청하지 않습니다.";
}

function draftFromDetail(detail: WorkOrderDetailCore): BasicInfoDraft {
  return {
    productName: detail.header.productName,
    dueDate: detail.header.dueDate ?? "",
    totalQuantity: String(detail.header.totalQuantity),
  };
}

function validateBasicInfoDraft(draft: BasicInfoDraft): BasicInfoFieldErrors {
  const errors: BasicInfoFieldErrors = {};
  const productName = draft.productName.trim();
  if (productName.length < 1 || productName.length > 200) errors.productName = "제품명은 1자 이상 200자 이하여야 합니다.";
  if (draft.dueDate) {
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(draft.dueDate);
    const year = Number(matched?.[1] ?? 0);
    const month = Number(matched?.[2] ?? 0);
    const day = Number(matched?.[3] ?? 0);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (!matched || year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
      errors.dueDate = "납기는 YYYY-MM-DD 형식의 유효한 날짜여야 합니다.";
    }
  }
  if (!/^\d+$/.test(draft.totalQuantity)) errors.totalQuantity = "총수량은 쉼표 없는 정수로 입력해 주세요.";
  else {
    const quantity = Number(draft.totalQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000_000) {
      errors.totalQuantity = "총수량은 0 이상 100,000,000 이하의 정수여야 합니다.";
    }
  }
  return errors;
}

const EMPTY_MATERIAL_DRAFT: MaterialDraftFields = {
  name: "",
  colorOption: "",
  usageArea: "",
  requiredQuantity: "0",
  allowanceQuantity: "0",
  inventoryUsageQuantity: "0",
  orderQuantity: "0",
  unitCode: "",
  unitPrice: "0",
  memo: "",
};

const MATERIAL_QUANTITY_PATTERN = /^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/;
const MATERIAL_PRICE_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;

function materialDraftFromLine(line: WorkOrderMaterialLine): MaterialDraftFields {
  return {
    name: line.name,
    colorOption: line.colorOption ?? "",
    usageArea: line.usageArea ?? "",
    requiredQuantity: line.requiredQuantity,
    allowanceQuantity: line.allowanceQuantity,
    inventoryUsageQuantity: line.inventoryUsageQuantity,
    orderQuantity: line.orderQuantity,
    unitCode: line.unitCode,
    unitPrice: line.unitPrice,
    memo: line.memo ?? "",
  };
}

function sameMaterialDraft(left: MaterialDraftFields, right: MaterialDraftFields) {
  return (Object.keys(left) as (keyof MaterialDraftFields)[]).every((field) => left[field] === right[field]);
}

function validateMaterialDraft(draft: MaterialDraftFields): MaterialEditorFieldErrors {
  const errors: MaterialEditorFieldErrors = {};
  if (draft.name.trim().length < 1 || draft.name.trim().length > 200) errors.name = "원단명은 1자 이상 200자 이하여야 합니다.";
  if (draft.colorOption.trim().length > 200) errors.colorOption = "색상·옵션은 200자 이하여야 합니다.";
  if (draft.usageArea.trim().length > 1000) errors.usageArea = "사용부위는 1,000자 이하여야 합니다.";
  if (draft.memo.trim().length > 2000) errors.memo = "메모는 2,000자 이하여야 합니다.";
  if (draft.unitCode.trim().length < 1 || draft.unitCode.trim().length > 32) errors.unitCode = "단위는 1자 이상 32자 이하여야 합니다.";
  for (const field of ["requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity", "orderQuantity"] as const) {
    if (!MATERIAL_QUANTITY_PATTERN.test(draft[field].trim())) errors[field] = "0 이상의 소수점 3자리 이하 숫자를 입력해 주세요.";
  }
  if (!MATERIAL_PRICE_PATTERN.test(draft.unitPrice.trim())) errors.unitPrice = "0 이상의 소수점 2자리 이하 숫자를 입력해 주세요.";
  if (!errors.orderQuantity && !errors.unitPrice) {
    const [quantityWhole, quantityFraction = ""] = draft.orderQuantity.trim().split(".");
    const [priceWhole, priceFraction = ""] = draft.unitPrice.trim().split(".");
    const quantityScaled = BigInt(quantityWhole) * 1000n + BigInt(quantityFraction.padEnd(3, "0"));
    const priceScaled = BigInt(priceWhole) * 100n + BigInt(priceFraction.padEnd(2, "0"));
    const amountCents = (quantityScaled * priceScaled + 500n) / 1000n;
    if (amountCents > 99999999999999n) errors.orderQuantity = "발주수량 또는 단가를 줄여 주세요.";
  }
  return errors;
}

function materialPatch(base: MaterialDraftFields, draft: MaterialDraftFields): Partial<MaterialDraftFields> {
  const patch: Partial<Record<keyof MaterialDraftFields, string>> = {};
  for (const field of Object.keys(base) as (keyof MaterialDraftFields)[]) {
    const normalized = draft[field].trim();
    const baseNormalized = base[field].trim();
    if (normalized !== baseNormalized) patch[field] = normalized;
  }
  return patch;
}

function normalizedMaterialDraft(draft: MaterialDraftFields): MaterialDraftFields {
  return {
    name: draft.name.trim(),
    colorOption: draft.colorOption.trim(),
    usageArea: draft.usageArea.trim(),
    requiredQuantity: draft.requiredQuantity.trim(),
    allowanceQuantity: draft.allowanceQuantity.trim(),
    inventoryUsageQuantity: draft.inventoryUsageQuantity.trim(),
    orderQuantity: draft.orderQuantity.trim(),
    unitCode: draft.unitCode.trim(),
    unitPrice: draft.unitPrice.trim(),
    memo: draft.memo.trim(),
  };
}

export default function MobileWorkOrderApp() {
  const { width } = useWindowDimensions();
  const tablet = width >= 768;
  const [phase, setPhase] = useState<AppPhase>("booting");
  const [user, setUser] = useState<MobileCurrentUser | null>(null);
  const [items, setItems] = useState<readonly WorkOrderListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<WorkOrderListItem | null>(null);
  const [detail, setDetail] = useState<WorkOrderDetailCore | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [editing, setEditing] = useState(false);
  const [basicInfoDraft, setBasicInfoDraft] = useState<BasicInfoDraft>({ productName: "", dueDate: "", totalQuantity: "0" });
  const [basicInfoErrors, setBasicInfoErrors] = useState<BasicInfoFieldErrors>({});
  const [saveState, setSaveState] = useState<BasicInfoSaveState>("read-only");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [conflictVersion, setConflictVersion] = useState<number | null>(null);
  const [materialCache, setMaterialCache] = useState<Readonly<Record<string, MaterialCacheEntry>>>({});
  const [materialEditor, setMaterialEditor] = useState<MaterialEditorViewState | null>(null);
  const [materialSaveNotice, setMaterialSaveNotice] = useState<string | null>(null);
  const [materialLifecycleBusyId, setMaterialLifecycleBusyId] = useState<string | null>(null);
  const detailRequestInFlight = useRef(false);
  const saveRequestInFlight = useRef(false);
  const materialSaveRequestInFlight = useRef(false);
  const materialLifecycleRequestInFlight = useRef(false);
  const clientRequestCounter = useRef(0);
  const autoConnectInFlight = useRef(false);
  const manualDisconnectSuppressed = useRef(false);
  const bootStarted = useRef(false);
  const selectedWorkOrderId = useRef<string | null>(null);
  const materialCacheRef = useRef<Readonly<Record<string, MaterialCacheEntry>>>({});
  const materialRequests = useRef(new Map<string, number>());
  const materialRequestSequence = useRef(0);
  const materialSessionGeneration = useRef(0);
  const materialEditorSequence = useRef(0);
  const materialEditorRef = useRef<MaterialEditorViewState | null>(null);
  const materialLifecycleSequence = useRef(0);

  const updateMaterialEditor = useCallback((updater: (current: MaterialEditorViewState | null) => MaterialEditorViewState | null) => {
    setMaterialEditor((current) => {
      const next = updater(current);
      materialEditorRef.current = next;
      return next;
    });
  }, []);

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
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setMaterialSaveNotice(null);
    materialLifecycleRequestInFlight.current = false;
    setMaterialLifecycleBusyId(null);
  }, []);

  const basicInfoDirty = detail ? (
    basicInfoDraft.productName !== detail.header.productName
    || basicInfoDraft.dueDate !== (detail.header.dueDate ?? "")
    || basicInfoDraft.totalQuantity !== String(detail.header.totalQuantity)
  ) : false;
  const materialEditorDirty = materialEditor ? !sameMaterialDraft(materialEditor.base, materialEditor.draft) : false;
  const dirty = basicInfoDirty || materialEditorDirty;

  const setRequestError = useCallback((error: unknown, retryTarget: ErrorState["retryTarget"]) => {
    if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
      setUser(null);
      setItems([]);
      setSelected(null);
      selectedWorkOrderId.current = null;
      setDetail(null);
      resetMaterialSession();
      setEditing(false);
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
  }, [resetMaterialSession]);

  const loadList = useCallback(async () => {
    setErrorState(null);
    setPhase("authenticated-loading-list");
    try {
      const page = await getWorkOrderList();
      setItems(page.items);
      setHasMore(page.hasMore);
      setSelected(null);
      selectedWorkOrderId.current = null;
      setDetail(null);
      setPhase("list-ready");
    } catch (error) {
      setRequestError(error, "list");
    }
  }, [setRequestError]);

  const authenticateAndLoadList = useCallback(async () => {
    const currentUser = await getCurrentMobileUser();
    if (!currentUser.companyId || !currentUser.companyName) {
      throw new MobileApiError({ code: "FORBIDDEN", message: "회사 연결이 필요합니다.", status: 403 });
    }
    setUser(currentUser);
    const page = await getWorkOrderList();
    setItems(page.items);
    setHasMore(page.hasMore);
    setPhase("list-ready");
  }, []);

  const autoConnect = useCallback(async () => {
    if (autoConnectInFlight.current || manualDisconnectSuppressed.current) return;
    autoConnectInFlight.current = true;
    setErrorState(null);
    setPhase("developer-auto-connecting");
    try {
      assertMobileApiOrigin();
      await connectTailscaleDeveloper();
      await authenticateAndLoadList();
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
      assertMobileApiOrigin();
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
      await exchangeMobileConnectCode(code);
      await authenticateAndLoadList();
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
    setMaterialSaveNotice(null);
    setSelected(item);
    setDetail(null);
    setErrorState(null);
    setPhase("detail-loading");
    try {
      const result = await getWorkOrderDetail(item.workOrderId);
      setDetail(result);
      setBasicInfoDraft(draftFromDetail(result));
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
    setErrorState(null);
    setEditing(false);
    setBasicInfoErrors({});
    setSaveState("read-only");
    setSaveMessage(null);
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setMaterialSaveNotice(null);
    setPhase("list-ready");
  }

  function discardActiveEditors() {
    if (detail) setBasicInfoDraft(draftFromDetail(detail));
    setBasicInfoErrors({});
    setConflictVersion(null);
    setEditing(false);
    setSaveState("read-only");
    setSaveMessage(null);
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setMaterialSaveNotice(null);
  }

  function confirmDiscard(onDiscard: () => void) {
    if (saveRequestInFlight.current || materialSaveRequestInFlight.current) {
      Alert.alert("저장 중입니다.", "저장이 끝난 뒤 이동해 주세요.");
      return;
    }
    if (!dirty) {
      if (editing || materialEditorRef.current) discardActiveEditors();
      onDiscard();
      return;
    }
    Alert.alert(
      "저장하지 않은 변경사항이 있습니다.",
      "변경사항을 버리면 입력한 내용은 복구되지 않습니다.",
      [
        { text: "계속 편집", style: "cancel" },
        { text: "변경사항 버리기", style: "destructive", onPress: () => {
          discardActiveEditors();
          onDiscard();
        } },
      ],
      { cancelable: true },
    );
  }

  function returnToList() {
    confirmDiscard(clearDetailAndReturnToList);
  }

  function selectItemSafely(item: WorkOrderListItem) {
    if (selected?.workOrderId === item.workOrderId) return;
    confirmDiscard(() => void selectItem(item));
  }

  function loadListSafely() {
    confirmDiscard(() => void loadList());
  }

  async function disconnect() {
    setErrorState(null);
    try {
      await disconnectMobileSession();
      manualDisconnectSuppressed.current = true;
      setUser(null);
      setItems([]);
      setHasMore(false);
      selectedWorkOrderId.current = null;
      setSelected(null);
      setDetail(null);
      resetMaterialSession();
      setEditing(false);
      setSaveState("read-only");
      materialEditorRef.current = null;
      setMaterialEditor(null);
      setMaterialSaveNotice(null);
      setErrorState(null);
      setPhase("disconnected-auto-failed");
    } catch (error) {
      setRequestError(error, "disconnect");
    }
  }


  function disconnectSafely() {
    confirmDiscard(() => void disconnect());
  }

  async function loadMaterials(workOrderId: string, action: "initial" | "retry" | "more") {
    if (materialRequests.current.has(workOrderId)) return;
    const existing = materialCacheRef.current[workOrderId];
    if (action === "initial" && existing && existing.status !== "not-loaded") return;
    if (action === "more" && (!existing?.hasMore || !existing.nextCursor)) return;
    if (action === "retry" && existing?.status !== "error") return;

    const cursor = action === "more" ? existing?.nextCursor ?? null : action === "retry" ? existing?.failedCursor ?? null : null;
    const requestToken = ++materialRequestSequence.current;
    const sessionGeneration = materialSessionGeneration.current;
    materialRequests.current.set(workOrderId, requestToken);
    const pendingStatus: MaterialReadStatus = action === "retry" ? "retrying" : action === "more" ? "loading-more" : "loading";
    updateMaterialCache((current) => putBoundedMaterialEntry(current, workOrderId, {
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
      const [page, archivedPage] = await Promise.all([
        getWorkOrderMaterials(workOrderId, cursor, "active"),
        action === "more" ? Promise.resolve(null) : getWorkOrderMaterials(workOrderId, null, "archived"),
      ]);
      if (
        materialSessionGeneration.current !== sessionGeneration
        || materialRequests.current.get(workOrderId) !== requestToken
        || page.workOrderId !== workOrderId
      ) return;
      const merged: WorkOrderMaterialLine[] = cursor ? [...(existing?.items ?? [])] : [];
      const knownIds = new Set(merged.map((line) => line.id));
      for (const line of page.items) {
        if (!knownIds.has(line.id)) {
          knownIds.add(line.id);
          merged.push(line);
        }
      }
      updateMaterialCache((current) => putBoundedMaterialEntry(current, workOrderId, {
        status: merged.length === 0 ? "empty" : "loaded",
        items: merged,
        nextCursor: page.nextCursor,
        failedCursor: null,
        entityVersion: page.entityVersion,
        hasMore: page.hasMore,
        errorMessage: null,
        touchedAt: Date.now(),
        archivedStatus: archivedPage ? (archivedPage.items.length === 0 ? "empty" : "loaded") : existing?.archivedStatus,
        archivedItems: archivedPage?.items ?? existing?.archivedItems,
        archivedNextCursor: archivedPage?.nextCursor ?? existing?.archivedNextCursor,
        archivedHasMore: archivedPage?.hasMore ?? existing?.archivedHasMore,
        archivedTotalCount: archivedPage?.totalCount ?? existing?.archivedTotalCount,
        archivedErrorMessage: null,
      }));
    } catch (error) {
      if (
        materialSessionGeneration.current !== sessionGeneration
        || materialRequests.current.get(workOrderId) !== requestToken
      ) return;
      if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        setRequestError(error, "boot");
        return;
      }
      updateMaterialCache((current) => putBoundedMaterialEntry(current, workOrderId, {
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
      if (materialRequests.current.get(workOrderId) === requestToken) materialRequests.current.delete(workOrderId);
    }
  }

  async function loadMoreArchivedMaterials(workOrderId: string) {
    const existing = materialCacheRef.current[workOrderId];
    if (!existing?.archivedHasMore || !existing.archivedNextCursor || materialRequests.current.has(`${workOrderId}:archived`)) return;
    const requestKey = `${workOrderId}:archived`;
    const requestToken = ++materialRequestSequence.current;
    const sessionGeneration = materialSessionGeneration.current;
    materialRequests.current.set(requestKey, requestToken);
    updateMaterialCache((current) => putBoundedMaterialEntry(current, workOrderId, { ...existing, archivedStatus: "loading-more", touchedAt: Date.now() }));
    try {
      const page = await getWorkOrderMaterials(workOrderId, existing.archivedNextCursor, "archived");
      if (materialSessionGeneration.current !== sessionGeneration || materialRequests.current.get(requestKey) !== requestToken || selectedWorkOrderId.current !== workOrderId) return;
      const merged = [...(existing.archivedItems ?? [])];
      const knownIds = new Set(merged.map((line) => line.id));
      for (const line of page.items) if (!knownIds.has(line.id)) { knownIds.add(line.id); merged.push(line); }
      updateMaterialCache((current) => putBoundedMaterialEntry(current, workOrderId, {
        ...(current[workOrderId] ?? existing), archivedStatus: merged.length ? "loaded" : "empty",
        archivedItems: merged, archivedNextCursor: page.nextCursor, archivedHasMore: page.hasMore,
        archivedTotalCount: page.totalCount, archivedErrorMessage: null, touchedAt: Date.now(),
      }));
    } catch (error) {
      updateMaterialCache((current) => putBoundedMaterialEntry(current, workOrderId, {
        ...(current[workOrderId] ?? existing), archivedStatus: "error",
        archivedErrorMessage: materialErrorMessage(error), touchedAt: Date.now(),
      }));
    } finally {
      if (materialRequests.current.get(requestKey) === requestToken) materialRequests.current.delete(requestKey);
    }
  }

  function nextMaterialRequestIdentity(kind: "client" | "idempotency") {
    clientRequestCounter.current += 1;
    return `alpha51-mobile-material-${kind}-${Date.now()}-${clientRequestCounter.current}`;
  }

  function beginMaterialCreate() {
    if (!detail || detail.header.status !== "draft" || detail.revision.status !== "draft" || !user?.permissionCodes?.includes("workorder.update")) return;
    setEditing(false);
    setSaveState("read-only");
    setSaveMessage(null);
    const token = ++materialEditorSequence.current;
    const base = { ...EMPTY_MATERIAL_DRAFT };
    updateMaterialEditor(() => ({
      token,
      mode: "create",
      workOrderId: detail.header.id,
      materialLineId: null,
      base,
      draft: { ...base },
      fieldErrors: {},
      saveState: "editing",
      saveMessage: null,
      conflictVersion: null,
      idempotencyKey: nextMaterialRequestIdentity("idempotency"),
      committedNextVersion: null,
    }));
    setMaterialSaveNotice(null);
  }

  function beginMaterialEdit(line: WorkOrderMaterialLine) {
    if (
      !detail
      || detail.header.status !== "draft"
      || detail.revision.status !== "draft"
      || line.status !== "editing"
      || !user?.permissionCodes?.includes("workorder.update")
    ) return;
    setEditing(false);
    setSaveState("read-only");
    setSaveMessage(null);
    const token = ++materialEditorSequence.current;
    const base = materialDraftFromLine(line);
    updateMaterialEditor(() => ({
      token,
      mode: "edit",
      workOrderId: detail.header.id,
      materialLineId: line.id,
      base,
      draft: { ...base },
      fieldErrors: {},
      saveState: "editing",
      saveMessage: null,
      conflictVersion: null,
      idempotencyKey: "",
      committedNextVersion: null,
    }));
    setMaterialSaveNotice(null);
  }

  function changeMaterialDraft(field: keyof MaterialDraftFields, value: string) {
    updateMaterialEditor((current) => current ? {
      ...current,
      draft: { ...current.draft, [field]: value },
      fieldErrors: { ...current.fieldErrors, [field]: undefined },
      saveState: current.saveState === "conflict" ? "conflict" : "editing",
      saveMessage: current.saveState === "conflict" ? current.saveMessage : null,
    } : current);
  }

  function cancelMaterialEditor() {
    confirmDiscard(() => {
      materialEditorRef.current = null;
      setMaterialEditor(null);
    });
  }

  function applyRefreshedMaterialSnapshot(
    workOrderId: string,
    refreshed: WorkOrderDetailCore,
    page: Awaited<ReturnType<typeof getWorkOrderMaterials>>,
  ) {
    setDetail(refreshed);
    setBasicInfoDraft(draftFromDetail(refreshed));
    updateMaterialCache((current) => putBoundedMaterialEntry(current, workOrderId, {
      ...current[workOrderId],
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
    readonly token: number;
    readonly expectedVersion: number | null;
    readonly sessionGeneration: number;
  }) {
    const [refreshed, page] = await Promise.all([
      getWorkOrderDetail(input.workOrderId),
      getWorkOrderMaterials(input.workOrderId),
    ]);
    if (
      refreshed.header.id !== input.workOrderId
      || page.workOrderId !== input.workOrderId
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
    ) return false;
    applyRefreshedMaterialSnapshot(input.workOrderId, refreshed, page);
    return true;
  }

  async function executeMaterialLifecycle(line: WorkOrderMaterialLine, kind: "archive" | "restore") {
    const currentDetail = detail;
    if (
      !currentDetail
      || currentDetail.header.status !== "draft"
      || currentDetail.revision.status !== "draft"
      || !user?.permissionCodes?.includes("workorder.update")
      || materialLifecycleRequestInFlight.current
      || selectedWorkOrderId.current !== currentDetail.header.id
    ) return;
    const requestToken = ++materialLifecycleSequence.current;
    const sessionGeneration = materialSessionGeneration.current;
    materialLifecycleRequestInFlight.current = true;
    setMaterialLifecycleBusyId(line.id);
    setMaterialSaveNotice(kind === "archive" ? "원단을 삭제된 원단으로 이동하고 있습니다." : "원단을 복구하고 있습니다.");
    try {
      const command = {
        clientRequestId: nextMaterialRequestIdentity("client"),
        expectedVersion: currentDetail.header.entityVersion,
      };
      const result = kind === "archive"
        ? await archiveWorkOrderMaterial(currentDetail.header.id, line.id, command, nextMaterialRequestIdentity("idempotency"))
        : await restoreWorkOrderMaterial(currentDetail.header.id, line.id, command, nextMaterialRequestIdentity("idempotency"));
      const [refreshed, activePage, archivedPage] = await Promise.all([
        getWorkOrderDetail(currentDetail.header.id),
        getWorkOrderMaterials(currentDetail.header.id, null, "active"),
        getWorkOrderMaterials(currentDetail.header.id, null, "archived"),
      ]);
      if (
        result.nextVersion !== refreshed.header.entityVersion
        || activePage.entityVersion !== result.nextVersion
        || archivedPage.entityVersion !== result.nextVersion
        || refreshed.header.id !== currentDetail.header.id
      ) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 lifecycle 최신 상태를 확인할 수 없습니다." });
      if (
        materialSessionGeneration.current !== sessionGeneration
        || materialLifecycleSequence.current !== requestToken
        || selectedWorkOrderId.current !== currentDetail.header.id
      ) return;
      applyRefreshedMaterialSnapshot(currentDetail.header.id, refreshed, activePage);
      updateMaterialCache((current) => {
        const active = current[currentDetail.header.id];
        if (!active) return current;
        return putBoundedMaterialEntry(current, currentDetail.header.id, {
          ...active,
          archivedStatus: archivedPage.items.length ? "loaded" : "empty",
          archivedItems: archivedPage.items,
          archivedNextCursor: archivedPage.nextCursor,
          archivedHasMore: archivedPage.hasMore,
          archivedTotalCount: archivedPage.totalCount,
          archivedErrorMessage: null,
          touchedAt: Date.now(),
        });
      });
      setMaterialSaveNotice(kind === "archive" ? "원단을 삭제된 원단으로 이동했습니다." : "원단을 복구했습니다.");
    } catch (error) {
      if (materialSessionGeneration.current !== sessionGeneration || materialLifecycleSequence.current !== requestToken) return;
      setMaterialSaveNotice(error instanceof MobileApiError ? error.message : "원단 상태를 변경하지 못했습니다.");
    } finally {
      if (materialLifecycleSequence.current === requestToken) {
        materialLifecycleRequestInFlight.current = false;
        setMaterialLifecycleBusyId(null);
      }
    }
  }

  function requestArchiveMaterial(line: WorkOrderMaterialLine) {
    confirmDiscard(() => {
      Alert.alert(
        "원단 삭제",
        `“${line.name}” 원단을 삭제된 원단으로 이동합니다. 다시 복구할 수 있습니다.`,
        [
          { text: "취소", style: "cancel" },
          { text: "삭제된 원단으로 이동", style: "destructive", onPress: () => void executeMaterialLifecycle(line, "archive") },
        ],
      );
    });
  }

  function requestRestoreMaterial(line: WorkOrderMaterialLine) {
    confirmDiscard(() => {
      Alert.alert(
        "원단 복구",
        `“${line.name}” 원단을 기존 위치로 복구합니다.`,
        [
          { text: "취소", style: "cancel" },
          { text: "복구", onPress: () => void executeMaterialLifecycle(line, "restore") },
        ],
      );
    });
  }

  async function saveMaterial() {
    const editor = materialEditorRef.current;
    if (!detail || !editor || materialSaveRequestInFlight.current || editor.committedNextVersion !== null) return;
    if (selectedWorkOrderId.current !== editor.workOrderId || detail.header.id !== editor.workOrderId) return;
    const fieldErrors = validateMaterialDraft(editor.draft);
    if (Object.keys(fieldErrors).length > 0) {
      updateMaterialEditor((current) => current?.token === editor.token ? {
        ...current,
        fieldErrors,
        saveState: "validation-error",
        saveMessage: "입력값을 확인해 주세요.",
      } : current);
      return;
    }
    const normalizedDraft = normalizedMaterialDraft(editor.draft);
    const patch = materialPatch(editor.base, normalizedDraft);
    if (editor.mode === "edit" && Object.keys(patch).length === 0) return;

    materialSaveRequestInFlight.current = true;
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
        ? await createWorkOrderMaterial(editor.workOrderId, {
          clientRequestId: nextMaterialRequestIdentity("client"),
          expectedVersion,
          materialType: "fabric",
          ...normalizedDraft,
        }, editor.idempotencyKey)
        : await patchWorkOrderMaterial(editor.workOrderId, editor.materialLineId ?? "", {
          clientRequestId: nextMaterialRequestIdentity("client"),
          expectedVersion,
          patch,
        });
      committedNextVersion = saved.nextVersion;
      updateMaterialEditor((current) => current?.token === editor.token ? {
        ...current,
        base: normalizedDraft,
        draft: normalizedDraft,
        committedNextVersion,
        saveState: "saving",
      } : current);
      const applied = await refreshMaterialSnapshot({
        workOrderId: editor.workOrderId,
        token: editor.token,
        expectedVersion: saved.nextVersion,
        sessionGeneration,
      });
      if (!applied) return;
      materialEditorRef.current = null;
      setMaterialEditor(null);
      setMaterialSaveNotice(editor.mode === "create" ? "원단을 추가했습니다." : "원단을 저장했습니다.");
    } catch (error) {
      if (committedNextVersion !== null) {
        updateMaterialEditor((current) => current?.token === editor.token ? {
          ...current,
          base: normalizedDraft,
          draft: normalizedDraft,
          committedNextVersion,
          saveState: "refresh-error",
          saveMessage: "저장은 반영됐지만 최신 원단을 확인하지 못했습니다.",
        } : current);
      } else if (error instanceof MobileApiError && error.code === "VALIDATION_ERROR") {
        const mapped: MaterialEditorFieldErrors = {};
        for (const fieldError of error.fieldErrors) {
          const field = fieldError.field.replace(/^patch\./, "") as keyof MaterialDraftFields;
          if (field in editor.draft) mapped[field] = fieldError.message;
        }
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, fieldErrors: mapped, saveState: "validation-error", saveMessage: "입력값을 확인해 주세요." } : current);
      } else if (error instanceof MobileApiError && error.code === "CONFLICT") {
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, conflictVersion: error.entityVersion, saveState: "conflict", saveMessage: "다른 변경이 먼저 저장되었습니다." } : current);
      } else if (error instanceof MobileApiError && (error.code === "LOCKED" || error.code === "REVISION_MISMATCH")) {
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "locked", saveMessage: "현재 상태에서는 원단을 수정할 수 없습니다." } : current);
      } else if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        setRequestError(error, "boot");
      } else {
        updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "save-error", saveMessage: error instanceof MobileApiError ? error.message : "원단을 저장하지 못했습니다." } : current);
      }
    } finally {
      materialSaveRequestInFlight.current = false;
    }
  }

  function reloadLatestMaterial() {
    const editor = materialEditorRef.current;
    if (!editor || materialSaveRequestInFlight.current) return;
    const load = async () => {
      materialSaveRequestInFlight.current = true;
      const sessionGeneration = materialSessionGeneration.current;
      updateMaterialEditor((current) => current?.token === editor.token ? { ...current, saveState: "saving", saveMessage: "최신 원단을 확인하고 있습니다." } : current);
      try {
        const applied = await refreshMaterialSnapshot({
          workOrderId: editor.workOrderId,
          token: editor.token,
          expectedVersion: editor.committedNextVersion,
          sessionGeneration,
        });
        if (!applied) return;
        materialEditorRef.current = null;
        setMaterialEditor(null);
        setMaterialSaveNotice(editor.committedNextVersion === null ? null : "저장된 원단을 확인했습니다.");
      } catch (error) {
        updateMaterialEditor((current) => current?.token === editor.token ? {
          ...current,
          saveState: editor.committedNextVersion === null ? "conflict" : "refresh-error",
          saveMessage: error instanceof MobileApiError ? error.message : "최신 원단을 불러오지 못했습니다.",
        } : current);
      } finally {
        materialSaveRequestInFlight.current = false;
      }
    };
    if (editor.committedNextVersion !== null) void load();
    else {
      Alert.alert("최신 원단을 불러올까요?", "현재 입력한 변경사항은 버려집니다.", [
        { text: "계속 편집", style: "cancel" },
        { text: "변경사항 버리기", style: "destructive", onPress: () => void load() },
      ]);
    }
  }

  function beginBasicInfoEdit() {
    if (!detail || detail.header.status !== "draft" || detail.revision.status !== "draft") return;
    materialEditorRef.current = null;
    setMaterialEditor(null);
    setMaterialSaveNotice(null);
    setBasicInfoDraft(draftFromDetail(detail));
    setBasicInfoErrors({});
    setConflictVersion(null);
    setSaveState("editing");
    setSaveMessage(null);
    setEditing(true);
  }

  function changeBasicInfoDraft(field: keyof BasicInfoDraft, value: string) {
    setBasicInfoDraft((current) => ({ ...current, [field]: value }));
    setBasicInfoErrors((current) => ({ ...current, [field]: undefined }));
    if (saveState !== "saving") setSaveState("editing");
    setSaveMessage(null);
  }

  function cancelBasicInfoEdit() {
    confirmDiscard(() => {
      if (detail) setBasicInfoDraft(draftFromDetail(detail));
      setBasicInfoErrors({});
      setConflictVersion(null);
      setSaveState("read-only");
      setSaveMessage(null);
      setEditing(false);
    });
  }

  function nextClientRequestId() {
    clientRequestCounter.current += 1;
    return `alpha46-mobile-basic-${Date.now()}-${clientRequestCounter.current}`;
  }

  async function saveBasicInfo() {
    if (!detail || !selected || !editing || !basicInfoDirty || saveRequestInFlight.current) return;
    const fieldErrors = validateBasicInfoDraft(basicInfoDraft);
    if (Object.keys(fieldErrors).length > 0) {
      setBasicInfoErrors(fieldErrors);
      setSaveState("validation-error");
      setSaveMessage("입력값을 확인해 주세요.");
      return;
    }

    const patch: { productName?: string; dueDate?: string | null; totalQuantity?: number } = {};
    const productName = basicInfoDraft.productName.trim();
    if (productName !== detail.header.productName) patch.productName = productName;
    const dueDate = basicInfoDraft.dueDate || null;
    if (dueDate !== detail.header.dueDate) patch.dueDate = dueDate;
    const totalQuantity = Number(basicInfoDraft.totalQuantity);
    if (totalQuantity !== detail.header.totalQuantity) patch.totalQuantity = totalQuantity;
    if (Object.keys(patch).length === 0) return;

    saveRequestInFlight.current = true;
    setBasicInfoErrors({});
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const saved = await patchWorkOrderBasicInfo(selected.workOrderId, {
        clientRequestId: nextClientRequestId(),
        expectedVersion: detail.header.entityVersion,
        patch,
      });
      const refreshed = await getWorkOrderDetail(selected.workOrderId);
      if (refreshed.header.entityVersion !== saved.nextVersion) {
        throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "저장 후 최신 버전을 확인할 수 없습니다." });
      }
      setDetail(refreshed);
      setBasicInfoDraft(draftFromDetail(refreshed));
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
      setSaveState("saved");
      setSaveMessage("저장됨");
    } catch (error) {
      if (error instanceof MobileApiError && error.code === "VALIDATION_ERROR") {
        const mapped: BasicInfoFieldErrors = {};
        for (const fieldError of error.fieldErrors) {
          if (fieldError.field.endsWith("productName")) mapped.productName = fieldError.message;
          if (fieldError.field.endsWith("dueDate")) mapped.dueDate = fieldError.message;
          if (fieldError.field.endsWith("totalQuantity")) mapped.totalQuantity = fieldError.message;
        }
        setBasicInfoErrors(mapped);
        setSaveState("validation-error");
        setSaveMessage("입력값을 확인해 주세요.");
      } else if (error instanceof MobileApiError && error.code === "CONFLICT") {
        setConflictVersion(error.entityVersion);
        setSaveState("conflict");
        setSaveMessage("다른 변경이 먼저 저장되었습니다.");
      } else if (error instanceof MobileApiError && (error.code === "LOCKED" || error.code === "REVISION_MISMATCH")) {
        setEditing(false);
        setSaveState("locked");
        setSaveMessage("현재 상태에서는 수정할 수 없습니다.");
      } else if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        setRequestError(error, "boot");
      } else {
        setSaveState("save-error");
        setSaveMessage(`${error instanceof MobileApiError ? error.message : "저장하지 못했습니다."}${error instanceof MobileApiError && error.correlationId ? ` · 오류 참조 ${error.correlationId}` : ""}`);
      }
    } finally {
      saveRequestInFlight.current = false;
    }
  }

  function reloadLatestBasicInfo() {
    if (!selected || detailRequestInFlight.current) return;
    const load = async () => {
      detailRequestInFlight.current = true;
      try {
        const refreshed = await getWorkOrderDetail(selected.workOrderId);
        setDetail(refreshed);
        setBasicInfoDraft(draftFromDetail(refreshed));
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
    if (basicInfoDirty || conflictVersion !== null) {
      Alert.alert("최신 내용을 불러올까요?", "현재 입력한 변경사항은 버려집니다.", [
        { text: "계속 편집", style: "cancel" },
        { text: "변경사항 버리기", style: "destructive", onPress: () => void load() },
      ]);
    } else void load();
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
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color="#9b4a27" size="large" /><Text style={styles.loadingText}>연결 상태를 확인하고 있습니다.</Text></View></SafeAreaView>;
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
    <View style={styles.center}><ActivityIndicator color="#9b4a27" /><Text style={styles.loadingText}>제작 카드 상세를 불러오고 있습니다.</Text></View>
  ) : phase === "recoverable-error" && errorState?.retryTarget === "detail" ? (
    <ErrorPanel error={errorState} onRetry={retry} onReturnToList={returnToList} />
  ) : detail ? (
    <WorkOrderDetailOverview
      canEdit={detail.header.status === "draft" && detail.revision.status === "draft" && Boolean(user?.permissionCodes?.includes("workorder.update"))}
      canEditMaterials={detail.header.status === "draft" && detail.revision.status === "draft" && Boolean(user?.permissionCodes?.includes("workorder.update"))}
      detail={detail}
      dirty={basicInfoDirty}
      draft={basicInfoDraft}
      editing={editing}
      fieldErrors={basicInfoErrors}
      materialEditor={materialEditor}
      materialEditorDirty={materialEditorDirty}
      archivedMaterials={archivedMaterialState(materialCache[detail.header.id])}
      archivedMaterialCount={materialCache[detail.header.id]?.archivedTotalCount ?? 0}
      materialLifecycleBusyId={materialLifecycleBusyId}
      onBack={returnToList}
      onBeginEdit={beginBasicInfoEdit}
      onBeginMaterialCreate={beginMaterialCreate}
      onBeginMaterialEdit={beginMaterialEdit}
      onArchiveMaterial={requestArchiveMaterial}
      onCancelEdit={cancelBasicInfoEdit}
      onCancelMaterialEditor={cancelMaterialEditor}
      onChangeDraft={changeBasicInfoDraft}
      onChangeMaterialDraft={changeMaterialDraft}
      onReloadLatest={reloadLatestBasicInfo}
      onReloadLatestMaterial={reloadLatestMaterial}
      materials={materialCache[detail.header.id] ?? EMPTY_MATERIAL_STATE}
      materialIdentityKey={detail.header.id}
      materialSaveNotice={materialSaveNotice}
      onLoadMoreMaterials={() => void loadMaterials(detail.header.id, "more")}
      onLoadMoreArchivedMaterials={() => void loadMoreArchivedMaterials(detail.header.id)}
      onOpenMaterials={() => void loadMaterials(detail.header.id, "initial")}
      onRequestSectionChange={confirmDiscard}
      onRetryMaterials={() => void loadMaterials(detail.header.id, "retry")}
      onRestoreMaterial={requestRestoreMaterial}
      onSave={() => void saveBasicInfo()}
      onSaveMaterial={() => void saveMaterial()}
      phone={!tablet}
      saveMessage={saveMessage}
      saveState={saveState}
    />
  ) : (
    <View style={styles.placeholder}><Text style={styles.placeholderTitle}>제작 카드를 선택하세요.</Text><Text style={styles.placeholderBody}>왼쪽 목록에서 카드를 선택하면 실제 상세 개요가 표시됩니다.</Text></View>
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

        {globalError && errorState ? <ErrorPanel error={errorState} onRetry={retry} /> : tablet ? (
          <View style={styles.split}>
            <View style={styles.listPane}>
              <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={selected?.workOrderId ?? null} loading={phase === "authenticated-loading-list"} onRefresh={loadListSafely} onSelect={selectItemSafely} />
            </View>
            <View style={styles.detailPane}>{detailPane}</View>
          </View>
        ) : selected ? (
          <View style={styles.phoneBody}>{detailPane}</View>
        ) : (
          <View style={styles.phoneBody}>
            <WorkOrderListScreen items={items} hasMore={hasMore} selectedId={null} loading={phase === "authenticated-loading-list"} onRefresh={loadListSafely} onSelect={selectItemSafely} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ErrorPanel({ error, onRetry, onReturnToList }: { readonly error: ErrorState; readonly onRetry: () => void; readonly onReturnToList?: () => void }) {
  return (
    <View style={styles.errorPanel}>
      {onReturnToList ? (
        <Pressable accessibilityLabel="제작 카드 목록으로 돌아가기" accessibilityRole="button" onPress={onReturnToList} style={({ pressed }) => [styles.errorBack, pressed && styles.pressed]}>
          <ChevronLeft color="#3f352d" size={22} /><Text style={styles.errorBackText}>뒤로가기</Text>
        </Pressable>
      ) : null}
      <Text accessibilityRole="alert" style={styles.errorTitle}>{error.message}</Text>
      <Text style={styles.errorBody}>{error.guidance}</Text>
      <Text style={styles.errorPolicy}>자동으로 다시 요청하지 않습니다.</Text>
      {error.correlationId ? <Text selectable style={styles.correlation}>오류 참조 {error.correlationId}</Text> : null}
      <View style={styles.errorActions}>
        {onReturnToList ? (
          <Pressable accessibilityLabel="제작 카드 목록으로" accessibilityRole="button" onPress={onReturnToList} style={({ pressed }) => [styles.returnToList, pressed && styles.pressed]}><Text style={styles.returnToListText}>목록으로</Text></Pressable>
        ) : null}
        <Pressable accessibilityLabel="제작 카드 상세 다시 시도" accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>다시 시도</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#f3eee4", flex: 1 },
  app: { alignSelf: "center", flex: 1, maxWidth: 1180, paddingHorizontal: 14, width: "100%" },
  appTablet: { paddingHorizontal: 22 },
  connectPage: { flex: 1, justifyContent: "center", padding: 18 },
  header: { alignItems: "center", borderBottomColor: "#d9cfc2", borderBottomWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingVertical: 12 },
  headerMain: { flex: 1, minWidth: 0 },
  brand: { color: "#9b4a27", fontFamily: WAFL_FONTS.black, fontSize: 18, letterSpacing: 1.5 },
  context: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 14, marginTop: 1 },
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
