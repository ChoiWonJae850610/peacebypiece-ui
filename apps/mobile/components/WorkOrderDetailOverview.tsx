import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { ChevronLeft, ImageIcon, LockKeyhole, PencilLine } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import WorkOrderMaterialsReadOnly, { type MaterialReadViewState } from "@/components/WorkOrderMaterialsReadOnly";
import WorkOrderMaterialEditor, { type MaterialEditorViewState } from "@/components/WorkOrderMaterialEditor";
import type { MaterialDraftFields, WorkOrderDetailCore, WorkOrderMaterialLine } from "@/lib/apiTypes";
import {
  formatProductType,
  formatWorkOrderStatus,
} from "@/lib/workOrderDisplay";

const SECTION_TABS = [
  { id: "media", label: "이미지·첨부", count: (detail: WorkOrderDetailCore) => detail.tabCounts.images + detail.tabCounts.attachments },
  { id: "sizes", label: "사이즈·색상", count: (detail: WorkOrderDetailCore) => detail.tabCounts.sizes + detail.tabCounts.colors },
  { id: "fabric", label: "원단", count: (detail: WorkOrderDetailCore) => detail.tabCounts.fabric },
  { id: "accessory", label: "부자재", count: (detail: WorkOrderDetailCore) => detail.tabCounts.accessory },
  { id: "flow", label: "제작 플로우", count: (detail: WorkOrderDetailCore) => detail.tabCounts.processes },
  { id: "output", label: "출력·공유", count: (detail: WorkOrderDetailCore) => detail.tabCounts.documents },
] as const;

