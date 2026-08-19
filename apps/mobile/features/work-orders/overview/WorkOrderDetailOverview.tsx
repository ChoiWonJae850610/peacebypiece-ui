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
import { WAFL_THEME } from "@/constants/theme";
import type { BasicInfoDraft, BasicInfoFieldErrors } from "@/domain/workOrderValidation";
import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import InlineDatePicker from "@/components/InlineDatePicker";
import WorkOrderMaterialsReadOnly, { type MaterialReadViewState } from "@/features/materials/WorkOrderMaterialsReadOnly";
import WorkOrderMaterialEditor, { type MaterialEditorViewState } from "@/features/materials/WorkOrderMaterialEditor";
import WaflMaterialsCategorySwitch from "@/features/materials/WaflMaterialsCategorySwitch";
import type { MaterialInlineEditSession } from "@/features/materials/materialInlineEditSession";
import WorkOrderImageGallery from "@/features/work-orders/images/WorkOrderImageGallery";
import WorkOrderSizeColorStructureEditor from "@/features/work-orders/size-color/WorkOrderSizeColorStructureEditor";
import WorkOrderDocumentWorkbench from "@/features/work-orders/documents/WorkOrderDocumentWorkbench";
import WaflSectionCard from "@/features/layout/WaflSectionCard";
import WaflMetricGrid, { type WaflMetricGridItem } from "@/features/layout/WaflMetricGrid";
import WaflMetricField from "@/features/layout/WaflMetricField";
import WaflWorkOrderTabBody from "@/features/layout/WaflWorkOrderTabBody";
import WorkOrderProductionAuthoring from "@/features/work-orders/production/WorkOrderProductionAuthoring";
import type { SizeColorReadBoundary } from "@/features/work-orders/size-color/useSizeColorReadController";
import type { SizeColorStructureEditBoundary } from "@/features/work-orders/size-color/useSizeColorStructureEditController";
import type { WorkOrderImageAcquisitionSource } from "@/features/work-orders/images/workOrderImageAcquisition";
import {
  readOnlyBadgeLabel,
  resolveWorkOrderTabVisualState,
} from "@/features/work-orders/overview/workOrderDetailPresentation";
import ReelInlineEditValue from "@/features/inputs/reel-picker/ReelInlineEditValue";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import type { MaterialDraftFields, MaterialDraftUpdate, MaterialPartnerOption, MaterialType, WorkOrderAttachmentAsset, WorkOrderDetailCore, WorkOrderImageAsset, WorkOrderMaterialLine } from "@/domain/mobileContract";
import type { MaterialOrderAction, MaterialOrderPolicy } from "@/domain/materialOrderPolicy";
import { formatWon } from "@/lib/mobileDisplay";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import { useFocusedFieldVisibility } from "@/hooks/useFocusedFieldVisibility";
import { formatWorkOrderStatus } from "@/lib/workOrderDisplay";
import { displayValueOrUnset, isUnsetDisplayValue, WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import {
  WORK_ORDER_TARGET_AUDIENCES,
  workOrderMajorCategoryPickerOptions,
} from "@/domain/workOrderCategoryPolicy";
import {
  resolveWorkOrderSectionIntent,
  type WorkOrderSectionIntent,
  type WorkOrderVisibleSection,
} from "./workOrderSectionIntent";

const SECTION_TABS = [
  { id: "media", label: "이미지·첨부", count: (detail: WorkOrderDetailCore) => detail.tabCounts.images + detail.tabCounts.attachments },
  { id: "sizes", label: "사이즈·색상", count: (detail: WorkOrderDetailCore) => detail.tabCounts.sizes + detail.tabCounts.colors },
  { id: "materials", label: "원부자재", count: (detail: WorkOrderDetailCore) => detail.tabCounts.fabric + detail.tabCounts.accessory },
  { id: "production", label: "제작", count: (detail: WorkOrderDetailCore) => detail.tabCounts.processes },
  { id: "output", label: "문서", count: (detail: WorkOrderDetailCore) => detail.tabCounts.documents },
] as const;

function MetricLine({ label, value, emphasized = false }: { readonly label: string; readonly value: string; readonly emphasized?: boolean }) {
  return (
    <View style={[styles.metricLine, emphasized && styles.metricLineEmphasized]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text selectable style={[styles.metricValue, emphasized && styles.metricValueEmphasized]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { readonly title?: string; readonly children: ReactNode }) {
  return (
    <WaflSectionCard title={title}>
      {children}
    </WaflSectionCard>
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
        {warnings.slice(0, 3).map((item) => <Text key={item.code} style={styles.warning}>• {item.message}</Text>)}
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
  readonly materials: Readonly<Record<MaterialType, MaterialReadViewState>>;
  readonly materialLifecycleBusyId: string | null;
  readonly materialOrderBusyId: string | null;
  readonly materialOrderBusyAction: MaterialOrderAction | null;
  readonly materialIdentityKeys: Readonly<Record<MaterialType, string>>;
  readonly canEditMaterials: boolean;
  readonly materialEditor: MaterialEditorViewState | null;
  readonly activeMaterialField: keyof MaterialDraftFields | null;
  readonly activeMaterialInlineSession: MaterialInlineEditSession | null;
  readonly materialEditorDirty: boolean;
  readonly materialSaveNotice: string | null;
  readonly materialPartnerOptions: readonly MaterialPartnerOption[];
  readonly onBeginMaterialCreate: (materialType: MaterialType) => void;
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
  readonly onOpenMaterials: (materialFocus?: MaterialType) => void;
  readonly sizeColor: SizeColorReadBoundary;
  readonly sizeColorEdit: SizeColorStructureEditBoundary;
  readonly onRetryMaterials: (materialType: MaterialType) => void;
  readonly onLoadMoreMaterials: (materialType: MaterialType) => void;
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
  readonly onSetRepresentativeImage: (image: WorkOrderImageAsset) => void;
  readonly onRefreshDocuments: () => void;
};

export default function WorkOrderDetailOverview(props: Props) {
  const { detail, phone, onBack } = props;
  const [activeSection, setActiveSection] = useState<WorkOrderVisibleSection>("overview");
  const [activeMaterialCategory, setActiveMaterialCategory] = useState<MaterialType>("fabric");
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
  const openSection = (intent: WorkOrderSectionIntent) => {
    const resolved = resolveWorkOrderSectionIntent(intent);
    setActiveSection(resolved.section);
    if (resolved.materialFocus) setActiveMaterialCategory(resolved.materialFocus);
    if (resolved.section === "sizes" || resolved.section === "output") props.sizeColor.onOpen();
    if (resolved.section === "materials") props.onOpenMaterials(resolved.materialFocus ?? undefined);
  };
  const overviewMetricItems: readonly WaflMetricGridItem[] = [
    {
      key: "totalQuantity",
      content: <WaflMetricField editable={false} label="총 수량" value={`${header.totalQuantity.toLocaleString("ko-KR")}벌`} />,
    },
    {
      key: "dueDate",
      fullWidth: props.activeBasicField === "dueDate",
      content: <WaflMetricField
        editable={props.canEdit && !basicLocked}
        label="납기"
        value={header.dueDate ?? "미정"}
      ><InlineDatePicker
          active={props.activeBasicField === "dueDate"}
          displayValue={header.dueDate ?? ""}
          editable={props.canEdit && !basicLocked}
          errorMessage={props.fieldErrors.dueDate ?? null}
          onActivate={() => props.onRequestSectionChange(() => props.onBeginEdit("dueDate"))}
          onCancel={props.onCancelEdit}
          onCommit={props.onSaveDate}
          saving={savingBasic}
          value={props.draft.dueDate}
        /></WaflMetricField>,
    },
    {
      key: "targetAudience",
      fullWidth: props.activeBasicField === "targetAudience",
      content: <WaflMetricField
        editable={props.canEdit && !basicLocked}
        label="대상"
        placeholder={isUnsetDisplayValue(props.draft.targetAudience)}
        value={displayValueOrUnset(props.draft.targetAudience)}
      ><ReelInlineEditValue
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
        /></WaflMetricField>,
    },
    {
      key: "categoryMajor",
      fullWidth: props.activeBasicField === "categoryMajor",
      content: <WaflMetricField
        editable={props.canEdit && !basicLocked}
        label="대분류"
        placeholder={isUnsetDisplayValue(props.draft.categoryMajor)}
        value={displayValueOrUnset(props.draft.categoryMajor)}
      ><ReelInlineEditValue
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
        /></WaflMetricField>,
    },
    {
      key: "categoryDetail",
      fullWidth: props.activeBasicField === "categoryDetail",
      content: <WaflMetricField
        editable={props.canEdit && !basicLocked}
        label="세부 품목"
        placeholder={isUnsetDisplayValue(props.draft.categoryDetail)}
        value={displayValueOrUnset(props.draft.categoryDetail)}
      ><ControlledInlineEditValue
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
        /></WaflMetricField>,
    },
    {
      key: "seasonCode",
      fullWidth: props.activeBasicField === "seasonCode",
      content: <WaflMetricField
        editable={props.canEdit && !basicLocked}
        label="시즌"
        placeholder={isUnsetDisplayValue(props.draft.seasonCode)}
        value={displayValueOrUnset(props.draft.seasonCode)}
      ><ControlledInlineEditValue
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
        /></WaflMetricField>,
    },
  ];
  const renderMaterialSection = (materialType: MaterialType) => {
    return <WorkOrderMaterialsReadOnly
      activeEditor={props.materialEditor?.mode === "edit" && props.materialEditor.materialType === materialType ? props.materialEditor : null}
      activeField={props.materialEditor?.materialType === materialType ? props.activeMaterialField : null}
      activeInlineSession={props.materialEditor?.materialType === materialType ? props.activeMaterialInlineSession : null}
      canEdit={props.canEditMaterials}
      embedded
      key={props.materialIdentityKeys[materialType]}
      lifecycleBusyId={props.materialLifecycleBusyId}
      materialType={materialType}
      onAdd={() => props.onBeginMaterialCreate(materialType)}
      onCancelEdit={props.onCancelMaterialEditor}
      onCancelInlineEdit={props.onCancelMaterialInlineEditor}
      onChangeEdit={props.onChangeMaterialDraft}
      onChangeInlineEdit={props.onChangeMaterialInlineDraft}
      onDelete={props.onDeleteMaterial}
      onEdit={props.onBeginMaterialEdit}
      onFieldFocus={onFieldFocus}
      onLoadMore={() => props.onLoadMoreMaterials(materialType)}
      onOrderAction={props.onMaterialOrderAction}
      onRetry={() => props.onRetryMaterials(materialType)}
      onSaveEdit={props.onSaveMaterial}
      onSaveInlineEdit={props.onSaveMaterialInline}
      orderBusyAction={props.materialOrderBusyAction}
      orderBusyId={props.materialOrderBusyId}
      orderPolicy={props.materialOrderPolicy}
      partnerOptions={props.materialPartnerOptions}
      saveNotice={props.materialSaveNotice}
      sectionCount={materialType === "fabric" ? detail.tabCounts.fabric : detail.tabCounts.accessory}
      state={props.materials[materialType]}
    />;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={detailScrollRef}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
      >
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
        <View testID="production-card-sheet" style={[styles.productionCardSheet, styles.productionCardSheetHero]}>
          <View style={[styles.hero, compactPhoneHero && styles.heroCompactPhone]}>
            <Pressable
              accessibilityLabel={representative ? `대표 이미지 ${representative.filename}, 이미지 ${props.images.length}건` : `대표 이미지 없음, 이미지 ${props.images.length}건`}
              accessibilityRole="button"
              onPress={() => props.onRequestSectionChange(() => openSection("media"))}
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

        </View>
        <View style={styles.tabRailFrame}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRail}>
              <DetailTab
                label="개요"
                onPress={() => props.onRequestSectionChange(() => openSection("overview"))}
                selected={activeSection === "overview"}
              />
              {SECTION_TABS.map((tab) => {
                const count = tab.id === "media" ? props.images.length : tab.count(detail);
                const onPress = tab.id === "media"
                  ? () => props.onRequestSectionChange(() => openSection("media"))
                  : tab.id === "sizes"
                    ? () => props.onRequestSectionChange(() => openSection("sizes"))
                    : tab.id === "materials"
                      ? () => props.onRequestSectionChange(() => openSection("materials"))
                      : tab.id === "production"
                        ? () => props.onRequestSectionChange(() => openSection("production"))
                      : tab.id === "output"
                        ? () => props.onRequestSectionChange(() => openSection("output"))
                        : undefined;
                return (
                  <DetailTab
                    count={count}
                    key={tab.id}
                    label={tab.label}
                    onPress={onPress}
                    selected={activeSection === tab.id}
                  />
                );
              })}
            </ScrollView>
        </View>
        <View style={[styles.productionCardSheet, styles.productionCardSheetBody]}>
          <WaflWorkOrderTabBody testID={`work-order-tab-body-${activeSection}`}>
          {activeSection === "overview" ? (
            <View style={styles.overviewSection}>
              {(props.saveState === "locked" || props.saveState === "conflict" || props.saveState === "save-error") && props.saveMessage ? (
                <Pressable accessibilityRole="button" onPress={props.onReloadLatest} style={styles.reloadLatest}>
                  <Text style={styles.reloadLatestText}>최신 내용 불러오기</Text>
                </Pressable>
              ) : null}
              <Section title="기본 정보">
                <WaflMetricGrid items={overviewMetricItems} testID="overview-basic-metric-grid" />
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
                    options={workOrderMajorCategoryPickerOptions(props.draft.categoryMajor)}
                    unitCode=""
                    value={props.draft.categoryMajor}
                    visible
                  />
                ) : null}
              </Section>
              <ReadinessPanel detail={detail} />
              <Section title="비용 구성">
                <View style={styles.costRowGroup}>
                  <MetricLine label="원단" value={formatWon(detail.amounts.fabricTotal)} />
                  <MetricLine label="부자재" value={formatWon(detail.amounts.accessoryTotal)} />
                  <MetricLine label="공정" value={formatWon(detail.amounts.processTotal)} />
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
              message={props.imageMessage}
                onAcquire={props.onAcquireImage}
                onAcquireAttachment={props.onAcquireAttachment}
                onDelete={props.onDeleteImage}
                onDeleteAttachment={props.onDeleteAttachment}
                onOpenAttachment={props.onOpenAttachment}
              onSetRepresentative={props.onSetRepresentativeImage}
            />
          ) : activeSection === "sizes" ? (
            <WorkOrderSizeColorStructureEditor
              edit={props.sizeColorEdit}
              identity={props.sizeColor.identity}
              onRetry={props.sizeColor.onRetry}
              productTypeCode={detail.header.productTypeCode}
              state={props.sizeColor.state}
            />
          ) : activeSection === "production" ? (
            <WorkOrderProductionAuthoring key={detail.header.id} workOrderId={detail.header.id} />
          ) : activeSection === "output" ? (
            <WorkOrderDocumentWorkbench
              attachments={props.attachments}
              detail={detail}
              onOpenSizeColor={props.sizeColor.onOpen}
              onRefresh={props.onRefreshDocuments}
              sizeColorMatrix={props.sizeColor.state.bundle?.matrix ?? null}
            />
          ) : (
            <View style={styles.materialsCombined}
              testID="work-order-combined-materials"
            >
              <WaflSectionCard>
                <WaflMaterialsCategorySwitch
                  accessoryCount={detail.tabCounts.accessory}
                  canAdd={props.canEditMaterials}
                  fabricCount={detail.tabCounts.fabric}
                  onAdd={() => props.onBeginMaterialCreate(activeMaterialCategory)}
                  onSelect={(materialType) => {
                    props.onRequestSectionChange(() => {
                      setActiveMaterialCategory(materialType);
                      props.onOpenMaterials(materialType);
                    });
                  }}
                  selected={activeMaterialCategory}
                />
                {renderMaterialSection(activeMaterialCategory)}
                {props.materialEditor?.mode === "create" && props.materialEditor.materialType === activeMaterialCategory ? <WaflInputSheet
                  cancelAccessibilityLabel={`${activeMaterialCategory === "fabric" ? "원단" : "부자재"} 추가 취소`}
                  confirmAccessibilityLabel={`${activeMaterialCategory === "fabric" ? "원단" : "부자재"} 저장`}
                  confirmDisabled={!props.materialEditorDirty || props.materialEditor.saveState === "locked" || props.materialEditor.saveState === "conflict" || props.materialEditor.saveState === "refresh-error"}
                  onCancel={props.onCancelMaterialEditor}
                  onConfirm={props.onSaveMaterial}
                  pending={props.materialEditor.saveState === "saving"}
                  sizing="expandable"
                  title={`${activeMaterialCategory === "fabric" ? "원단" : "부자재"} 추가`}
                  visible
                >
                  <WorkOrderMaterialEditor
                      dirty={props.materialEditorDirty}
                      onCancel={props.onCancelMaterialEditor}
                      onChange={props.onChangeMaterialDraft}
                      onReloadLatest={props.onReloadLatestMaterial}
                      onSave={props.onSaveMaterial}
                      partnerOptions={props.materialPartnerOptions}
                      showChrome={false}
                      state={props.materialEditor}
                  />
                </WaflInputSheet> : null}
              </WaflSectionCard>
            </View>
          )}
          </WaflWorkOrderTabBody>
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
  productionCardSheet: { backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardMajor, borderWidth: WAFL_THEME.border.hairline, overflow: "hidden" },
  productionCardSheetHero: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  productionCardSheetBody: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  hero: { flexDirection: "row", gap: WAFL_THEME.layout.controlGap, padding: WAFL_THEME.layout.cardPadding, paddingBottom: WAFL_THEME.layout.compactCardPadding },
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
  title: { color: "#141f33", flexShrink: 1, fontFamily: WAFL_FONTS.black, fontSize: WAFL_THEME.typography.productTitle.fontSize, lineHeight: WAFL_THEME.typography.productTitle.lineHeight, minWidth: 0 },
  titleCompactPhone: { fontSize: WAFL_THEME.typography.productTitleCompact.fontSize, lineHeight: WAFL_THEME.typography.productTitleCompact.lineHeight },
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
  miniStat: { backgroundColor: "#f7f0e5", borderRadius: WAFL_THEME.radius.field, justifyContent: "center", minHeight: WAFL_THEME.layout.metricCellMinHeight, paddingHorizontal: WAFL_THEME.layout.controlGap, paddingVertical: WAFL_THEME.layout.tightGap, width: "100%" },
  miniLabel: { color: "#7a6c5c", fontFamily: WAFL_FONTS.medium, fontSize: 9 },
  miniValue: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 11, lineHeight: 15, marginTop: 2 },
  miniPlaceholder: { color: "#9b9288" },
  tabRailFrame: { backgroundColor: WAFL_THEME.color.paper, borderBottomColor: "#eadfce", borderBottomWidth: 1, borderTopColor: "#eadfce", borderTopWidth: 1, zIndex: 3 },
  tabRail: { alignItems: "stretch", gap: WAFL_THEME.layout.controlGap, minHeight: WAFL_THEME.touch.tabRailMinHeight, paddingHorizontal: WAFL_THEME.layout.compactCardPadding, paddingVertical: 3 },
  tab: { alignItems: "center", backgroundColor: "transparent", borderRadius: 9, justifyContent: "center", minWidth: 74, opacity: 0.54, paddingHorizontal: 2, paddingVertical: 5 },
  tabSelected: { backgroundColor: "#fffdf8", opacity: 1 },
  tabLocked: { backgroundColor: "transparent", opacity: 0.4 },
  tabLabelRow: { alignItems: "center", flexDirection: "row", gap: 4, justifyContent: "center" },
  tabText: { color: "#5d544b", fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 17, textAlign: "center" },
  tabTextSelected: { color: "#17263d", fontFamily: WAFL_FONTS.bold },
  tabUnderline: { backgroundColor: "transparent", borderRadius: 999, height: 2, marginTop: 4, width: 28 },
  tabUnderlineSelected: { backgroundColor: "#17263d" },
  tabCount: { backgroundColor: "#e2d8ca", borderRadius: 999, color: "#5d544b", fontFamily: WAFL_FONTS.bold, fontSize: 9, minWidth: 18, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, textAlign: "center" },
  overviewSection: { gap: WAFL_THEME.layout.sectionGap, paddingBottom: WAFL_THEME.layout.sectionGapLarge },
  materialsCombined: { gap: WAFL_THEME.layout.sectionGap, paddingBottom: WAFL_THEME.layout.sectionGapLarge },
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
  metricLine: { alignItems: "center", borderBottomColor: "#f0e7dc", borderBottomWidth: 1, flexDirection: "row", gap: 10, justifyContent: "space-between", minHeight: 38, paddingVertical: 7 },
  metricLineEmphasized: { borderBottomWidth: 0 },
  metricLabel: { color: "#7a6c5c", flexShrink: 0, fontFamily: WAFL_FONTS.medium, fontSize: 11 },
  metricValue: { color: "#17263d", flex: 1, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 13, lineHeight: 18, minWidth: 0, textAlign: "right" },
  metricValueEmphasized: { color: "#23375a", fontFamily: WAFL_FONTS.black, fontSize: 15 },
  costRowGroup: { backgroundColor: "#f7f9fc", borderRadius: WAFL_THEME.radius.field, paddingHorizontal: WAFL_THEME.layout.definitionRowInset },
  costFinalResult: { backgroundColor: "#edf1f7", borderColor: "#cbd5e2", borderRadius: WAFL_THEME.radius.field, borderWidth: 1, marginTop: 7, paddingHorizontal: WAFL_THEME.layout.definitionRowInset },
});
