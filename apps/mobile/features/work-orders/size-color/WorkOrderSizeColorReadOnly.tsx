import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, ChevronDown, ChevronRight, Download, Palette, RefreshCw, Ruler, Save } from "lucide-react-native";

import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import { WAFL_TABLE_EDITABLE_CELL_SURFACE } from "@/components/waflEditableValueSurface";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { MeasurementTemplateSummary, WorkOrderSizeColorMatrix, WorkOrderSizeSpec, WorkOrderSizeSpecCell } from "@/domain/mobileContract";
import { formatMeasurementFromCm, normalizeCentimeterDraft, parseMeasurementToCm } from "@/domain/measurementPolicy";
import { resolveWaflBasicSpecRecommendationCategory, type WorkOrderMajorCategoryCode } from "@/domain/workOrderCategoryPolicy";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import WaflInputSheet, { type WaflSheetBodyScrollMetrics } from "@/features/inputs/WaflInputSheet";
import WaflSectionCard from "@/features/layout/WaflSectionCard";
import WaflSectionHeaderAction from "@/features/layout/WaflSectionHeaderAction";
import WaflFrozenAxisTable, { type WaflFrozenAxisRow } from "@/features/layout/WaflFrozenAxisTable";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import { getMeasurementTemplates, patchCompanyMeasurementTemplate } from "@/lib/api/measurementApi";
import { CompanyTemplateSaveSheet, MeasurementTemplatePickerSheet } from "./MeasurementTemplateSheets";
import type { SizeColorCacheEntry } from "./sizeColorCache";
import { formatDecimal, quantityCellMap, sizeSpecCellMap, sumQuantities, type MeasurementDisplayUnit } from "./sizeColorDisplayModel";
import { isSizeColorCommandPending } from "./sizeColorPendingPolicy";
import {
  createBoundedPreview,
  needsMatrixFullView,
  needsSpecFullView,
  SIZE_COLOR_MAIN_PREVIEW_LIMIT,
  SIZE_SPEC_MAIN_PREVIEW_LIMIT,
} from "./sizeColorMainPreviewPolicy";
import type { SizeColorStructureEditBoundary } from "./useSizeColorStructureEditController";

type Props = {
  readonly identity: string;
  readonly state: SizeColorCacheEntry;
  readonly onRetry: () => void;
  readonly edit?: SizeColorStructureEditBoundary;
  readonly onEditColor?: () => void;
  readonly onEditSize?: () => void;
  readonly onEditSpecItems?: () => void;
  readonly structureBusy?: boolean;
  readonly categoryCode?: WorkOrderMajorCategoryCode | null;
  readonly itemCode?: string | null;
};

const CONTENT_INSET = 12;

function EmptyNotice({ children }: { readonly children: string }) {
  return <View style={styles.contentInset}><Text style={styles.emptyNotice}>{children}</Text></View>;
}

function SpecItemEntry({ onPress }: { readonly onPress: () => void }) {
  return <Pressable accessibilityLabel="스펙 항목 선택" accessibilityRole="button" onPress={onPress} style={styles.specItemEntry}>
    <Text style={styles.headerEntryText}>스펙 항목</Text>
    <ChevronRight color={WAFL_THEME.color.navyInk} size={14} />
  </Pressable>;
}