function formatAmount(value: string, currency: string) {
  const normalized = value.trim();
  const matched = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!matched) return `${normalized} ${currency}`;
  const [, sign, integer, fraction] = matched;
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${grouped}${fraction ? `.${fraction}` : ""} ${currency}`;
}

function MiniStat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function MetricLine({ label, value, emphasized = false }: { readonly label: string; readonly value: string; readonly emphasized?: boolean }) {
  return (
    <View style={styles.metricLine}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text selectable style={[styles.metricValue, emphasized && styles.metricValueEmphasized]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ReadinessPanel({ detail }: { readonly detail: WorkOrderDetailCore }) {
  const blockers = detail.header.readiness.hardBlockers;
  const warnings = detail.header.readiness.warnings;
  const ready = detail.header.readiness.canIssue && blockers.length === 0;

  return (
    <View style={[styles.nextCheckPanel, ready ? styles.nextCheckReady : styles.nextCheckWarning]}>
      <Text style={styles.nextCheckEyebrow}>다음 확인</Text>
      <View style={styles.nextCheckBody}>
        <View style={styles.nextCheckTitleRow}>
          <Text style={styles.nextCheckTitle}>{ready ? "발행 준비 가능" : `발행 전 확인 ${blockers.length}건`}</Text>
          {warnings.length > 0 ? <Text style={styles.warningCount}>주의 {warnings.length}건</Text> : null}
        </View>
        {blockers.slice(0, 3).map((item) => <Text key={item.code} style={styles.blocker}>• {item.message}</Text>)}
        {blockers.length > 3 ? <Text style={styles.more}>외 {blockers.length - 3}건</Text> : null}
        {warnings.slice(0, 3).map((item) => <Text key={item.code} style={styles.warning}>• {item.message}</Text>)}
        {warnings.length > 3 ? <Text style={styles.more}>외 {warnings.length - 3}건</Text> : null}
      </View>
    </View>
  );
}

export type BasicInfoDraft = {
  readonly productName: string;
  readonly dueDate: string;
  readonly totalQuantity: string;
};

export type BasicInfoFieldErrors = Partial<Record<keyof BasicInfoDraft, string>>;
export type BasicInfoSaveState = "read-only" | "editing" | "saving" | "saved" | "validation-error" | "conflict" | "locked" | "save-error";

type Props = {
  readonly detail: WorkOrderDetailCore;
  readonly phone: boolean;
  readonly onBack: () => void;
  readonly canEdit: boolean;
  readonly editing: boolean;
  readonly dirty: boolean;
  readonly draft: BasicInfoDraft;
  readonly fieldErrors: BasicInfoFieldErrors;
  readonly saveState: BasicInfoSaveState;
  readonly saveMessage: string | null;
  readonly onBeginEdit: () => void;
  readonly onChangeDraft: (field: keyof BasicInfoDraft, value: string) => void;
  readonly onCancelEdit: () => void;
  readonly onSave: () => void;
  readonly onReloadLatest: () => void;
  readonly materials: MaterialReadViewState;
  readonly materialIdentityKey: string;
  readonly canEditMaterials: boolean;
  readonly materialEditor: MaterialEditorViewState | null;
  readonly materialEditorDirty: boolean;
  readonly materialSaveNotice: string | null;
  readonly onBeginMaterialCreate: () => void;
  readonly onBeginMaterialEdit: (line: WorkOrderMaterialLine) => void;
  readonly onChangeMaterialDraft: (field: keyof MaterialDraftFields, value: string) => void;
  readonly onCancelMaterialEditor: () => void;
  readonly onSaveMaterial: () => void;
  readonly onReloadLatestMaterial: () => void;
  readonly onRequestSectionChange: (onProceed: () => void) => void;
  readonly onOpenMaterials: () => void;
  readonly onRetryMaterials: () => void;
  readonly onLoadMoreMaterials: () => void;
};

function BasicInfoEditor(props: Pick<Props, "draft" | "dirty" | "fieldErrors" | "saveState" | "saveMessage" | "onChangeDraft" | "onCancelEdit" | "onSave" | "onReloadLatest">) {
  const saving = props.saveState === "saving";
  const conflict = props.saveState === "conflict";
  const locked = props.saveState === "locked";
  return (
    <View style={styles.editPanel}>
      <View style={styles.editHeadingRow}>
        <View style={styles.editHeadingText}>
          <Text style={styles.editTitle}>기본정보 수정</Text>
          <Text style={styles.editCaption}>제품명, 납기, 총수량만 수정할 수 있습니다.</Text>
        </View>
        <Text style={styles.unsavedBadge}>{props.dirty ? "저장 전" : "변경 없음"}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>제품명</Text>
        <TextInput
          accessibilityLabel="제품명 입력"
          editable={!saving && !locked}
          maxLength={200}
          onChangeText={(value) => props.onChangeDraft("productName", value)}
          placeholder="제품명을 입력하세요"
          returnKeyType="next"
          style={[styles.input, props.fieldErrors.productName && styles.inputInvalid]}
          value={props.draft.productName}
        />
        {props.fieldErrors.productName ? <Text style={styles.fieldError}>{props.fieldErrors.productName}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>납기</Text>
          <Pressable
            accessibilityLabel="납기 없음으로 설정"
            accessibilityRole="button"
            disabled={saving || locked}
            onPress={() => props.onChangeDraft("dueDate", "")}
          >
            <Text style={styles.clearDate}>납기 없음</Text>
          </Pressable>
        </View>
        <TextInput
          accessibilityLabel="납기 입력"
          autoCapitalize="none"
          editable={!saving && !locked}
          maxLength={10}
          onChangeText={(value) => props.onChangeDraft("dueDate", value)}
          placeholder="YYYY-MM-DD"
          returnKeyType="next"
          style={[styles.input, props.fieldErrors.dueDate && styles.inputInvalid]}
          value={props.draft.dueDate}
        />
        {props.fieldErrors.dueDate ? <Text style={styles.fieldError}>{props.fieldErrors.dueDate}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>총수량</Text>
        <TextInput
          accessibilityLabel="총수량 입력"
          editable={!saving && !locked}
          keyboardType="number-pad"
          maxLength={9}
          onChangeText={(value) => props.onChangeDraft("totalQuantity", value)}
          placeholder="0"
          returnKeyType="done"
          style={[styles.input, props.fieldErrors.totalQuantity && styles.inputInvalid]}
          value={props.draft.totalQuantity}
        />
        {props.fieldErrors.totalQuantity ? <Text style={styles.fieldError}>{props.fieldErrors.totalQuantity}</Text> : null}
      </View>

      {props.saveMessage ? <Text accessibilityRole="alert" style={[styles.saveMessage, conflict && styles.saveMessageConflict]}>{props.saveMessage}</Text> : null}
      {conflict || locked ? (
        <Pressable accessibilityRole="button" onPress={props.onReloadLatest} style={styles.reloadLatest}>
          <Text style={styles.reloadLatestText}>최신 내용 불러오기</Text>
        </Pressable>
      ) : null}
      <View style={styles.editActions}>
        <Pressable accessibilityRole="button" disabled={saving} onPress={props.onCancelEdit} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>취소</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!props.dirty || saving || locked}
          onPress={props.onSave}
          style={[styles.saveButton, (!props.dirty || saving || locked) && styles.saveButtonDisabled]}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : null}
          <Text style={styles.saveButtonText}>{saving ? "저장 중" : "저장"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function WorkOrderDetailOverview(props: Props) {
  const { detail, phone, onBack } = props;
  const [activeSection, setActiveSection] = useState<"overview" | "fabric">("overview");
  const { width } = useWindowDimensions();
  const { header } = detail;
  const productType = formatProductType(header.productTypeAlias, header.productTypeCode);
  const currency = detail.amounts.currency;
  const compactPhoneHero = phone && width < 390;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.navigationBar}>
        {phone ? (
          <Pressable
            accessibilityLabel="제작 카드 목록으로 돌아가기"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ChevronLeft color="#3f352d" size={22} />
            <Text style={styles.backText}>목록</Text>
          </Pressable>
        ) : <View />}
        <View style={styles.navigationActions}>
          {props.canEdit && !props.editing ? (
            <Pressable
              accessibilityLabel="제작 카드 기본정보 수정"
              accessibilityRole="button"
              onPress={() => {
                props.onRequestSectionChange(() => {
                  setActiveSection("overview");
                  props.onBeginEdit();
                });
              }}
              style={styles.editEntry}
            >
              <PencilLine color="#874423" size={15} />
              <Text style={styles.editEntryText}>기본정보 수정</Text>
            </Pressable>
          ) : null}
          <Text style={styles.readOnly}>{props.canEdit ? "제작 카드" : "제작 카드 · 읽기 전용"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View testID="production-card-sheet" style={styles.productionCardSheet}>
          <View style={[styles.hero, compactPhoneHero && styles.heroCompactPhone]}>
            <View
              accessibilityLabel={`대표 이미지 준비 중, 이미지 ${detail.tabCounts.images}건`}
              style={[styles.mediaFrame, compactPhoneHero && styles.mediaFrameCompactPhone, !phone && styles.mediaFrameTablet]}
            >
              <ImageIcon color="#6f6255" size={phone ? 26 : 34} strokeWidth={1.5} />
              <Text style={styles.mediaLabel}>대표 이미지 준비 중</Text>
              <Text style={styles.mediaCount}>이미지 {detail.tabCounts.images}</Text>
            </View>

            <View style={styles.heroText}>
              <View style={styles.statusRow}>
                <Text style={styles.statusBadge}>{formatWorkOrderStatus(header.status)}</Text>
                <Text style={styles.revision}>Revision R{header.currentRevisionNumber}</Text>
              </View>
              <Text accessibilityRole="header" style={[styles.title, compactPhoneHero && styles.titleCompactPhone]}>{header.productName}</Text>
              <Text numberOfLines={2} style={styles.meta}>{productType} · {header.seasonCode ?? "미지정"} · {header.itemCode ?? "미지정"}</Text>
            </View>
          </View>

          {props.editing ? (
            <BasicInfoEditor
              dirty={props.dirty}
              draft={props.draft}
              fieldErrors={props.fieldErrors}
              onCancelEdit={props.onCancelEdit}
              onChangeDraft={props.onChangeDraft}
              onReloadLatest={props.onReloadLatest}
              onSave={props.onSave}
              saveMessage={props.saveMessage}
              saveState={props.saveState}
            />
          ) : props.saveState === "saved" && props.saveMessage ? (
            <Text accessibilityRole="alert" style={styles.savedBanner}>{props.saveMessage}</Text>
          ) : props.saveState === "locked" && props.saveMessage ? (
            <View style={styles.lockedBanner}>
              <Text accessibilityRole="alert" style={styles.lockedBannerText}>{props.saveMessage}</Text>
              <Pressable accessibilityRole="button" onPress={props.onReloadLatest} style={styles.reloadLatest}>
                <Text style={styles.reloadLatestText}>최신 내용 불러오기</Text>
              </Pressable>
            </View>
          ) : !props.canEdit && (header.status !== "draft" || detail.revision.status !== "draft") ? (
            <Text style={styles.lockedNotice}>발행된 제작 카드는 읽기 전용입니다.</Text>
          ) : null}

          <View style={[styles.summaryGrid, !phone && styles.summaryGridTablet]}>
            <MiniStat label="총 수량" value={`${header.totalQuantity.toLocaleString("ko-KR")}벌`} />
            <MiniStat label="납기" value={header.dueDate ?? "미정"} />
            <MiniStat label="한벌 단가" value={formatAmount(detail.amounts.unitPrice, currency)} />
            <MiniStat label="총 예상" value={formatAmount(detail.amounts.estimatedTotal, currency)} />
          </View>

          <View style={styles.tabRailFrame}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRail}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: activeSection === "overview" }}
                onPress={() => props.onRequestSectionChange(() => setActiveSection("overview"))}
                style={[styles.tab, activeSection === "overview" && styles.tabSelected]}
              >
                <Text style={[styles.tabText, activeSection === "overview" && styles.tabTextSelected]}>개요</Text>
                <View style={[styles.tabUnderline, activeSection === "overview" && styles.tabUnderlineSelected]} />
              </Pressable>
              {SECTION_TABS.map((tab) => tab.id === "fabric" ? (
                <Pressable
                  key={tab.id}
                  accessibilityLabel={`원단 ${tab.count(detail)}건`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeSection === "fabric" }}
                  onPress={() => props.onRequestSectionChange(() => {
                    setActiveSection("fabric");
                    props.onOpenMaterials();
                  })}
                  style={[styles.tab, activeSection === "fabric" && styles.tabSelected]}
                >
                  <View style={styles.tabLabelRow}>
                    <Text style={[styles.tabText, activeSection === "fabric" && styles.tabTextSelected]}>{tab.label}</Text>
                    <Text style={styles.tabCount}>{tab.count(detail)}</Text>
                  </View>
                  <View style={[styles.tabUnderline, activeSection === "fabric" && styles.tabUnderlineSelected]} />
                </Pressable>
              ) : (
                <Pressable
                  key={tab.id}
                  accessibilityLabel={`${tab.label}, 다음 단계에서 연결 예정`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                  disabled
                  style={styles.tab}
                >
                  <View style={styles.tabLabelRow}>
                    <Text style={styles.tabText}>{tab.label}</Text>
                    <Text style={styles.tabCount}>{tab.count(detail)}</Text>
                    <LockKeyhole color="#8f857b" size={11} />
                  </View>
                  <View style={styles.tabUnderline} />
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.tabNotice}>원단 외 다른 탭은 다음 단계에서 연결 예정입니다.</Text>
          </View>

          {activeSection === "overview" ? (
            <View style={styles.overviewSection}>
              <ReadinessPanel detail={detail} />
              <Section title="금액 요약">
                <MetricLine label="원단 총액" value={formatAmount(detail.amounts.fabricTotal, currency)} />
                <MetricLine label="부자재 총액" value={formatAmount(detail.amounts.accessoryTotal, currency)} />
                <MetricLine label="공정 총액" value={formatAmount(detail.amounts.processTotal, currency)} />
                <MetricLine label="한벌 단가" value={formatAmount(detail.amounts.unitPrice, currency)} />
                <MetricLine emphasized label="총 예상" value={formatAmount(detail.amounts.estimatedTotal, currency)} />
              </Section>
            </View>
          ) : props.materialEditor ? (
            <WorkOrderMaterialEditor
              dirty={props.materialEditorDirty}
              onCancel={props.onCancelMaterialEditor}
              onChange={props.onChangeMaterialDraft}
              onReloadLatest={props.onReloadLatestMaterial}
              onSave={props.onSaveMaterial}
              state={props.materialEditor}
            />
          ) : (
            <WorkOrderMaterialsReadOnly
              canEdit={props.canEditMaterials}
              key={props.materialIdentityKey}
              onAdd={props.onBeginMaterialCreate}
              onEdit={props.onBeginMaterialEdit}
              onLoadMore={props.onLoadMoreMaterials}
              onRetry={props.onRetryMaterials}
              saveNotice={props.materialSaveNotice}
              state={props.materials}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  navigationBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 44, marginBottom: 8 },
  navigationActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  editEntry: { alignItems: "center", backgroundColor: "#fff7ec", borderColor: "#d9bda7", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 40, paddingHorizontal: 10 },
  editEntryText: { color: "#874423", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  backButton: { alignItems: "center", flexDirection: "row", minHeight: 44, paddingRight: 8 },
  backText: { color: "#3f352d", fontFamily: WAFL_FONTS.semibold, fontSize: 14 },
  readOnly: { color: "#6d6257", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  pressed: { opacity: 0.68 },
  scrollContent: { paddingBottom: 42 },
  productionCardSheet: { backgroundColor: "#fffdf8", borderColor: "#eadfce", borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  hero: { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 10 },
  heroCompactPhone: { gap: 8, paddingHorizontal: 10 },
  mediaFrame: { alignItems: "center", backgroundColor: "#efe4d3", borderRadius: 12, flexShrink: 0, height: 96, justifyContent: "center", overflow: "hidden", padding: 7, position: "relative", width: 80 },
  mediaFrameCompactPhone: { height: 90, width: 72 },
  mediaFrameTablet: { height: 148, width: 132 },
  mediaLabel: { bottom: 7, color: "#51483e", fontFamily: WAFL_FONTS.semibold, fontSize: 8, left: 5, lineHeight: 11, position: "absolute", right: 5, textAlign: "center" },
  mediaCount: { backgroundColor: "rgba(255, 250, 242, 0.86)", borderRadius: 999, color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, position: "absolute", right: 6, top: 6 },
  heroText: { flex: 1, flexGrow: 1, flexShrink: 1, gap: 6, justifyContent: "center", minWidth: 0 },
  statusRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7 },
  statusBadge: { backgroundColor: "#23375a", borderRadius: 999, color: "#ffffff", fontFamily: WAFL_FONTS.bold, fontSize: 11, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4 },
  revision: { color: "#6d6257", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  title: { color: "#141f33", flexShrink: 1, fontFamily: WAFL_FONTS.black, fontSize: 20, lineHeight: 26, minWidth: 0 },
  titleCompactPhone: { fontSize: 18, lineHeight: 24 },
  meta: { color: "#4f463f", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 17 },
  editPanel: { backgroundColor: "#fbf4e9", borderColor: "#e4d3bf", borderRadius: 12, borderWidth: 1, gap: 11, marginBottom: 12, marginHorizontal: 12, padding: 12 },
  editHeadingRow: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  editHeadingText: { flex: 1, minWidth: 0 },
  editTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 15 },
  editCaption: { color: "#75695e", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 15, marginTop: 2 },
  unsavedBadge: { backgroundColor: "#efe2d2", borderRadius: 999, color: "#76503b", fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4 },
  inputGroup: { gap: 4 },
  inputLabelRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  inputLabel: { color: "#51483e", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  clearDate: { color: "#874423", fontFamily: WAFL_FONTS.semibold, fontSize: 10, paddingVertical: 5 },
  input: { backgroundColor: "#fffdf8", borderColor: "#cdbfae", borderRadius: 9, borderWidth: 1, color: "#17263d", fontFamily: WAFL_FONTS.regular, fontSize: 16, minHeight: 44, paddingHorizontal: 11, paddingVertical: 8 },
  inputInvalid: { borderColor: "#b74b43" },
  fieldError: { color: "#a13933", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 15 },
  saveMessage: { color: "#8a4330", fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 17 },
  saveMessageConflict: { color: "#9a3f31" },
  reloadLatest: { alignItems: "center", alignSelf: "flex-start", borderColor: "#9a7b66", borderRadius: 9, borderWidth: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 12 },
  reloadLatestText: { color: "#5d4435", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  editActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  cancelButton: { alignItems: "center", borderColor: "#b9aa9a", borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 44, minWidth: 92, paddingHorizontal: 14 },
  cancelButtonText: { color: "#4f463f", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  saveButton: { alignItems: "center", backgroundColor: "#23375a", borderRadius: 10, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 44, minWidth: 100, paddingHorizontal: 16 },
  saveButtonDisabled: { opacity: 0.42 },
  saveButtonText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  savedBanner: { backgroundColor: "#edf2e7", color: "#405b34", fontFamily: WAFL_FONTS.bold, fontSize: 11, marginBottom: 10, marginHorizontal: 12, paddingHorizontal: 10, paddingVertical: 8 },
  lockedBanner: { alignItems: "flex-start", backgroundColor: "#fff1d3", gap: 7, marginBottom: 10, marginHorizontal: 12, padding: 10 },
  lockedBannerText: { color: "#8a4330", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  lockedNotice: { color: "#75695e", fontFamily: WAFL_FONTS.regular, fontSize: 10, marginBottom: 8, marginHorizontal: 12 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingBottom: 12, paddingHorizontal: 12 },
  summaryGridTablet: { flexWrap: "nowrap" },
  miniStat: { backgroundColor: "#f7f0e5", borderRadius: 9, flexBasis: "47%", flexGrow: 1, minWidth: 112, paddingHorizontal: 9, paddingVertical: 7 },
  miniLabel: { color: "#7a6c5c", fontFamily: WAFL_FONTS.medium, fontSize: 9 },
  miniValue: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 11, lineHeight: 15, marginTop: 2 },
  tabRailFrame: { backgroundColor: "rgba(255, 250, 242, 0.72)", borderBottomColor: "#eadfce", borderBottomWidth: 1, borderTopColor: "#eadfce", borderTopWidth: 1 },
  tabRail: { alignItems: "stretch", gap: 8, minHeight: 48, paddingHorizontal: 10, paddingVertical: 3 },
  tab: { alignItems: "center", backgroundColor: "transparent", borderRadius: 9, justifyContent: "center", minWidth: 74, opacity: 0.54, paddingHorizontal: 2, paddingVertical: 5 },
  tabSelected: { backgroundColor: "#fffdf8", opacity: 1 },
  tabLabelRow: { alignItems: "center", flexDirection: "row", gap: 4, justifyContent: "center" },
  tabText: { color: "#5d544b", fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 17, textAlign: "center" },
  tabTextSelected: { color: "#17263d", fontFamily: WAFL_FONTS.bold },
  tabUnderline: { backgroundColor: "transparent", borderRadius: 999, height: 2, marginTop: 4, width: 28 },
  tabUnderlineSelected: { backgroundColor: "#17263d" },
  tabCount: { backgroundColor: "#e2d8ca", borderRadius: 999, color: "#5d544b", fontFamily: WAFL_FONTS.bold, fontSize: 9, minWidth: 18, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, textAlign: "center" },
  tabNotice: { color: "#756b62", fontFamily: WAFL_FONTS.regular, fontSize: 10, paddingBottom: 8, paddingHorizontal: 12, paddingTop: 3 },
  overviewSection: { padding: 12, paddingBottom: 16 },
  nextCheckPanel: { alignItems: "flex-start", borderLeftWidth: 4, borderRadius: 11, flexDirection: "row", gap: 10, marginBottom: 8, paddingHorizontal: 11, paddingVertical: 10 },
  nextCheckReady: { backgroundColor: "#edf2e7", borderLeftColor: "#4d6a3a" },
  nextCheckWarning: { backgroundColor: "#fff1d3", borderLeftColor: "#c75f35" },
  nextCheckEyebrow: { backgroundColor: "#17263d", borderRadius: 999, color: "#ffffff", flexShrink: 0, fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4 },
  nextCheckBody: { flex: 1, minWidth: 0 },
  nextCheckTitleRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "space-between" },
  nextCheckTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 12, lineHeight: 17 },
  warningCount: { color: "#8b611c", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  blocker: { color: "#9a3f31", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 16, marginTop: 3 },
  warning: { color: "#79591e", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 16, marginTop: 3 },
  more: { color: "#756b62", fontFamily: WAFL_FONTS.regular, fontSize: 9, marginTop: 3 },
  sectionBlock: { borderTopColor: "#eee3d5", borderTopWidth: 1, paddingTop: 11 },
  sectionTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 15, marginBottom: 5 },
  metricLine: { alignItems: "center", borderBottomColor: "#f0e7dc", borderBottomWidth: 1, flexDirection: "row", gap: 10, justifyContent: "space-between", minHeight: 38, paddingVertical: 7 },
  metricLabel: { color: "#7a6c5c", flexShrink: 0, fontFamily: WAFL_FONTS.medium, fontSize: 11 },
  metricValue: { color: "#17263d", flex: 1, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 13, lineHeight: 18, minWidth: 0, textAlign: "right" },
  metricValueEmphasized: { color: "#23375a", fontFamily: WAFL_FONTS.black, fontSize: 15 },
});
