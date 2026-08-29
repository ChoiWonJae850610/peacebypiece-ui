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
import { ChevronLeft, ChevronRight, ImageIcon, LockKeyhole } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { BasicInfoDraft, BasicInfoFieldErrors } from "@/domain/workOrderValidation";
import { REORDER_MATERIAL_EDITABLE_FIELDS } from "@/domain/workOrderPolicy";
import type { WorkOrderDraftBatchCoordinator } from "@/application/draftBatchCoordinator";
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
import WaflReadinessActionRow from "@/features/layout/WaflReadinessActionRow";
import WorkOrderProductionAuthoring from "@/features/work-orders/production/WorkOrderProductionAuthoring";
import WorkOrderCharacterChoice from "@/features/work-orders/identity/WorkOrderCharacterChoice";
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
import { WaflWorkActionRow } from "@/features/work-orders/reorder/WorkOrderReorderSheets";
import type { MaterialDraftFields, MaterialDraftUpdate, MaterialPartnerOption, MaterialType, WorkOrderAttachmentAsset, WorkOrderDetailCore, WorkOrderImageAsset, WorkOrderMaterialLine } from "@/domain/mobileContract";
import type { WaflActionConfirmationState } from "@/features/feedback/WaflActionConfirmationCard";
import type { WaflDecisionChoiceState } from "@/features/feedback/WaflDecisionChoiceBody";
import { hasCategoryDependentWorkOrderData, resolveCategoryDependentResetDecision } from "@/domain/categoryResetPolicy";
import { materialPartnerOptionsFor } from "@/domain/partnerSelectionPolicy";
import type { MaterialOrderAction, MaterialOrderPolicy } from "@/domain/materialOrderPolicy";
import { formatEstimatedUnitCost, formatWon } from "@/lib/mobileDisplay";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import { useFocusedFieldVisibility } from "@/hooks/useFocusedFieldVisibility";
import { formatWorkOrderStatus } from "@/lib/workOrderDisplay";
import { displayValueOrUnset, isUnsetDisplayValue, WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import { resolveReadinessIssueDestination } from "@/domain/workOrderReadinessNavigation";
import {
  WORK_ORDER_TARGET_AUDIENCES,
  WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL,
  workOrderMajorCategoryPickerOptions,
  type WorkOrderTargetAudience,
} from "@/domain/workOrderCategoryPolicy";
import { WorkOrderDetailItemPickerSheet, WorkOrderSeasonPickerSheet } from "./WorkOrderOverviewPickerSheets";
import {
  resolveWorkOrderSectionIntent,
  type WorkOrderSectionIntent,
  type WorkOrderVisibleSection,
} from "./workOrderSectionIntent";

const SECTION_TABS = [
  { id: "media", label: "이미지", count: (detail: WorkOrderDetailCore) => detail.tabCounts.images },
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

export type { BasicInfoDraft, BasicInfoFieldErrors } from "@/domain/workOrderValidation";
export type BasicInfoSaveState = "read-only" | "editing" | "saving" | "saved" | "validation-error" | "conflict" | "locked" | "save-error";
export type BasicInfoInlineField = Exclude<keyof BasicInfoDraft, "totalQuantity">;

type Props = {
  readonly detail: WorkOrderDetailCore;
  readonly phone: boolean;
  readonly onBack: () => void;
  readonly canEdit: boolean;
  readonly canEditConfirmedMutable: boolean;
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
  readonly onApplyPicker: (override: Partial<BasicInfoDraft>, dependentResetConfirmed?: boolean) => void;
  readonly onSaveDate: (value: string) => void;
  readonly onReloadLatest: () => void;
  readonly onSetSample: (isSample: boolean) => void;
  readonly samplePending: boolean;
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
  readonly onActionProcessing: (message: string | null, helper?: string | null) => void;
  readonly onRequestActionConfirmation: (confirmation: WaflActionConfirmationState | null) => void;
  readonly onActionSuccess: (message: string) => void;
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
  readonly onApplyAttachmentSelection: (changes: readonly { readonly attachmentId: string; readonly includeInDocument: boolean }[]) => Promise<boolean>;
  readonly onDeleteImage: (image: WorkOrderImageAsset) => void;
  readonly onDeleteAttachment: (attachment: WorkOrderAttachmentAsset) => void;
  readonly onOpenAttachment: (attachment: WorkOrderAttachmentAsset) => void;
  readonly onSetRepresentativeImage: (image: WorkOrderImageAsset) => void;
  readonly onSetImageOutputInclude: (image: WorkOrderImageAsset, includeInDocument: boolean) => void;
  readonly onRefreshDocuments: () => Promise<void> | void;
  readonly onRefreshConfirmedDocument: () => Promise<void> | void;
  readonly onRefreshReadinessAfterMutation: () => void;
  readonly canCreateReorder: boolean;
  readonly seriesHistoryCount: number;
  readonly onOpenReorder: () => void;
  readonly onOpenSeriesHistory: () => void;
  readonly draftBatch: WorkOrderDraftBatchCoordinator;
};

export default function WorkOrderDetailOverview(props: Props) {
  const { detail, phone, onBack } = props;
  const [activeSection, setActiveSection] = useState<WorkOrderVisibleSection>("overview");
  const [activeMaterialCategory, setActiveMaterialCategory] = useState<MaterialType>("fabric");
  const [categoryReelField, setCategoryReelField] = useState<"targetAudience" | "categoryMajor" | "categoryDetail" | "seasonCode" | null>(null);
  const [categoryDecision, setCategoryDecision] = useState<{
    readonly field: "targetAudience" | "categoryMajor";
    readonly override: Partial<BasicInfoDraft>;
  } | null>(null);
  const sizeColorBundle = props.sizeColor.state.bundle;
  const hasCategoryDependents = hasCategoryDependentWorkOrderData({
    itemCode: props.detail.header.itemCode,
    totalQuantity: props.detail.header.totalQuantity,
    sizeCount: props.detail.tabCounts.sizes,
    colorCount: props.detail.tabCounts.colors,
    allocationCount: sizeColorBundle?.matrix.quantityCells.length ?? 0,
    specPomCount: sizeColorBundle?.specifications.pomColumns.length ?? 0,
    specCellCount: sizeColorBundle?.specifications.cells.length ?? 0,
    sourceTemplateId: sizeColorBundle?.specifications.templateId ?? null,
  });
  const categoryDecisionCopy = categoryDecision ? resolveCategoryDependentResetDecision({ changed: true, hasDependents: true, kind: categoryDecision.field }) : null;
  const categoryDecisionOverlay: WaflDecisionChoiceState | null = categoryDecision && categoryDecisionCopy ? {
    ...categoryDecisionCopy,
    onCancel: () => setCategoryDecision(null),
    onConfirm: () => {
      const override = categoryDecision.override;
      setCategoryDecision(null);
      setCategoryReelField(null);
      props.onApplyPicker(override, true);
    },
  } : null;
  const [readinessSheetVisible, setReadinessSheetVisible] = useState(false);
  const pendingReadinessIntentRef = useRef<WorkOrderSectionIntent | null>(null);
  const { width } = useWindowDimensions();
  const { header } = detail;
  const compactPhoneHero = phone && width < 390;
  const savingBasic = props.saveState === "saving";
  const basicLocked = props.saveState === "locked";
  const reorderDraft = header.identity.derivationKind === "reorder" && header.identity.reorderRound > 0;
  const specificationEditable = props.canEdit && !basicLocked && !reorderDraft;
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
  const readinessIssues = detail.header.readiness.issues;
  const finishReadinessClose = () => {
    const intent = pendingReadinessIntentRef.current;
    pendingReadinessIntentRef.current = null;
    if (intent) openSection(intent);
  };
  const overviewMetricItems: readonly WaflMetricGridItem[] = [
    {
      key: "totalQuantity",
      content: <WaflMetricField editable={false} label="총 수량" value={`${header.totalQuantity.toLocaleString("ko-KR")}벌`} />,
    },
    {
      key: "dueDate",
      content: <WaflMetricField
        editable={(props.canEdit || props.canEditConfirmedMutable) && !basicLocked}
        label="납기"
        value={(props.canEdit ? props.draft.dueDate : header.dueDate) || "미정"}
      ><InlineDatePicker
          active={props.activeBasicField === "dueDate"}
          displayValue={(props.canEdit ? props.draft.dueDate : header.dueDate) ?? ""}
          editable={(props.canEdit || props.canEditConfirmedMutable) && !basicLocked}
          errorMessage={props.fieldErrors.dueDate ?? null}
          onActivate={() => props.onBeginEdit("dueDate")}
          onCancel={props.onCancelEdit}
          onCommit={props.onSaveDate}
          saving={savingBasic}
          value={props.draft.dueDate}
        /></WaflMetricField>,
    },
    {
      key: "targetAudience",
      content: <WaflMetricField
        editable={specificationEditable}
        label="대상"
        placeholder={isUnsetDisplayValue(props.draft.targetAudience)}
        value={displayValueOrUnset(props.draft.targetAudience)}
      ><ReelInlineEditValue
          accessibilityLabel="대상"
          active={props.activeBasicField === "targetAudience"}
          displayStyle={styles.miniValue}
          displayValue={props.draft.targetAudience}
          editable={specificationEditable}
          errorMessage={props.fieldErrors.targetAudience ?? null}
          onActivate={() => props.onBeginEdit("targetAudience")}
          onOpenPicker={() => setCategoryReelField("targetAudience")}
          placeholder={WAFL_UNSET_PLACEHOLDER}
          saving={savingBasic}
          testID="overview-inline-target-audience"
        /></WaflMetricField>,
    },
    {
      key: "categoryMajor",
      content: <WaflMetricField
        editable={specificationEditable}
        label="대분류"
        placeholder={isUnsetDisplayValue(props.draft.categoryMajor)}
        value={displayValueOrUnset(props.draft.categoryMajor)}
      ><ReelInlineEditValue
          accessibilityLabel="대분류"
          active={props.activeBasicField === "categoryMajor"}
          displayStyle={styles.miniValue}
          displayValue={props.draft.categoryMajor}
          editable={specificationEditable}
          errorMessage={props.fieldErrors.categoryMajor ?? null}
          onActivate={() => props.onBeginEdit("categoryMajor")}
          onOpenPicker={() => setCategoryReelField("categoryMajor")}
          placeholder={WAFL_UNSET_PLACEHOLDER}
          saving={savingBasic}
          testID="overview-inline-category-major"
        /></WaflMetricField>,
    },
    {
      key: "categoryDetail",
      content: <WaflMetricField
        editable={specificationEditable}
        label="세부 품목"
        placeholder={isUnsetDisplayValue(props.draft.categoryDetail)}
        value={displayValueOrUnset(props.draft.categoryDetail)}
      ><ReelInlineEditValue
          accessibilityLabel="세부 품목"
          active={props.activeBasicField === "categoryDetail"}
          displayStyle={styles.miniValue}
          displayValue={props.draft.categoryDetail}
          editable={specificationEditable}
          errorMessage={props.fieldErrors.categoryDetail ?? null}
          onActivate={() => props.onBeginEdit("categoryDetail")}
          onOpenPicker={() => setCategoryReelField("categoryDetail")}
          placeholder={WAFL_UNSET_PLACEHOLDER}
          saving={savingBasic}
          testID="overview-inline-category-detail"
        /></WaflMetricField>,
    },
    {
      key: "seasonCode",
      content: <WaflMetricField
        editable={specificationEditable}
        label="시즌"
        placeholder={isUnsetDisplayValue(props.draft.seasonCode)}
        value={displayValueOrUnset(props.draft.seasonCode)}
      ><ReelInlineEditValue
          accessibilityLabel="시즌"
          active={props.activeBasicField === "seasonCode"}
          displayStyle={styles.miniValue}
          displayValue={props.draft.seasonCode}
          editable={specificationEditable}
          errorMessage={props.fieldErrors.seasonCode ?? null}
          onActivate={() => props.onBeginEdit("seasonCode")}
          onOpenPicker={() => setCategoryReelField("seasonCode")}
          placeholder={WAFL_UNSET_PLACEHOLDER}
          saving={savingBasic}
          testID="overview-inline-season"
        /></WaflMetricField>,
    },
  ];
  const renderMaterialSection = (materialType: MaterialType) => {
    const eligiblePartnerOptions = materialPartnerOptionsFor(props.materialPartnerOptions, materialType);
    return <WorkOrderMaterialsReadOnly
      activeEditor={props.materialEditor?.mode === "edit" && props.materialEditor.materialType === materialType ? props.materialEditor : null}
      activeField={props.materialEditor?.materialType === materialType ? props.activeMaterialField : null}
      activeInlineSession={props.materialEditor?.materialType === materialType ? props.activeMaterialInlineSession : null}
      canEdit={props.canEditMaterials}
      canManageStructure={props.canEditMaterials && !reorderDraft}
      canManageOrder={props.canEditMaterials}
      editableFields={reorderDraft ? REORDER_MATERIAL_EDITABLE_FIELDS : undefined}
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
      partnerOptions={eligiblePartnerOptions}
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
              accessibilityLabel="레시피 목록으로 돌아가기"
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
            <View style={styles.mediaColumn}>
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
              <Text style={styles.statusBadge}>{formatWorkOrderStatus(header.status)}</Text>
            </View>

            <View style={styles.heroText}>
              <View style={styles.identityRow}>
                <View style={styles.statusRow}>
                  {header.identity.reorderRound > 0 ? <Text style={styles.identityBadge}>{header.identity.reorderRound}차 리오더</Text> : null}
                  {header.identity.derivationKind === "rework" ? <Text style={styles.identityBadge}>재작업</Text> : null}
                </View>
                {header.identity.reorderRound === 0 && specificationEditable
                  ? <WorkOrderCharacterChoice disabled={props.samplePending} isSample={header.identity.isSample} onChange={props.onSetSample} presentation="compact" />
                  : <Text style={styles.identityFixed}>{header.identity.isSample ? "샘플" : "본생산"}</Text>}
              </View>
              <ControlledInlineEditValue
                accessibilityLabel="제품명"
                active={props.activeBasicField === "productName"}
                allowEditingWhileSaving
                commitMode="blur-submit"
                containerStyle={styles.heroInlineField}
                dirty={props.dirty}
                displayStyle={[styles.title, compactPhoneHero && styles.titleCompactPhone]}
                displayValue={header.productName}
                editable={specificationEditable}
                errorMessage={props.fieldErrors.productName ?? null}
                invalid={Boolean(props.fieldErrors.productName)}
                maxLength={200}
                onActivate={() => props.onBeginEdit("productName")}
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
                    decision={categoryDecision?.field === "targetAudience" ? categoryDecisionOverlay : null}
                    field="targetAudience"
                    kind="option"
                    label="대상"
                    onApply={(value) => {
                      const override = value === "남성" && props.draft.categoryMajor === "원피스"
                        ? { targetAudience: value, categoryMajor: "", categoryDetail: "" }
                        : { targetAudience: value };
                      if (value !== props.draft.targetAudience && hasCategoryDependents) {
                        setCategoryDecision({ field: "targetAudience", override });
                        return false;
                      }
                      setCategoryReelField(null);
                      props.onApplyPicker(override);
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
                    decision={categoryDecision?.field === "categoryMajor" ? categoryDecisionOverlay : null}
                    field="categoryMajor"
                    kind="option"
                    label="대분류"
                    onApply={(value) => {
                      const override = { categoryMajor: value };
                      if (value !== props.draft.categoryMajor && hasCategoryDependents) {
                        setCategoryDecision({ field: "categoryMajor", override });
                        return false;
                      }
                      setCategoryReelField(null);
                      props.onApplyPicker(override);
                    }}
                    onCancel={() => {
                      setCategoryReelField(null);
                      props.onCancelEdit();
                    }}
                    options={workOrderMajorCategoryPickerOptions(props.draft.categoryMajor, props.draft.targetAudience as WorkOrderTargetAudience)}
                    unitCode=""
                    value={props.draft.categoryMajor}
                    visible
                  />
                ) : null}
                {categoryReelField === "categoryDetail" ? <WorkOrderDetailItemPickerSheet
                  categoryCode={WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL[props.draft.categoryMajor as keyof typeof WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL] ?? null}
                  onApply={(value) => {
                    setCategoryReelField(null);
                    props.onApplyPicker({ categoryDetail: value });
                  }}
                  onCancel={() => { setCategoryReelField(null); props.onCancelEdit(); }}
                  value={props.draft.categoryDetail}
                /> : null}
                {categoryReelField === "seasonCode" ? <WorkOrderSeasonPickerSheet
                  onApply={(value) => {
                    setCategoryReelField(null);
                    props.onApplyPicker({ seasonCode: value });
                  }}
                  onCancel={() => { setCategoryReelField(null); props.onCancelEdit(); }}
                  value={props.draft.seasonCode}
                /> : null}
              </Section>
              <Section title="비용 구성">
                <View style={styles.costRowGroup}>
                  <MetricLine label="원단" value={formatWon(detail.amounts.fabricTotal)} />
                  <MetricLine label="부자재" value={formatWon(detail.amounts.accessoryTotal)} />
                  <MetricLine label="공정" value={formatWon(detail.amounts.processTotal)} />
                  <MetricLine label="예상 1벌 원가" value={formatEstimatedUnitCost(detail.amounts.estimatedTotal, header.totalQuantity)} />
                </View>
                <View style={styles.costFinalResult}>
                  <MetricLine emphasized label="예상 총원가" value={formatWon(detail.amounts.estimatedTotal)} />
                </View>
              </Section>
              <WaflReadinessActionRow issueCount={readinessIssues.length} onPress={() => setReadinessSheetVisible(true)} />
              {props.seriesHistoryCount >= 2 ? <WaflWorkActionRow kind="history" label={`작업 이력 ${props.seriesHistoryCount}건`} onPress={props.onOpenSeriesHistory} /> : null}
              {props.canCreateReorder ? <WaflWorkActionRow kind="reorder" label="리오더 만들기" onPress={props.onOpenReorder} /> : null}
              <WaflInputSheet
                cancelAccessibilityLabel="발행 전 확인 닫기"
                measurementVariant={`preissue-${readinessIssues.length}`}
                onAfterClose={finishReadinessClose}
                onCancel={() => setReadinessSheetVisible(false)}
                sizing="adaptiveExpandable"
                title="발행 전 확인"
                visible={readinessSheetVisible}
              >
                <View style={styles.readinessSheetBody} testID="preissue-readiness-sheet-list">
                  <Text style={styles.readinessSheetSubtitle}>{readinessIssues.length}개의 항목을 확인해 주세요</Text>
                  {readinessIssues.map((issue) => {
                    const destination = resolveReadinessIssueDestination(issue.code);
                    const content = <>
                      <View style={styles.readinessIssueText}>
                        <Text style={styles.readinessIssueMessage}>{issue.message}</Text>
                        {destination ? <Text style={styles.readinessIssueDestination}>{destination.label}</Text> : null}
                      </View>
                      {destination ? <ChevronRight color={WAFL_THEME.color.readOnly} size={WAFL_THEME.icon.small} /> : null}
                    </>;
                    if (!destination) return <View key={issue.code} style={styles.readinessIssueRow} testID={`preissue-row-${issue.code}`}>{content}</View>;
                    return <Pressable accessibilityLabel={`${issue.message} ${destination.label} 탭으로 이동`} accessibilityRole="button" key={issue.code} onPress={() => {
                      pendingReadinessIntentRef.current = destination.intent;
                      setReadinessSheetVisible(false);
                    }} style={({ pressed }) => [styles.readinessIssueRow, pressed && styles.pressed]} testID={`preissue-row-${issue.code}`}>{content}</Pressable>;
                  })}
                </View>
              </WaflInputSheet>
            </View>
          ) : activeSection === "media" ? (
            <WorkOrderImageGallery
              busy={props.imageBusy}
              busyImageId={props.imageBusyId}
              canEdit={specificationEditable}
              images={props.images}
              message={props.imageMessage}
                onAcquire={props.onAcquireImage}
                onDelete={props.onDeleteImage}
              onSetRepresentative={props.onSetRepresentativeImage}
              onSetOutputInclude={props.onSetImageOutputInclude}
            />
          ) : activeSection === "sizes" ? (
            <WorkOrderSizeColorStructureEditor
              edit={props.sizeColorEdit}
              identity={props.sizeColor.identity}
              itemCode={detail.header.itemCode}
              onRetry={props.sizeColor.onRetry}
              productTypeCode={detail.header.productTypeCode}
              state={props.sizeColor.state}
            />
          ) : activeSection === "production" ? (
            <WorkOrderProductionAuthoring
              confirmedMemoEditable={props.canEditConfirmedMutable}
              draftBatch={props.draftBatch}
              key={detail.header.id}
              onConfirmedMutableCommitted={props.onRefreshConfirmedDocument}
              onMutationCommitted={props.onRefreshReadinessAfterMutation}
              onActionProcessing={props.onActionProcessing}
              onActionSuccess={props.onActionSuccess}
              reorderDraft={reorderDraft}
              workOrderId={detail.header.id}
            />
          ) : activeSection === "output" ? (
            <WorkOrderDocumentWorkbench
              attachments={props.attachments}
              attachmentBusy={props.imageBusy}
              detail={detail}
              onFlushDraft={async () => { await props.draftBatch.flushAll("confirm"); }}
              onOpenSizeColor={props.sizeColor.onOpen}
              onRefresh={props.onRefreshDocuments}
              onActionProcessing={props.onActionProcessing}
              onAcquirePdfAttachment={props.onAcquireAttachment}
              onApplyAttachmentSelection={props.onApplyAttachmentSelection}
              onDeleteAttachment={props.onDeleteAttachment}
              onOpenAttachment={props.onOpenAttachment}
              onRequestActionConfirmation={props.onRequestActionConfirmation}
              sizeColorMatrix={props.sizeColor.state.bundle?.matrix ?? null}
            />
          ) : (
            <View style={styles.materialsCombined}
              testID="work-order-combined-materials"
            >
              <WaflSectionCard>
                <WaflMaterialsCategorySwitch
                  accessoryCount={detail.tabCounts.accessory}
                  canAdd={props.canEditMaterials && !reorderDraft}
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
                      partnerOptions={materialPartnerOptionsFor(props.materialPartnerOptions, activeMaterialCategory)}
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
  mediaColumn: { alignItems: "center", flexShrink: 0, gap: WAFL_THEME.layout.tightGap },
  mediaFrame: { alignItems: "center", backgroundColor: "#efe4d3", borderRadius: 12, flexShrink: 0, height: 96, justifyContent: "center", overflow: "hidden", padding: 7, position: "relative", width: 80 },
  mediaFrameCompactPhone: { height: 90, width: 72 },
  mediaFrameTablet: { height: 148, width: 132 },
  heroMediaImage: { height: "100%", width: "100%" },
  mediaLabel: { bottom: 7, color: "#51483e", fontFamily: WAFL_FONTS.semibold, fontSize: 8, left: 5, lineHeight: 11, position: "absolute", right: 5, textAlign: "center" },
  heroText: { flex: 1, flexGrow: 1, flexShrink: 1, gap: 6, justifyContent: "flex-start", minWidth: 0 },
  identityRow: { alignItems: "flex-start", columnGap: 7, flexDirection: "row", justifyContent: "space-between", minHeight: WAFL_THEME.touch.minimum },
  statusRow: { alignItems: "center", flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 7, minWidth: 0, paddingTop: WAFL_THEME.spacing.xs },
  statusBadge: { alignSelf: "center", backgroundColor: "#23375a", borderRadius: 999, color: "#ffffff", fontFamily: WAFL_FONTS.bold, fontSize: 11, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4 },
  identityBadge: { backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: 999, color: "#67584c", fontFamily: WAFL_FONTS.semibold, fontSize: 10, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  identityFixed: { alignSelf: "center", color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: 10, paddingHorizontal: 8, paddingVertical: 4 },
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
  readinessSheetBody: { gap: WAFL_THEME.layout.tightGap, paddingBottom: WAFL_THEME.spacing.sm },
  readinessSheetSubtitle: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight, paddingBottom: WAFL_THEME.spacing.sm },
  readinessIssueRow: { alignItems: "center", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, flexDirection: "row", gap: WAFL_THEME.layout.controlGap, minHeight: WAFL_THEME.touch.minimum, paddingVertical: WAFL_THEME.spacing.sm },
  readinessIssueText: { flex: 1, minWidth: 0 },
  readinessIssueMessage: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
  readinessIssueDestination: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, marginTop: 2 },
  metricLine: { alignItems: "center", borderBottomColor: "#f0e7dc", borderBottomWidth: 1, flexDirection: "row", gap: 10, justifyContent: "space-between", minHeight: 38, paddingVertical: 7 },
  metricLineEmphasized: { borderBottomWidth: 0 },
  metricLabel: { color: "#7a6c5c", flexShrink: 0, fontFamily: WAFL_FONTS.medium, fontSize: 11 },
  metricValue: { color: "#17263d", flex: 1, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 13, lineHeight: 18, minWidth: 0, textAlign: "right" },
  metricValueEmphasized: { color: "#23375a", fontFamily: WAFL_FONTS.black, fontSize: 15 },
  costRowGroup: { backgroundColor: "#f7f9fc", borderRadius: WAFL_THEME.radius.field, paddingHorizontal: WAFL_THEME.layout.definitionRowInset },
  costFinalResult: { backgroundColor: "#edf1f7", borderColor: "#cbd5e2", borderRadius: WAFL_THEME.radius.field, borderWidth: 1, marginTop: 7, paddingHorizontal: WAFL_THEME.layout.definitionRowInset },
});