function QuantityCellEditor(props: {
  readonly colorId: string;
  readonly sizeRowId: string;
  readonly colorName: string;
  readonly sizeLabel: string;
  readonly value: string;
  readonly edit: SizeColorStructureEditBoundary;
  readonly onEditingChange: (active: boolean) => void;
}) {
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState(props.value);
  return <ControlledInlineEditValue
    accessibilityLabel={`${props.colorName} ${props.sizeLabel} 수량`}
    active={active}
    allowEditingWhileSaving
    commitMode="blur-submit"
    dirty={draft !== props.value}
    displayStyle={styles.cellText}
    displayValue={formatDecimal(props.value)}
    editable
    keyboardType="number-pad"
    maxLength={9}
    onActivate={() => { setDraft(props.value); setActive(true); props.onEditingChange(true); }}
    onCancel={() => { setDraft(props.value); setActive(false); props.onEditingChange(false); }}
    onChange={setDraft}
    onSave={(value) => {
      const quantity = /^\d+$/u.test(value) ? Number(value) : -1;
      void props.edit.onSetQuantity(props.colorId, props.sizeRowId, quantity).then((saved) => {
        if (!saved) setDraft(props.value);
        setActive(false);
        props.onEditingChange(false);
      });
    }}
    placeholder="0"
    presentation="tableCell"
    saving={isSizeColorCommandPending(props.edit.pendingScope, "quantity")}
    testID={`size-color-quantity-${props.colorId}-${props.sizeRowId}`}
    value={draft}
  />;
}

function canonicalCellDisplay(cell: WorkOrderSizeSpecCell | undefined, unit: MeasurementDisplayUnit) {
  if (!cell?.decimalValue) return "";
  const centimeters = Number(cell.decimalValue);
  return Number.isFinite(centimeters) ? formatMeasurementFromCm(centimeters, unit) : "";
}

function MeasurementCellEditor(props: {
  readonly sizeRowId: string;
  readonly pomColumnId: string;
  readonly cell: WorkOrderSizeSpecCell | undefined;
  readonly storedUnit: MeasurementDisplayUnit;
  readonly edit: SizeColorStructureEditBoundary;
}) {
  const value = canonicalCellDisplay(props.cell, props.storedUnit);
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState(value);
  const [reelOpen, setReelOpen] = useState(false);

  if (props.storedUnit === "inch") {
    return <>
      <Pressable
        accessibilityLabel={`완성 스펙 ${value || "미입력"}, 인치 릴 열기`}
        disabled={isSizeColorCommandPending(props.edit.pendingScope, "measurement-cell")}
        onPress={() => setReelOpen(true)}
        style={({ pressed }) => [WAFL_TABLE_EDITABLE_CELL_SURFACE, styles.measurementPressable, pressed && styles.pressed]}
      >
        <Text style={styles.cellText}>{value || "-"}</Text>
      </Pressable>
      <WaflReelPickerSheet
        field={`${props.pomColumnId}:${props.sizeRowId}`}
        kind="eighth-inch"
        label="완성 스펙"
        onApply={async (nextValue) => {
          const saved = await props.edit.onSetMeasurementCell(props.sizeRowId, props.pomColumnId, "inch", nextValue);
          if (saved) setReelOpen(false);
          return saved;
        }}
        onCancel={() => setReelOpen(false)}
        unitCode="inch"
        value={value || "0"}
        visible={reelOpen}
      />
    </>;
  }

  return <ControlledInlineEditValue
    accessibilityLabel="완성 스펙 값"
    active={active}
    commitMode="blur-submit"
    dirty={draft !== value}
    displayStyle={styles.cellText}
    displayValue={value || "-"}
    editable={!isSizeColorCommandPending(props.edit.pendingScope, "measurement-cell")}
    keyboardType="decimal-pad"
    maxLength={16}
    onActivate={() => { setDraft(value); setActive(true); }}
    onCancel={() => { setDraft(value); setActive(false); }}
    onChange={(next) => setDraft(normalizeCentimeterDraft(next))}
    onSave={(next) => {
      const normalized = next.trim();
      if (normalized && !parseMeasurementToCm(normalized, "cm")) {
        setDraft(value);
        setActive(false);
        return;
      }
      void props.edit.onSetMeasurementCell(props.sizeRowId, props.pomColumnId, "cm", normalized || null).then((saved) => {
        if (!saved) setDraft(value);
        setActive(false);
      });
    }}
    placeholder="0"
    presentation="tableCell"
    saving={isSizeColorCommandPending(props.edit.pendingScope, "measurement-cell")}
    testID={`measurement-${props.pomColumnId}-${props.sizeRowId}`}
    value={draft}
  />;
}

