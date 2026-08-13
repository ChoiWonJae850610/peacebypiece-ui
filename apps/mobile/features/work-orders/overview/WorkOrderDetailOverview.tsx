import { useRef, useState, type ReactNode } from "react";
import {
  Platform,
  Image as NativeImage,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ChevronLeft, ImageIcon, LockKeyhole } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import type { BasicInfoDraft, BasicInfoFieldErrors } from "@/domain/workOrderValidation";
import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import InlineDatePicker from "@/components/InlineDatePicker";
import WorkOrderMaterialsReadOnly, { type MaterialReadViewState } from "@/features/materials/WorkOrderMaterialsReadOnly";
import WorkOrderMaterialEditor, { type MaterialEditorViewState } from "@/features/materials/WorkOrderMaterialEditor";
import type { MaterialInlineEditSession } from "@/features/materials/materialInlineEditSession";
import WorkOrderImageGallery from "@/features/work-orders/images/WorkOrderImageGallery";
import WorkOrderSizeColorStructureEditor from "@/features/work-orders/size-color/WorkOrderSizeColorStructureEditor";
import type { SizeColorReadBoundary } from "@/features/work-orders/size-color/useSizeColorReadController";
import type { SizeColorStructureEditBoundary } from "@/features/work-orders/size-color/useSizeColorStructureEditController";
import type { WorkOrderImageAcquisitionSource } from "@/features/work-orders/images/workOrderImageAcquisition";
import {
  readOnlyBadgeLabel,
  resolveWorkOrderTabVisualState,
} from "@/features/work-orders/overview/workOrderDetailPresentation";
import ReelInlineEditValue from "@/features/inputs/reel-picker/ReelInlineEditValue";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import type { MaterialDraftFields, MaterialDraftUpdate, MaterialPartnerOption, MaterialType, WorkOrderAttachmentAsset, WorkOrderDetailCore, WorkOrderImageAsset, WorkOrderMaterialLine } from "@/domain/mobileContract";
import type { MaterialOrderAction, MaterialOrderPolicy } from "@/domain/materialOrderPolicy";
import { formatWon } from "@/lib/mobileDisplay";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import { useFocusedFieldVisibility } from "@/hooks/useFocusedFieldVisibility";
import { formatWorkOrderStatus } from "@/lib/workOrderDisplay";
import { displayValueOrUnset, isUnsetDisplayValue, WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import {
  WORK_ORDER_CATEGORY_MAJORS,
  WORK_ORDER_TARGET_AUDIENCES,
} from "@/domain/workOrderCategoryPolicy";

const SECTION_TABS = [
  { id: "media", label: "이미지·첨부", count: (detail: WorkOrderDetailCore) => detail.tabCounts.images + detail.tabCounts.attachments },
  { id: "sizes", label: "사이즈·색상", count: (detail: WorkOrderDetailCore) => detail.tabCounts.sizes + detail.tabCounts.colors },
  { id: "fabric", label: "원단", count: (detail: WorkOrderDetailCore) => detail.tabCounts.fabric },
  { id: "accessory", label: "부자재", count: (detail: WorkOrderDetailCore) => detail.tabCounts.accessory },
  { id: "flow", label: "제작", count: (detail: WorkOrderDetailCore) => detail.tabCounts.processes },
  { id: "output", label: "문서", count: (detail: WorkOrderDetailCore) => detail.tabCounts.documents },
] as const;

function MiniStat({ label, value, editor, expanded = false, placeholder = false }: { readonly label: string; readonly value: string; readonly editor?: ReactNode; readonly expanded?: boolean; readonly placeholder?: boolean }) {
  return (
    <View style={[styles.miniStat, expanded && styles.miniStatExpanded]}>
      <Text style={styles.miniLabel}>{label}</Text>
      {editor ?? <Text numberOfLines={2} style={[styles.miniValue, placeholder && styles.miniPlaceholder]}>{value}</Text>}
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

function Section({ title, children }: { readonly title?: string; readonly children: ReactNode }) {
  return (
    <View style={styles.sectionBlock}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function DetailTab({
  label,
  count,
  selected,
  locked = false,
  onPress,
}: {
  readonly label: string;
  readonly count?: number;
  readonly selected: boolean;
  readonly locked?: boolean;
  readonly onPress?: () => void;
}) {
  const visualState = resolveWorkOrderTabVisualState({ selected, locked });
  const active = visualState === "active";
  const disabled = visualState === "locked";

  return (
    <Pressable
      accessibilityLabel={`${label}${count === undefined ? "" : ` ${count}건`}${disabled ? ", 잠김" : ""}`}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.tab,
        active && styles.tabSelected,
        disabled && styles.tabLocked,
      ]}
    >
      <View style={styles.tabLabelRow}>
        <Text style={[styles.tabText, active && styles.tabTextSelected]}>{label}</Text>
        {count === undefined ? null : <Text style={styles.tabCount}>{count}</Text>}
        {disabled ? <LockKeyhole color="#8f857b" size={11} /> : null}
      </View>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineSelected]} />
    </Pressable>
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

export type { BasicInfoDraft, BasicInfoFieldErrors } from "@/domain/workOrderValidation";
export type BasicInfoSaveState = "read-only" | "editing" | "saving" | "saved" | "validation-error" | "conflict" | "locked" | "save-error";
export type BasicInfoInlineField = Exclude<keyof BasicInfoDraft, "totalQuantity">;

type Props = {
  readonly detail: WorkOrderDetailCore;
  readonly phone: boolean;
  readonly onBack: () => void;
  readonly canEdit: boolean;
  readonly activeBasicField: BasicInfoInlineField | null;
  readonly dirty: boolean;
  readonly draft: BasicInfoDraft;
  readonly fieldErrors: BasicInfoFieldErrors;
  readonly saveState: BasicInfoSaveState;
  readonly saveMessage: string | null;
  readonly onBeginEdit: (field: BasicInfoInlineField) => void;
  readonly onChangeDraft: (field: keyof BasicInfoDraft, value: string) => void;
  readonly onCancelEdit: () => void;
  readonly onSave: (override?: Partial<BasicInfoDraft>) => void;
  readonly onSaveDate: (value: string) => void;
  readonly onReloadLatest: () => void;
  readonly materials: MaterialReadViewState;
  readonly materialType: MaterialType;
  readonly materialLifecycleBusyId: string | null;
  readonly materialOrderBusyId: string | null;
  readonly materialOrderBusyAction: MaterialOrderAction | null;
  readonly materialIdentityKey: string;
  readonly canEditMaterials: boolean;
  readonly materialEditor: MaterialEditorViewState | null;
  readonly activeMaterialField: keyof MaterialDraftFields | null;
  readonly activeMaterialInlineSession: MaterialInlineEditSession | null;
  readonly materialEditorDirty: boolean;
  readonly materialSaveNotice: string | null;
  readonly materialPartnerOptions: readonly MaterialPartnerOption[];
  readonly onBeginMaterialCreate: () => void;
  readonly onBeginMaterialEdit: (line: WorkOrderMaterialLine, field: keyof MaterialDraftFields) => void;
  readonly onDeleteMaterial: (line: WorkOrderMaterialLine) => void;
  readonly onMaterialOrderAction: (line: WorkOrderMaterialLine, action: MaterialOrderAction) => void;
  readonly materialOrderPolicy: (line: WorkOrderMaterialLine) => MaterialOrderPolicy;
  readonly onChangeMaterialDraft: (field: keyof MaterialDraftFields, value: string) => void;
  readonly onChangeMaterialInlineDraft: (field: keyof MaterialDraftFields, value: string, owner: MaterialInlineEditSession) => void;
  readonly onCancelMaterialEditor: () => void;
  readonly onCancelMaterialInlineEditor: (owner: MaterialInlineEditSession) => void;
  readonly onSaveMaterial: (draftOverride?: MaterialDraftUpdate) => void;
  readonly onSaveMaterialInline: (draftOverride: MaterialDraftUpdate, owner: MaterialInlineEditSession) => void;
  readonly onReloadLatestMaterial: () => void;
  readonly onRequestSectionChange: (onProceed: () => void) => void;
  readonly onOpenMaterials: (materialType: MaterialType) => void;
  readonly sizeColor: SizeColorReadBoundary;
  readonly sizeColorEdit: SizeColorStructureEditBoundary;
  readonly onRetryMaterials: () => void;
  readonly onLoadMoreMaterials: () => void;
  readonly images: readonly WorkOrderImageAsset[];
  readonly attachments: readonly WorkOrderAttachmentAsset[];
  readonly imageBusy: boolean;
  readonly imageBusyId: string | null;
  readonly imageMessage: string | null;
  readonly onAcquireImage: (source: WorkOrderImageAcquisitionSource) => void;
  readonly onAcquireAttachment: () => void;
  readonly onDeleteImage: (image: WorkOrderImageAsset) => void;
  readonly onDeleteAttachment: (attachment: WorkOrderAttachmentAsset) => void;
  readonly onOpenAttachment: (attachment: WorkOrderAttachmentAsset) => void;
  readonly onSaveFactoryDeliveryMemo: (memo: string) => Promise<boolean>;
  readonly onSetRepresentativeImage: (image: WorkOrderImageAsset) => void;
};

export default function WorkOrderDetailOverview(props: Props) {
  const { detail, phone, onBack } = props;
  const [activeSection, setActiveSection] = useState<"overview" | "media" | "sizes" | MaterialType>("overview");
  const [categoryReelField, setCategoryReelField] = useState<"targetAudience" | "categoryMajor" | null>(null);
  const { width } = useWindowDimensions();
  const { header } = detail;
  const compactPhoneHero = phone && width < 390;
  const savingBasic = props.saveState === "saving";
  const basicLocked = props.saveState === "locked";
  const detailScrollRef = useRef<ScrollView>(null);
  const { onFieldFocus, onScroll } = useFocusedFieldVisibility(detailScrollRef);
  const representative = props.images.find((image) => image.isRepresentative) ?? null;
  const representativeUrl = resolveMobileApiUrl(representative?.viewUrl ?? header.representativeImage?.thumbnailUrl ?? null);
  const readOnlyLabel = readOnlyBadgeLabel(props.canEdit);

  return (
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        {phone ? (
          <Pressable
            accessibilityLabel="작업지시서 목록으로 돌아가기"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ChevronLeft color="#3f352d" size={22} />
            <Text style={styles.backText}>목록</Text>
          </Pressable>
        ) : <View />}
        <View style={styles.navigationActions}>
          {readOnlyLabel ? (
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyBadgeText}>{readOnlyLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        ref={detailScrollRef}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View testID="production-card-sheet" style={styles.productionCardSheet}>
          <View style={[styles.hero, compactPhoneHero && styles.heroCompactPhone]}>
            <Pressable
              accessibilityLabel={representative ? `대표 이미지 ${representative.filename}, 이미지 ${props.images.length}건` : `대표 이미지 없음, 이미지 ${props.images.length}건`}
              accessibilityRole="button"
              onPress={() => props.onRequestSectionChange(() => setActiveSection("media"))}
              style={[styles.mediaFrame, compactPhoneHero && styles.mediaFrameCompactPhone, !phone && styles.mediaFrameTablet]}
            >
              {representativeUrl ? (
                <NativeImage resizeMode="cover" source={{ uri: representativeUrl }} style={styles.heroMediaImage} />
              ) : (
                <>
                  <ImageIcon color="#6f6255" size={phone ? 26 : 34} strokeWidth={1.5} />
                  <Text style={styles.mediaLabel}>대표 이미지 없음</Text>
                </>
              )}
            </Pressable>

            <View style={styles.heroText}>
              <View style={styles.statusRow}>
                <Text style={styles.statusBadge}>{formatWorkOrderStatus(header.status)}</Text>
              </View>
              <ControlledInlineEditValue
                accessibilityLabel="제품명"
                active={props.activeBasicField === "productName"}
                commitMode="blur-submit"
                containerStyle={styles.heroInlineField}
                dirty={props.dirty}
                displayStyle={[styles.title, compactPhoneHero && styles.titleCompactPhone]}
                displayValue={header.productName}
                editable={props.canEdit && !basicLocked}
                errorMessage={props.fieldErrors.productName ?? null}
                invalid={Boolean(props.fieldErrors.productName)}
                maxLength={200}
                onActivate={() => props.onRequestSectionChange(() => props.onBeginEdit("productName"))}
                onCancel={props.onCancelEdit}
                onChange={(value) => props.onChangeDraft("productName", value)}
                onSave={(finalizedValue) => props.onSave({ productName: finalizedValue })}
                onFocusTarget={onFieldFocus}
                placeholder="제품명 미입력"
                saving={savingBasic}
                testID="overview-inline-product-name"
                value={props.draft.productName}
              />
            </View>
          </View>

          <View style={styles.tabRailFrame}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRail}>
              <DetailTab
                label="개요"
                onPress={() => props.onRequestSectionChange(() => setActiveSection("overview"))}
                selected={activeSection === "overview"}
              />
              {SECTION_TABS.map((tab) => {
                const count = tab.id === "media" ? props.images.length : tab.count(detail);
                const locked = tab.id === "flow" || tab.id === "output";
                const onPress = tab.id === "media"
                  ? () => props.onRequestSectionChange(() => setActiveSection("media"))
                  : tab.id === "sizes"
                    ? () => props.onRequestSectionChange(() => {
                      setActiveSection("sizes");
                      props.sizeColor.onOpen();
                    })
                    : tab.id === "fabric" || tab.id === "accessory"
                      ? () => props.onRequestSectionChange(() => {
                        setActiveSection(tab.id);
                        props.onOpenMaterials(tab.id);
                      })
                      : undefined;
                return (
                  <DetailTab
                    count={count}
                    key={tab.id}
                    label={tab.label}
                    locked={locked}
                    onPress={onPress}
                    selected={activeSection === tab.id}
                  />
                );
              })}
            </ScrollView>
          </View>

          {activeSection === "overview" ? (
            <View style={styles.overviewSection}>
              {(props.saveState === "locked" || props.saveState === "conflict" || props.saveState === "save-error") && props.saveMessage ? (
                <Pressable accessibilityRole="button" onPress={props.onReloadLatest} style={styles.reloadLatest}>
                  <Text style={styles.reloadLatestText}>최신 내용 불러오기</Text>
                </Pressable>
              ) : null}
              <Section>
                <View style={[styles.summaryGrid, !phone && styles.summaryGridTablet]}>
                  <MiniStat
                    label="총 수량"
                    value={`${header.totalQuantity.toLocaleString("ko-KR")}벌`}
                  />
                  <MiniStat
                    expanded={props.activeBasicField === "dueDate"}
                    label="납기"
                    value={header.dueDate ?? "미정"}
                    editor={(
                      <InlineDatePicker
                        active={props.activeBasicField === "dueDate"}
                        displayValue={header.dueDate ?? ""}
                        editable={props.canEdit && !basicLocked}
                        errorMessage={props.fieldErrors.dueDate ?? null}
                        onActivate={() => props.onRequestSectionChange(() => props.onBeginEdit("dueDate"))}
                        onCancel={props.onCancelEdit}
                        onCommit={props.onSaveDate}
                        saving={savingBasic}
                        value={props.draft.dueDate}
                      />
                    )}
                  />
                  <MiniStat
                    expanded={props.activeBasicField === "targetAudience"}
                    label="대상"
                    placeholder={isUnsetDisplayValue(props.draft.targetAudience)}
                    value={displayValueOrUnset(props.draft.targetAudience)}
                    editor={(
                      <ReelInlineEditValue
                        accessibilityLabel="대상"
                        active={props.activeBasicField === "targetAudience"}
                        displayStyle={styles.miniValue}
                        displayValue={props.draft.targetAudience}
                        editable={props.canEdit && !basicLocked}
                        errorMessage={props.fieldErrors.targetAudience ?? null}
                        onActivate={() => props.onRequestSectionChange(() => props.onBeginEdit("targetAudience"))}
                        onOpenPicker={() => setCategoryReelField("targetAudience")}
                        placeholder={WAFL_UNSET_PLACEHOLDER}
                        saving={savingBasic}
                        testID="overview-inline-target-audience"
                      />
                    )}
                  />
                  {categoryReelField === "targetAudience" ? (
                    <WaflReelPickerSheet
                      field="targetAudience"
                      kind="option"
                      label="대상"
                      onApply={(value) => {
                        setCategoryReelField(null);
                        props.onChangeDraft("targetAudience", value);
                        props.onSave({ targetAudience: value });
                      }}
                      onCancel={() => {
                        setCategoryReelField(null);
                        props.onCancelEdit();
                      }}
                      options={["", ...WORK_ORDER_TARGET_AUDIENCES]}
                      unitCode=""
                      value={props.draft.targetAudience}
                      visible
                    />
                  ) : null}
                  <MiniStat
                    expanded={props.activeBasicField === "categoryMajor"}
                    label="대분류"
                    placeholder={isUnsetDisplayValue(props.draft.categoryMajor)}
                    value={displayValueOrUnset(props.draft.categoryMajor)}
                    editor={(
                      <ReelInlineEditValue
                        accessibilityLabel="대분류"
                        active={props.activeBasicField === "categoryMajor"}
                        displayStyle={styles.miniValue}
                        displayValue={props.draft.categoryMajor}
                        editable={props.canEdit && !basicLocked}
                        errorMessage={props.fieldErrors.categoryMajor ?? null}
                        onActivate={() => props.onRequestSectionChange(() => props.onBeginEdit("categoryMajor"))}
                        onOpenPicker={() => setCategoryReelField("categoryMajor")}
                        placeholder={WAFL_UNSET_PLACEHOLDER}
                        saving={savingBasic}
                        testID="overview-inline-category-major"
                      />
                    )}
                  />
                  {categoryReelField === "categoryMajor" ? (
                    <WaflReelPickerSheet
                      field="categoryMajor"
                      kind="option"
                      label="대분류"
                      onApply={(value) => {
                        setCategoryReelField(null);
                        props.onChangeDraft("categoryMajor", value);
                        props.onSave({ categoryMajor: value });
                      }}
                      onCancel={() => {
                        setCategoryReelField(null);
                        props.onCancelEdit();
                      }}
                      options={["", ...WORK_ORDER_CATEGORY_MAJORS]}
                      unitCode=""
                      value={props.draft.categoryMajor}
                      visible
                    />
                  ) : null}
                  <MiniStat
                    expanded={props.activeBasicField === "categoryDetail"}
                    label="세부 품목"
                    placeholder={isUnsetDisplayValue(props.draft.categoryDetail)}
                    value={displayValueOrUnset(props.draft.categoryDetail)}
                    editor={(
                    <ControlledInlineEditValue
                      accessibilityLabel="세부 품목"
                      active={props.activeBasicField === "categoryDetail"}
                      commitMode="blur-submit"
                      dirty={props.dirty}
                      displayValue={props.draft.categoryDetail}
                      displayPlaceholder={WAFL_UNSET_PLACEHOLDER}
                      editable={props.canEdit && !basicLocked}
                      errorMessage={props.fieldErrors.categoryDetail ?? null}
                      invalid={Boolean(props.fieldErrors.categoryDetail)}
                      maxLength={24}
                      onActivate={() => props.onRequestSectionChange(() => props.onBeginEdit("categoryDetail"))}
                      onCancel={props.onCancelEdit}
                      onChange={(value) => props.onChangeDraft("categoryDetail", value)}
                      onSave={(value) => props.onSave({ categoryDetail: value })}
                      onFocusTarget={onFieldFocus}
                      placeholder="예: 반팔 티셔츠"
                      saving={savingBasic}
                      testID="overview-inline-category-detail"
                      value={props.draft.categoryDetail}
                      valueSemantics="nullable-text"
                    />
                    )}
                  />
                  <MiniStat
                    expanded={props.activeBasicField === "seasonCode"}
                    label="시즌"
                    placeholder={isUnsetDisplayValue(props.draft.seasonCode)}
                    value={displayValueOrUnset(props.draft.seasonCode)}
                    editor={(
                    <ControlledInlineEditValue
                      accessibilityLabel="시즌"
                      active={props.activeBasicField === "seasonCode"}
                      commitMode="blur-submit"
                      dirty={props.dirty}
                      displayValue={props.draft.seasonCode}
                      displayPlaceholder={WAFL_UNSET_PLACEHOLDER}
                      editable={props.canEdit && !basicLocked}
                      errorMessage={props.fieldErrors.seasonCode ?? null}
                      invalid={Boolean(props.fieldErrors.seasonCode)}
                      maxLength={16}
                      onActivate={() => props.onRequestSectionChange(() => props.onBeginEdit("seasonCode"))}
                      onCancel={props.onCancelEdit}
                      onChange={(value) => props.onChangeDraft("seasonCode", value)}
                      onSave={(value) => props.onSave({ seasonCode: value })}
                      onFocusTarget={onFieldFocus}
                      placeholder="예: 26FW"
                      saving={savingBasic}
                      testID="overview-inline-season"
                      value={props.draft.seasonCode}
                      valueSemantics="nullable-text"
                    />
                    )}
                  />
                </View>
              </Section>
              <ReadinessPanel detail={detail} />
              <Section title="비용 구성">
                <View style={styles.costComponents}>
                  <MetricLine label="원단" value={formatWon(detail.amounts.fabricTotal)} />
                  <MetricLine label="부자재" value={formatWon(detail.amounts.accessoryTotal)} />
                  <MetricLine label="공정" value={formatWon(detail.amounts.processTotal)} />
                </View>
                <View style={styles.costResult}>
                  <MetricLine label="1벌 원가" value={formatWon(detail.amounts.unitPrice)} />
                </View>
                <View style={styles.costFinalResult}>
                  <MetricLine emphasized label="예상 총원가" value={formatWon(detail.amounts.estimatedTotal)} />
                </View>
              </Section>
            </View>
          ) : activeSection === "media" ? (
            <WorkOrderImageGallery
              busy={props.imageBusy}
              busyImageId={props.imageBusyId}
              canEdit={props.canEdit}
              images={props.images}
              attachments={props.attachments}
              factoryDeliveryMemo={detail.revision.factoryDeliveryMemo}
                message={props.imageMessage}
                onAcquire={props.onAcquireImage}
                onAcquireAttachment={props.onAcquireAttachment}
                onDelete={props.onDeleteImage}
                onDeleteAttachment={props.onDeleteAttachment}
                onOpenAttachment={props.onOpenAttachment}
                onFocusTarget={onFieldFocus}
                onSaveMemo={props.onSaveFactoryDeliveryMemo}
              onSetRepresentative={props.onSetRepresentativeImage}
            />
          ) : activeSection === "sizes" ? (
            <WorkOrderSizeColorStructureEditor
              edit={props.sizeColorEdit}
              identity={props.sizeColor.identity}
              onRetry={props.sizeColor.onRetry}
              state={props.sizeColor.state}
            />
          ) : props.materialEditor?.mode === "create" ? (
            <WorkOrderMaterialEditor
              dirty={props.materialEditorDirty}
              onCancel={props.onCancelMaterialEditor}
              onChange={props.onChangeMaterialDraft}
              onReloadLatest={props.onReloadLatestMaterial}
              onSave={props.onSaveMaterial}
              partnerOptions={props.materialPartnerOptions}
              state={props.materialEditor}
            />
          ) : (
            <WorkOrderMaterialsReadOnly
              materialType={props.materialType}
              canEdit={props.canEditMaterials}
              activeEditor={props.materialEditor?.mode === "edit" ? props.materialEditor : null}
              activeField={props.activeMaterialField}
              activeInlineSession={props.activeMaterialInlineSession}
              key={props.materialIdentityKey}
              lifecycleBusyId={props.materialLifecycleBusyId}
              orderBusyId={props.materialOrderBusyId}
              orderBusyAction={props.materialOrderBusyAction}
              onAdd={props.onBeginMaterialCreate}
              onDelete={props.onDeleteMaterial}
              onOrderAction={props.onMaterialOrderAction}
              onEdit={props.onBeginMaterialEdit}
              onCancelEdit={props.onCancelMaterialEditor}
              onCancelInlineEdit={props.onCancelMaterialInlineEditor}
              onChangeEdit={props.onChangeMaterialDraft}
              onChangeInlineEdit={props.onChangeMaterialInlineDraft}
              onSaveEdit={props.onSaveMaterial}
              onSaveInlineEdit={props.onSaveMaterialInline}
              onLoadMore={props.onLoadMoreMaterials}
              onRetry={props.onRetryMaterials}
              orderPolicy={props.materialOrderPolicy}
              partnerOptions={props.materialPartnerOptions}
              onFieldFocus={onFieldFocus}
              saveNotice={props.materialSaveNotice}
              state={props.materials}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  navigationBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 44, marginBottom: 8 },
  navigationActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  backButton: { alignItems: "center", flexDirection: "row", minHeight: 44, paddingRight: 8 },
  backText: { color: "#3f352d", fontFamily: WAFL_FONTS.semibold, fontSize: 14 },
  readOnlyBadge: { backgroundColor: "#edf0f5", borderColor: "#cbd3df", borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  readOnlyBadgeText: { color: "#334561", fontFamily: WAFL_FONTS.semibold, fontSize: 10, lineHeight: 14 },
  pressed: { opacity: 0.68 },
  scrollContent: { paddingBottom: 42 },
  productionCardSheet: { backgroundColor: "#fffdf8", borderColor: "#eadfce", borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  hero: { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 10 },
  heroCompactPhone: { gap: 8, paddingHorizontal: 10 },
  mediaFrame: { alignItems: "center", backgroundColor: "#efe4d3", borderRadius: 12, flexShrink: 0, height: 96, justifyContent: "center", overflow: "hidden", padding: 7, position: "relative", width: 80 },
  mediaFrameCompactPhone: { height: 90, width: 72 },
  mediaFrameTablet: { height: 148, width: 132 },
  heroMediaImage: { height: "100%", width: "100%" },
  mediaLabel: { bottom: 7, color: "#51483e", fontFamily: WAFL_FONTS.semibold, fontSize: 8, left: 5, lineHeight: 11, position: "absolute", right: 5, textAlign: "center" },
  heroText: { flex: 1, flexGrow: 1, flexShrink: 1, gap: 6, justifyContent: "center", minWidth: 0 },
  statusRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7 },
  statusBadge: { backgroundColor: "#23375a", borderRadius: 999, color: "#ffffff", fontFamily: WAFL_FONTS.bold, fontSize: 11, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4 },
  revision: { color: "#6d6257", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  title: { color: "#141f33", flexShrink: 1, fontFamily: WAFL_FONTS.black, fontSize: 20, lineHeight: 26, minWidth: 0 },
  titleCompactPhone: { fontSize: 18, lineHeight: 24 },
  heroInlineField: { alignSelf: "stretch", minWidth: 0 },
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
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingBottom: 12, paddingHorizontal: 12 },
  summaryGridTablet: { flexWrap: "nowrap" },
  miniStat: { backgroundColor: "#f7f0e5", borderRadius: 9, flexBasis: "47%", flexGrow: 1, minWidth: 112, paddingHorizontal: 9, paddingVertical: 7 },
  miniStatExpanded: { flexBasis: "100%", minWidth: "100%" },
  miniLabel: { color: "#7a6c5c", fontFamily: WAFL_FONTS.medium, fontSize: 9 },
  miniValue: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 11, lineHeight: 15, marginTop: 2 },
  miniPlaceholder: { color: "#9b9288" },
  categoryDisplay: { backgroundColor: "#f7f0e5", borderRadius: 9, flexBasis: "47%", flexGrow: 1, minHeight: 56, minWidth: 112, paddingHorizontal: 9, paddingVertical: 7 },
  categoryDisplayDisabled: { opacity: 0.72 },
  categoryLabel: { color: "#7a6c5c", fontFamily: WAFL_FONTS.medium, fontSize: 9, lineHeight: 14 },
  categoryValue: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 11, lineHeight: 17, marginTop: 2 },
  categoryPlaceholder: { color: "#978b7f", fontFamily: WAFL_FONTS.medium, fontSize: 11, lineHeight: 17, marginTop: 2 },
  categoryEditor: { backgroundColor: "#fffaf2", borderColor: "#d7c8b7", borderRadius: 10, borderWidth: 1, flexBasis: "100%", gap: 7, padding: 9, width: "100%" },
  categoryChoices: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  categoryChoice: { alignItems: "center", backgroundColor: "#f4ede3", borderColor: "#d7cabc", borderRadius: 999, borderWidth: 1, minHeight: 36, justifyContent: "center", paddingHorizontal: 11 },
  categoryChoiceSelected: { backgroundColor: "#23375a", borderColor: "#23375a" },
  categoryChoiceText: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  categoryChoiceTextSelected: { color: "#fff" },
  categoryActions: { flexDirection: "row", gap: 7, justifyContent: "flex-end" },
  categoryCancel: { alignItems: "center", borderColor: "#cdbfae", borderRadius: 8, borderWidth: 1, height: 38, justifyContent: "center", width: 44 },
  categorySave: { alignItems: "center", backgroundColor: "#23375a", borderRadius: 8, height: 38, justifyContent: "center", width: 48 },
  categoryTextField: { backgroundColor: "#f7f0e5", borderRadius: 9, flexBasis: "47%", flexGrow: 1, gap: 2, minHeight: 56, minWidth: 112, paddingHorizontal: 9, paddingVertical: 5 },
  tabRailFrame: { backgroundColor: "rgba(255, 250, 242, 0.72)", borderBottomColor: "#eadfce", borderBottomWidth: 1, borderTopColor: "#eadfce", borderTopWidth: 1 },
  tabRail: { alignItems: "stretch", gap: 8, minHeight: 48, paddingHorizontal: 10, paddingVertical: 3 },
  tab: { alignItems: "center", backgroundColor: "transparent", borderRadius: 9, justifyContent: "center", minWidth: 74, opacity: 0.54, paddingHorizontal: 2, paddingVertical: 5 },
  tabSelected: { backgroundColor: "#fffdf8", opacity: 1 },
  tabLocked: { backgroundColor: "transparent", opacity: 0.4 },
  tabLabelRow: { alignItems: "center", flexDirection: "row", gap: 4, justifyContent: "center" },
  tabText: { color: "#5d544b", fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 17, textAlign: "center" },
  tabTextSelected: { color: "#17263d", fontFamily: WAFL_FONTS.bold },
  tabUnderline: { backgroundColor: "transparent", borderRadius: 999, height: 2, marginTop: 4, width: 28 },
  tabUnderlineSelected: { backgroundColor: "#17263d" },
  tabCount: { backgroundColor: "#e2d8ca", borderRadius: 999, color: "#5d544b", fontFamily: WAFL_FONTS.bold, fontSize: 9, minWidth: 18, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, textAlign: "center" },
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
  costComponents: { backgroundColor: "#f7f9fc", borderRadius: 9, paddingHorizontal: 9 },
  costResult: { borderTopColor: "#d8e0ea", borderTopWidth: 1, marginTop: 7, paddingHorizontal: 9 },
  costFinalResult: { backgroundColor: "#edf1f7", borderColor: "#cbd5e2", borderRadius: 9, borderWidth: 1, marginTop: 7, paddingHorizontal: 9 },
});
