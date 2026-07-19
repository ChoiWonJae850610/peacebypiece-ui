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
import WorkOrderListScreen from "@/components/WorkOrderListScreen";
import { WAFL_FONTS } from "@/constants/fonts";
import {
  assertMobileApiOrigin,
  connectTailscaleDeveloper,
  disconnectMobileSession,
  exchangeMobileConnectCode,
  getCurrentMobileUser,
  getWorkOrderDetail,
  getWorkOrderList,
  patchWorkOrderBasicInfo,
} from "@/lib/apiClient";
import { MobileApiError, type MobileCurrentUser, type WorkOrderDetailCore, type WorkOrderListItem } from "@/lib/apiTypes";

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
  const detailRequestInFlight = useRef(false);
  const saveRequestInFlight = useRef(false);
  const clientRequestCounter = useRef(0);
  const autoConnectInFlight = useRef(false);
  const manualDisconnectSuppressed = useRef(false);
  const bootStarted = useRef(false);

  const dirty = detail ? (
    basicInfoDraft.productName !== detail.header.productName
    || basicInfoDraft.dueDate !== (detail.header.dueDate ?? "")
    || basicInfoDraft.totalQuantity !== String(detail.header.totalQuantity)
  ) : false;

  const setRequestError = useCallback((error: unknown, retryTarget: ErrorState["retryTarget"]) => {
    if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
      setUser(null);
      setItems([]);
      setSelected(null);
      setDetail(null);
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
  }, []);

  const loadList = useCallback(async () => {
    setErrorState(null);
    setPhase("authenticated-loading-list");
    try {
      const page = await getWorkOrderList();
      setItems(page.items);
      setHasMore(page.hasMore);
      setSelected(null);
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
    setSelected(null);
    setDetail(null);
    setErrorState(null);
    setEditing(false);
    setBasicInfoErrors({});
    setSaveState("read-only");
    setSaveMessage(null);
    setPhase("list-ready");
  }

  function confirmDiscard(onDiscard: () => void) {
    if (saveRequestInFlight.current) {
      Alert.alert("저장 중입니다.", "저장이 끝난 뒤 이동해 주세요.");
      return;
    }
    if (!editing || !dirty) {
      onDiscard();
      return;
    }
    Alert.alert(
      "저장하지 않은 변경사항이 있습니다.",
      "변경사항을 버리면 입력한 내용은 복구되지 않습니다.",
      [
        { text: "계속 편집", style: "cancel" },
        { text: "변경사항 버리기", style: "destructive", onPress: onDiscard },
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
      setSelected(null);
      setDetail(null);
      setEditing(false);
      setSaveState("read-only");
      setErrorState(null);
      setPhase("disconnected-auto-failed");
    } catch (error) {
      setRequestError(error, "disconnect");
    }
  }


  function disconnectSafely() {
    confirmDiscard(() => void disconnect());
  }

  function beginBasicInfoEdit() {
    if (!detail || detail.header.status !== "draft" || detail.revision.status !== "draft") return;
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
    if (!detail || !selected || !editing || !dirty || saveRequestInFlight.current) return;
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
    if (dirty || conflictVersion !== null) {
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
      detail={detail}
      dirty={dirty}
      draft={basicInfoDraft}
      editing={editing}
      fieldErrors={basicInfoErrors}
      onBack={returnToList}
      onBeginEdit={beginBasicInfoEdit}
      onCancelEdit={cancelBasicInfoEdit}
      onChangeDraft={changeBasicInfoDraft}
      onReloadLatest={reloadLatestBasicInfo}
      onSave={() => void saveBasicInfo()}
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
            <Text style={styles.readOnly}>dev/test 읽기 전용</Text>
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