function MatrixTable(props: {
  readonly matrix: WorkOrderSizeColorMatrix;
  readonly edit?: SizeColorStructureEditBoundary;
  readonly preview: boolean;
}) {
  const quantities = quantityCellMap(props.matrix.quantityCells);
  const colors = props.preview
    ? createBoundedPreview(props.matrix.colors, SIZE_COLOR_MAIN_PREVIEW_LIMIT).items
    : props.matrix.colors;
  const columns = [
    ...props.matrix.sizes.map((size) => ({ key: size.id, label: size.displayLabel })),
    { key: "total", label: "합계" },
  ];
  const rows: WaflFrozenAxisRow[] = colors.map((color) => {
      const visibleValues = props.matrix.sizes.map((size) => quantities.get(`${color.id}:${size.id}`) ?? "0");
      const allValues = props.matrix.sizes.map((size) => quantities.get(`${color.id}:${size.id}`) ?? "0");
      return {
        key: color.id,
        label: <><View style={[styles.swatch, { backgroundColor: color.hexValue ?? WAFL_THEME.color.paperMuted }]} /><Text numberOfLines={2} style={styles.cellText}>{color.displayName}</Text></>,
        cells: [
          ...visibleValues.map((value, index) => { const size = props.matrix.sizes[index]; return props.edit?.canEdit ? <QuantityCellEditor colorId={color.id} colorName={color.displayName} edit={props.edit} key={size.id} onEditingChange={() => undefined} sizeLabel={size.displayLabel} sizeRowId={size.id} value={value} /> : <Text key={size.id} style={styles.cellText}>{formatDecimal(value)}</Text>; }),
          <Text key="total" style={styles.totalText}>{formatDecimal(String(sumQuantities(allValues)))}</Text>,
        ],
      };
    });
  rows.push({
    emphasized: true,
    key: "total",
    label: <Text style={styles.totalText}>합계</Text>,
    cells: [
      ...props.matrix.sizes.map((size) => <Text key={size.id} style={styles.totalText}>{formatDecimal(String(sumQuantities(props.matrix.colors.map((color) => quantities.get(`${color.id}:${size.id}`) ?? "0"))))}</Text>),
      <Text key="total" style={styles.grandTotalText}>{formatDecimal(props.matrix.matrixTotal)}</Text>,
    ],
  });
  return <WaflFrozenAxisTable
    columns={columns}
    cornerLabel="색상"
    fullView={!props.preview}
    rows={rows}
    testID={props.preview ? "size-color-main-matrix-preview" : "size-color-full-matrix"}
  />;
}

function SpecTable(props: {
  readonly specifications: WorkOrderSizeSpec;
  readonly edit?: SizeColorStructureEditBoundary;
  readonly preview: boolean;
  readonly onEditSpecItems?: () => void;
  readonly parentOwnsVerticalScroll?: boolean;
}) {
  const measurements = sizeSpecCellMap(props.specifications.cells);
  const poms = props.preview
    ? createBoundedPreview(props.specifications.pomColumns, SIZE_SPEC_MAIN_PREVIEW_LIMIT).items
    : props.specifications.pomColumns;
  const rows: WaflFrozenAxisRow[] = poms.map((pom) => ({
    key: pom.id,
    label: <Text numberOfLines={2} style={styles.cellText}>{pom.displayName}</Text>,
    cells: props.specifications.sizes.map((size) => { const cell = measurements.get(`${pom.id}:${size.id}`); return props.edit?.canEdit ? <MeasurementCellEditor cell={cell} edit={props.edit} pomColumnId={pom.id} sizeRowId={size.id} storedUnit={props.specifications.measurementUnit} /> : <Text style={styles.cellText}>{canonicalCellDisplay(cell, props.specifications.measurementUnit) || "-"}</Text>; }),
  }));
  return <WaflFrozenAxisTable
    columns={props.specifications.sizes.map((size) => ({ key: size.id, label: size.displayLabel }))}
    cornerLabel={props.onEditSpecItems ? <SpecItemEntry onPress={props.onEditSpecItems} /> : "스펙 항목"}
    fullView={!props.preview}
    fullViewVerticalOwner={props.parentOwnsVerticalScroll ? "parent" : "table"}
    expandSingleColumn={!props.preview}
    rows={rows}
    testID={props.preview ? "size-spec-main-preview" : "size-spec-full-view"}
  />;
}

export default function WorkOrderSizeColorReadOnly({ identity, state, onRetry, edit, onEditColor, onEditSize, onEditSpecItems, structureBusy = false, categoryCode = null, itemCode = null }: Props) {
  const specifications = state.bundle?.specifications;
  const sectionIdentity = specifications ? `${specifications.workOrderId}:${specifications.revisionId}` : identity;
  const effectiveCategoryCode = resolveWaflBasicSpecRecommendationCategory(categoryCode);
  const templateQueryIdentity = specifications ? `${sectionIdentity}:${effectiveCategoryCode ?? ""}:${itemCode ?? ""}:${specifications.genderCode ?? ""}` : `unavailable:${state.status}`;
  const [templates, setTemplates] = useState<readonly MeasurementTemplateSummary[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [templateSaveOpen, setTemplateSaveOpen] = useState(false);
  const [fullView, setFullView] = useState<"matrix" | "spec" | null>(null);
  const [specCanScrollFurther, setSpecCanScrollFurther] = useState(false);
  const [readOnlyMeasurementUnit, setReadOnlyMeasurementUnit] = useState<{ readonly identity: string; readonly unit: MeasurementDisplayUnit } | null>(null);
  const loadedTemplateIdentity = useRef<string | null>(null);

  const loadTemplates = useCallback(async (force = false) => {
    const current = specifications;
    if (!edit?.canEdit || !current) return false;
    if (!force && loadedTemplateIdentity.current === templateQueryIdentity) return true;
    setTemplateLoading(true);
    try {
      const items = await getMeasurementTemplates(current.workOrderId, effectiveCategoryCode, current.genderCode);
      setTemplates(items);
      loadedTemplateIdentity.current = templateQueryIdentity;
      setTemplateError(null);
      return true;
    } catch {
      setTemplateError("스펙 목록을 불러오지 못했습니다.");
      return false;
    } finally {
      setTemplateLoading(false);
    }
  }, [edit?.canEdit, effectiveCategoryCode, specifications, templateQueryIdentity]);

  if (!state.bundle && ["not-loaded", "loading", "retrying", "refreshing"].includes(state.status)) {
    return <DelayedLoadingMessage identity={`${identity}:size-color`} loading scope="sizeColor" />;
  }
  if (state.status === "error" || !state.bundle) {
    return <View style={styles.statePanel}>
      <AlertTriangle color={WAFL_THEME.color.error} size={20} />
      <Text style={styles.stateTitle}>사이즈·색상을 불러오지 못했습니다.</Text>
      <Text style={styles.stateText}>{state.errorMessage ?? "연결 상태를 확인한 뒤 다시 시도해 주세요."}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><RefreshCw color="#fffdf8" size={15} /><Text style={styles.retryText}>다시 시도</Text></Pressable>
    </View>;
  }

  const { matrix } = state.bundle;
  const persistedSpecifications = state.bundle.specifications;
  const displayMeasurementUnit = readOnlyMeasurementUnit?.identity === sectionIdentity ? readOnlyMeasurementUnit.unit : persistedSpecifications.measurementUnit;
  const currentSpecifications: WorkOrderSizeSpec = displayMeasurementUnit === persistedSpecifications.measurementUnit
    ? persistedSpecifications
    : {
      ...persistedSpecifications,
      measurementUnit: displayMeasurementUnit,
      cells: persistedSpecifications.cells.map((cell) => ({
        ...cell,
        displayValue: cell.decimalValue === null ? null : formatMeasurementFromCm(Number(cell.decimalValue), displayMeasurementUnit),
      })),
    };
  const measurements = sizeSpecCellMap(currentSpecifications.cells);
  const structuredMatrixEmpty = matrix.sizes.length === 0 && matrix.colors.length === 0 && matrix.quantityCells.length === 0;
  const missingMeasurementCount = currentSpecifications.pomColumns.reduce((count, pom) => count + currentSpecifications.sizes.filter((size) => !measurements.get(`${pom.id}:${size.id}`)?.decimalValue).length, 0);
  const matrixNeedsFullView = needsMatrixFullView(matrix.sizes.length, matrix.colors.length);
  const specNeedsFullView = needsSpecFullView(currentSpecifications.sizes.length, currentSpecifications.pomColumns.length);
  const structureActions = edit?.canEditStructure && onEditSize && onEditColor ? <View style={styles.structureActions}>
    <WaflSectionHeaderAction accessibilityLabel="사이즈 선택" disabled={structureBusy} icon={<Ruler color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.small} />} label="사이즈" onPress={onEditSize} testID="work-order-size-selection-action" />
    <WaflSectionHeaderAction accessibilityLabel="색상 선택" disabled={structureBusy} icon={<Palette color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.small} />} label="색상" onPress={onEditColor} testID="work-order-color-selection-action" />
  </View> : null;

  return <View accessibilityLabel="사이즈·색상 및 완성 스펙 정보" style={styles.container}>
    {!matrix.projectionsMatch ? <View style={styles.contentStack}><View style={styles.warning}><AlertTriangle color={WAFL_THEME.color.brickOrange} size={16} /><Text style={styles.warningText}>저장된 총수량과 색상×사이즈 합계가 다릅니다. 수량 값을 저장하면 합계가 함께 정리됩니다.</Text></View></View> : null}

    <WaflSectionCard headerAction={structureActions} style={styles.sectionCard} testID="size-color-expanded-matrix-card" title="색상·사이즈">
      {matrix.sizes.length === 0 && matrix.colors.length === 0 ? <EmptyNotice>등록된 사이즈와 색상이 없습니다.</EmptyNotice> : matrix.sizes.length === 0 ? <EmptyNotice>색상은 있지만 등록된 사이즈가 없어 수량표를 만들 수 없습니다.</EmptyNotice> : matrix.colors.length === 0 ? <EmptyNotice>사이즈는 있지만 등록된 색상이 없어 수량표를 만들 수 없습니다.</EmptyNotice> : <>
        {matrix.quantityCells.length === 0 ? <EmptyNotice>등록된 수량 값이 없어 각 값을 0으로 표시합니다.</EmptyNotice> : null}
        <MatrixTable edit={edit} matrix={matrix} preview />
        {matrixNeedsFullView ? <Pressable accessibilityLabel="색상·사이즈 전체보기" accessibilityRole="button" onPress={() => setFullView("matrix")} style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}><Text style={styles.viewAllText}>전체보기</Text><ChevronRight color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.small} /></Pressable> : null}
      </>}
      {structuredMatrixEmpty && matrix.memoFallback?.trim() ? <View style={styles.memo}><Text style={styles.memoLabel}>기존 수량 메모</Text><Text style={styles.memoText}>{matrix.memoFallback}</Text></View> : null}
    </WaflSectionCard>

    <WaflSectionCard style={styles.sectionCard} testID="finished-spec-expanded-card">
      <View style={styles.specHeaderStack}><View style={styles.sectionHeadingRow}>
        <View style={styles.measurementHeading}>
          <Text style={styles.sectionTitle}>완성 스펙</Text>
          {currentSpecifications.templateName ? <Text numberOfLines={1} style={styles.templateSource}>{currentSpecifications.templateName}</Text> : null}
          {currentSpecifications.sourceTemplateModified ? <Text accessibilityLabel="원본 스펙에서 수정됨" style={styles.modifiedBadge}>수정됨</Text> : null}
          {missingMeasurementCount > 0 ? <Text accessibilityLabel={`미입력 스펙값 ${missingMeasurementCount}개`} style={styles.missingBadge}>미입력 {missingMeasurementCount}</Text> : null}
        </View>
        {edit?.canEditStructure ? <Pressable accessibilityLabel="스펙 불러오기" accessibilityRole="button" disabled={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} onPress={() => { void loadTemplates().then((loaded) => { if (loaded) setTemplatePickerOpen(true); }); }} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed, (isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading) && styles.disabled]}><Download color={WAFL_THEME.color.navyInk} size={17} /></Pressable> : null}
        {edit?.canEditStructure ? <Pressable accessibilityLabel="스펙 저장" accessibilityRole="button" disabled={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} onPress={() => { void loadTemplates().then((loaded) => { if (loaded) setTemplateSaveOpen(true); }); }} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed, (isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading) && styles.disabled]}><Save color={WAFL_THEME.color.navyInk} size={17} /></Pressable> : null}
      </View>
      <View style={styles.specUnitRow}><View accessibilityLabel="완성 스펙 표시 단위" style={styles.unitSegment}>{(["cm", "inch"] as const).map((unit) => { const selected = currentSpecifications.measurementUnit === unit; const unitPending = isSizeColorCommandPending(edit?.pendingScope ?? null, "measurement-unit"); return <Pressable accessibilityHint={edit?.canEditStructure ? "단위를 변경하면 레시피에 저장됩니다." : "읽기 화면의 표시 단위만 변경합니다."} accessibilityLabel={`완성 스펙 ${unit} 표시`} accessibilityRole="button" accessibilityState={{ selected, busy: unitPending }} disabled={unitPending} key={unit} onPress={() => { if (unit === currentSpecifications.measurementUnit) return; if (edit?.canEditStructure) void edit.onSetMeasurementUnit(unit); else setReadOnlyMeasurementUnit({ identity: sectionIdentity, unit }); }} style={({ pressed }) => [styles.unitOption, selected && styles.unitOptionSelected, pressed && styles.pressed]}><Text style={[styles.unitText, selected && styles.unitTextSelected]}>{unit}</Text></Pressable>; })}</View></View>
      </View>

      {templateError ? <Text style={styles.templateError}>{templateError}</Text> : null}

      {currentSpecifications.pomColumns.length === 0 || currentSpecifications.sizes.length === 0 ? <View style={styles.emptySpecState}>
        <EmptyNotice>등록된 완성 스펙 정보가 없습니다.</EmptyNotice>
        {edit?.canEditStructure && onEditSpecItems ? <View style={styles.emptySpecEntry}><SpecItemEntry onPress={onEditSpecItems} /></View> : null}
      </View> : <>
        {missingMeasurementCount > 0 ? <View style={styles.missingWarning}><AlertTriangle color={WAFL_THEME.color.brickOrange} size={15} /><Text style={styles.missingWarningText}>미입력 스펙값은 -로 표시됩니다.</Text></View> : null}
        <SpecTable edit={edit?.canEditStructure ? edit : undefined} onEditSpecItems={edit?.canEditStructure ? onEditSpecItems : undefined} preview specifications={currentSpecifications} />
        {specNeedsFullView ? <Pressable accessibilityLabel="완성 스펙 전체보기" accessibilityRole="button" onPress={() => setFullView("spec")} style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}><Text style={styles.viewAllText}>전체보기</Text><ChevronRight color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.small} /></Pressable> : null}
      </>}
    </WaflSectionCard>
    <WaflInputSheet bodyScrollable={fullView === "spec"} cancelAccessibilityLabel="전체보기 닫기" confirmAccessibilityLabel="전체보기 확인" contentStyle={styles.fullViewContent} onBodyScrollMetrics={(metrics: WaflSheetBodyScrollMetrics) => {
      if (fullView === "spec") setSpecCanScrollFurther((current) => current === metrics.canScrollFurther ? current : metrics.canScrollFurther);
    }} onCancel={() => setFullView(null)} onConfirm={() => setFullView(null)} sizing="fullView" title={fullView === "matrix" ? "색상·사이즈 전체보기" : "완성 스펙 전체보기"} visible={fullView !== null}>
      {fullView === "matrix" ? <MatrixTable edit={edit} matrix={matrix} preview={false} /> : fullView === "spec" ? <>
        <View style={styles.fullViewSummaryRow}>
          <Text style={styles.fullViewSummaryText}>총 {currentSpecifications.pomColumns.length}개 항목</Text>
          {specCanScrollFurther ? <View accessibilityLabel="아래 항목 더 있음" pointerEvents="none" style={styles.moreBelowHint}><Text style={styles.moreBelowText}>아래 항목 더 있음</Text><ChevronDown color={WAFL_THEME.color.readOnly} size={14} /></View> : null}
        </View>
        <SpecTable edit={edit?.canEditStructure ? edit : undefined} onEditSpecItems={edit?.canEditStructure ? onEditSpecItems : undefined} parentOwnsVerticalScroll preview={false} specifications={currentSpecifications} />
      </> : null}
    </WaflInputSheet>
    {edit ? <MeasurementTemplatePickerSheet errorMessage={templateError} onApply={async (template) => { const saved = await edit.onApplyMeasurementTemplate(template.id); if (saved) setTemplatePickerOpen(false); return saved; }} onCancel={() => setTemplatePickerOpen(false)} pending={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} templates={templates} visible={edit.canEditStructure && templatePickerOpen} /> : null}
    {edit ? <CompanyTemplateSaveSheet companyTemplates={templates.filter((item) => item.sourceKind === "company")} onCancel={() => setTemplateSaveOpen(false)} onDisable={async (template) => { await patchCompanyMeasurementTemplate(template.id, { isActive: false }); await loadTemplates(true); return true; }} onRename={async (template, name) => { await patchCompanyMeasurementTemplate(template.id, { name }); await loadTemplates(true); return true; }} onSaveNew={async (name) => { const saved = await edit.onSaveMeasurementTemplate(name); if (saved) { await loadTemplates(true); setTemplateSaveOpen(false); } return saved; }} onUpdateExisting={async (template) => { const saved = await edit.onUpdateMeasurementTemplate(template.id); if (saved) { await loadTemplates(true); setTemplateSaveOpen(false); } return saved; }} pending={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} visible={edit.canEditStructure && templateSaveOpen} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: WAFL_THEME.layout.sectionGap, paddingBottom: 22 }, contentStack: { gap: 12, paddingHorizontal: CONTENT_INSET }, contentInset: { paddingHorizontal: CONTENT_INSET },
  warning: { alignItems: "flex-start", backgroundColor: "#fff3e9", borderColor: "#efd0bc", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, padding: 11 }, warningText: { color: "#744531", flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18 },
  sectionCard: {}, specHeaderStack: { gap: WAFL_THEME.layout.actionTileGap }, sectionHeadingRow: { alignItems: "center", flexDirection: "row", gap: 7 }, structureActions: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.tightGap }, measurementHeading: { alignItems: "center", flex: 1, flexDirection: "row", flexWrap: "wrap", gap: WAFL_THEME.layout.actionTileGap, minHeight: WAFL_THEME.touch.minimum, minWidth: 0 }, specUnitRow: { alignItems: "flex-start", minHeight: 36 }, sectionTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.cardTitle.fontSize, lineHeight: WAFL_THEME.typography.cardTitle.lineHeight },
  templateSource: { color: WAFL_THEME.color.readOnly, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 10 }, modifiedBadge: { backgroundColor: "#fff0e7", borderColor: "#e8b79f", borderRadius: WAFL_THEME.radius.pill, borderWidth: 1, color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 }, missingBadge: { backgroundColor: "#fff8eb", borderColor: "#e7c98e", borderRadius: WAFL_THEME.radius.pill, borderWidth: 1, color: "#745721", fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 }, iconAction: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: 8, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  unitSegment: { backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.border, borderRadius: 9, borderWidth: 1, flexDirection: "row", padding: 2 }, unitOption: { alignItems: "center", borderRadius: 7, justifyContent: "center", minHeight: 30, minWidth: 41, paddingHorizontal: 7 }, unitOptionSelected: { backgroundColor: WAFL_THEME.color.navyInk }, unitText: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 10 }, unitTextSelected: { color: "#fffdf8", fontFamily: WAFL_FONTS.bold },
  templateError: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.medium, fontSize: 12, width: "100%" }, missingWarning: { alignItems: "center", backgroundColor: "#fff8eb", borderRadius: 8, flexDirection: "row", gap: 6, paddingHorizontal: 9, paddingVertical: 7 }, missingWarningText: { color: "#745721", fontFamily: WAFL_FONTS.medium, fontSize: 11 }, missingCell: { backgroundColor: "#fffaf0" },
  emptyNotice: { backgroundColor: "#faf7f1", borderRadius: 9, color: "#75665b", fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18, padding: 12 }, emptySpecState: { gap: WAFL_THEME.layout.tightGap }, emptySpecEntry: { alignSelf: "flex-start", marginHorizontal: CONTENT_INSET, minWidth: 112 }, fullViewContent: { minHeight: 0 }, fullViewSummaryRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 32 }, fullViewSummaryText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.meta.fontSize }, moreBelowHint: { alignItems: "center", flexDirection: "row", gap: 3 }, moreBelowText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize }, cellText: { color: WAFL_THEME.color.deepNavy, flexShrink: 1, fontFamily: WAFL_FONTS.medium, fontSize: 11, lineHeight: 17, textAlign: "center" }, measurementPressable: { alignItems: "center", justifyContent: "center", minWidth: 0 }, swatch: { borderColor: "#c8bcae", borderRadius: 7, borderWidth: 1, flexShrink: 0, height: 14, marginRight: 4, width: 14 }, totalText: { color: WAFL_THEME.color.navyInk, flexShrink: 1, fontFamily: WAFL_FONTS.semibold, fontSize: 10, textAlign: "center" }, grandTotalText: { color: WAFL_THEME.color.deepNavy, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 10, textAlign: "center" }, viewAll: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: WAFL_THEME.layout.tightGap, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.layout.tightGap }, viewAllText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize, lineHeight: WAFL_THEME.typography.actionLabel.lineHeight },
  specItemEntry: { alignItems: "center", flexDirection: "row", gap: 1, justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, width: "100%" }, headerEntryText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.meta.fontSize },
  memo: { backgroundColor: "#fbf6ee", borderRadius: 10, gap: 5, padding: 12 }, memoLabel: { color: "#806e60", fontFamily: WAFL_FONTS.semibold, fontSize: 11 }, memoText: { color: "#443930", fontFamily: WAFL_FONTS.regular, fontSize: 13, lineHeight: 20 }, statePanel: { alignItems: "center", backgroundColor: "#faf7f1", borderRadius: 12, gap: 9, margin: CONTENT_INSET, padding: 24 }, stateTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 15, textAlign: "center" }, stateText: { color: "#75665b", fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18, textAlign: "center" }, retryButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.brickOrange, borderRadius: 9, flexDirection: "row", gap: 6, marginTop: 4, minHeight: 42, paddingHorizontal: 14 }, retryText: { color: "#fffdf8", fontFamily: WAFL_FONTS.semibold, fontSize: 12 }, pressed: { opacity: 0.76 }, disabled: { opacity: 0.4 },
});
