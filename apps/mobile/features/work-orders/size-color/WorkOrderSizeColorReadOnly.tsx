import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, ChevronDown, ChevronRight, Download, RefreshCw, Save } from "lucide-react-native";

import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { MeasurementTemplateSummary, WorkOrderSizeSpecCell } from "@/domain/mobileContract";
import { formatMeasurementFromCm, normalizeCentimeterDraft, parseMeasurementToCm } from "@/domain/measurementPolicy";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import { getMeasurementTemplates, patchCompanyMeasurementTemplate } from "@/lib/apiClient";
import { CompanyTemplateSaveSheet, MeasurementTemplatePickerSheet } from "./MeasurementTemplateSheets";
import type { SizeColorCacheEntry } from "./sizeColorCache";
import { formatDecimal, quantityCellMap, sizeSpecCellMap, sumQuantities, type MeasurementDisplayUnit } from "./sizeColorDisplayModel";
import { isSizeColorCommandPending } from "./sizeColorPendingPolicy";
import type { SizeColorStructureEditBoundary } from "./useSizeColorStructureEditController";

type Props = {
  readonly identity: string;
  readonly state: SizeColorCacheEntry;
  readonly onRetry: () => void;
  readonly edit?: SizeColorStructureEditBoundary;
};

const CONTENT_INSET = 12;

function EmptyNotice({ children }: { readonly children: string }) {
  return <View style={styles.contentInset}><Text style={styles.emptyNotice}>{children}</Text></View>;
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
    commitMode="blur-submit"
    dirty={draft !== props.value}
    displayStyle={styles.cellText}
    displayValue={formatDecimal(props.value)}
    editable={!isSizeColorCommandPending(props.edit.pendingScope, "quantity")}
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
        style={({ pressed }) => [styles.measurementPressable, pressed && styles.pressed]}
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
    saving={isSizeColorCommandPending(props.edit.pendingScope, "measurement-cell")}
    testID={`measurement-${props.pomColumnId}-${props.sizeRowId}`}
    value={draft}
  />;
}

export default function WorkOrderSizeColorReadOnly({ identity, state, onRetry, edit }: Props) {
  const specifications = state.bundle?.specifications;
  const sectionIdentity = specifications ? `${specifications.workOrderId}:${specifications.revisionId}` : identity;
  const templateQueryIdentity = specifications ? `${sectionIdentity}:${specifications.categoryCode ?? ""}:${specifications.genderCode ?? ""}` : `unavailable:${state.status}`;
  const [sectionSessions, setSectionSessions] = useState<Record<string, { readonly quantityExpanded: boolean; readonly measurementExpanded: boolean }>>({});
  const [templates, setTemplates] = useState<readonly MeasurementTemplateSummary[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [templateSaveOpen, setTemplateSaveOpen] = useState(false);
  const loadedTemplateIdentity = useRef<string | null>(null);
  const sectionState = sectionSessions[sectionIdentity] ?? { quantityExpanded: false, measurementExpanded: false };
  const setSectionState = (patch: Partial<typeof sectionState>) => setSectionSessions((current) => ({ ...current, [sectionIdentity]: { ...sectionState, ...patch } }));

  const loadTemplates = useCallback(async (force = false) => {
    const current = specifications;
    if (!edit?.canEdit || !current) return false;
    if (!force && loadedTemplateIdentity.current === templateQueryIdentity) return true;
    setTemplateLoading(true);
    try {
      const items = await getMeasurementTemplates(current.workOrderId, current.categoryCode, current.genderCode);
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
  }, [edit?.canEdit, specifications, templateQueryIdentity]);

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
  const currentSpecifications = state.bundle.specifications;
  const quantities = quantityCellMap(matrix.quantityCells);
  const measurements = sizeSpecCellMap(currentSpecifications.cells);
  const structuredMatrixEmpty = matrix.sizes.length === 0 && matrix.colors.length === 0 && matrix.quantityCells.length === 0;
  const missingMeasurementCount = currentSpecifications.pomColumns.reduce((count, pom) => count + currentSpecifications.sizes.filter((size) => !measurements.get(`${pom.id}:${size.id}`)?.decimalValue).length, 0);

  return <View accessibilityLabel="사이즈·색상 및 완성 스펙 정보" style={styles.container}>
    {!matrix.projectionsMatch ? <View style={styles.contentStack}><View style={styles.warning}><AlertTriangle color={WAFL_THEME.color.brickOrange} size={16} /><Text style={styles.warningText}>저장된 총수량과 색상×사이즈 합계가 다릅니다. 수량 값을 저장하면 합계가 함께 정리됩니다.</Text></View></View> : null}

    <View style={styles.section}>
      <View style={styles.contentInset}><Pressable accessibilityLabel={`색상·사이즈 ${sectionState.quantityExpanded ? "접기" : "펼치기"}`} accessibilityRole="button" accessibilityState={{ expanded: sectionState.quantityExpanded }} onPress={() => setSectionState({ quantityExpanded: !sectionState.quantityExpanded })} style={styles.collapsibleHeader}><Text style={styles.sectionTitle}>색상·사이즈</Text>{sectionState.quantityExpanded ? <ChevronDown color={WAFL_THEME.color.navyInk} size={18} /> : <ChevronRight color={WAFL_THEME.color.navyInk} size={18} />}</Pressable></View>
      {sectionState.quantityExpanded ? matrix.sizes.length === 0 && matrix.colors.length === 0 ? <EmptyNotice>등록된 사이즈와 색상이 없습니다.</EmptyNotice> : matrix.sizes.length === 0 ? <EmptyNotice>색상은 있지만 등록된 사이즈가 없어 수량표를 만들 수 없습니다.</EmptyNotice> : matrix.colors.length === 0 ? <EmptyNotice>사이즈는 있지만 등록된 색상이 없어 수량표를 만들 수 없습니다.</EmptyNotice> : <>
        {matrix.quantityCells.length === 0 ? <EmptyNotice>등록된 수량 값이 없어 각 값을 0으로 표시합니다.</EmptyNotice> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.table} nestedScrollEnabled><View>
          <View style={styles.tableRow}><View style={[styles.cell, styles.nameCell, styles.headerCell]}><Text style={styles.headerText}>색상</Text></View>{matrix.sizes.map((size) => <View key={size.id} style={[styles.cell, styles.numberCell, styles.headerCell]}><Text style={styles.headerText}>{size.displayLabel}</Text></View>)}<View style={[styles.cell, styles.numberCell, styles.headerCell]}><Text style={styles.headerText}>합계</Text></View></View>
          {matrix.colors.map((color) => {
            const rowValues = matrix.sizes.map((size) => quantities.get(`${color.id}:${size.id}`) ?? "0");
            return <View key={color.id} style={styles.tableRow}><View style={[styles.cell, styles.nameCell]}><View style={[styles.swatch, { backgroundColor: color.hexValue ?? "#e7dfd3" }]} /><Text numberOfLines={2} style={styles.cellText}>{color.displayName}</Text></View>{rowValues.map((value, index) => { const size = matrix.sizes[index]; return <View key={size.id} style={[styles.cell, styles.numberCell]}>{edit?.canEdit ? <QuantityCellEditor colorId={color.id} colorName={color.displayName} edit={edit} onEditingChange={(active) => { if (active) setSectionState({ quantityExpanded: true }); }} sizeLabel={size.displayLabel} sizeRowId={size.id} value={value} /> : <Text style={styles.cellText}>{formatDecimal(value)}</Text>}</View>; })}<View style={[styles.cell, styles.numberCell, styles.totalCell]}><Text style={styles.totalText}>{formatDecimal(String(sumQuantities(rowValues)))}</Text></View></View>;
          })}
          <View style={styles.tableRow}><View style={[styles.cell, styles.nameCell, styles.totalCell]}><Text style={styles.totalText}>합계</Text></View>{matrix.sizes.map((size) => <View key={size.id} style={[styles.cell, styles.numberCell, styles.totalCell]}><Text style={styles.totalText}>{formatDecimal(String(sumQuantities(matrix.colors.map((color) => quantities.get(`${color.id}:${size.id}`) ?? "0"))))}</Text></View>)}<View style={[styles.cell, styles.numberCell, styles.grandTotalCell]}><Text style={styles.grandTotalText}>{formatDecimal(matrix.matrixTotal)}</Text></View></View>
        </View></ScrollView>
      </> : null}
      {sectionState.quantityExpanded && structuredMatrixEmpty && matrix.memoFallback?.trim() ? <View style={styles.contentInset}><View style={styles.memo}><Text style={styles.memoLabel}>기존 수량 메모</Text><Text style={styles.memoText}>{matrix.memoFallback}</Text></View></View> : null}
    </View>

    <View style={styles.section}>
      <View style={styles.contentInset}><View style={styles.specHeaderStack}><View style={styles.sectionHeadingRow}>
        <Pressable accessibilityLabel={`완성 스펙 ${sectionState.measurementExpanded ? "접기" : "펼치기"}`} accessibilityRole="button" accessibilityState={{ expanded: sectionState.measurementExpanded }} onPress={() => setSectionState({ measurementExpanded: !sectionState.measurementExpanded })} style={styles.measurementToggle}>
          <Text style={styles.sectionTitle}>완성 스펙</Text>
          {currentSpecifications.templateName ? <Text numberOfLines={1} style={styles.templateSource}>{currentSpecifications.templateName}</Text> : null}
          {currentSpecifications.sourceTemplateModified ? <Text accessibilityLabel="원본 스펙에서 수정됨" style={styles.modifiedBadge}>수정됨</Text> : null}
          {missingMeasurementCount > 0 ? <Text accessibilityLabel={`미입력 스펙값 ${missingMeasurementCount}개`} style={styles.missingBadge}>미입력 {missingMeasurementCount}</Text> : null}
          {sectionState.measurementExpanded ? <ChevronDown color={WAFL_THEME.color.navyInk} size={18} /> : <ChevronRight color={WAFL_THEME.color.navyInk} size={18} />}
        </Pressable>
        {sectionState.measurementExpanded && edit?.canEdit ? <Pressable accessibilityLabel="스펙 불러오기" accessibilityRole="button" disabled={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} onPress={() => { setTemplatePickerOpen(true); void loadTemplates(); }} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed, (isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading) && styles.disabled]}><Download color={WAFL_THEME.color.navyInk} size={17} /></Pressable> : null}
        {sectionState.measurementExpanded && edit?.canEdit ? <Pressable accessibilityLabel="스펙 저장" accessibilityRole="button" disabled={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} onPress={() => { setTemplateSaveOpen(true); void loadTemplates(); }} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed, (isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading) && styles.disabled]}><Save color={WAFL_THEME.color.navyInk} size={17} /></Pressable> : null}
      </View>
      {sectionState.measurementExpanded ? <View style={styles.specUnitRow}><View accessibilityLabel="완성 스펙 표시 단위" style={styles.unitSegment}>{(["cm", "inch"] as const).map((unit) => { const selected = currentSpecifications.measurementUnit === unit; const unitPending = isSizeColorCommandPending(edit?.pendingScope ?? null, "measurement-unit"); return <Pressable accessibilityHint="단위를 변경하면 화면에 즉시 반영되고 작업지시서에 저장됩니다." accessibilityLabel={`완성 스펙 ${unit} 표시`} accessibilityRole="button" accessibilityState={{ selected, busy: unitPending }} disabled={unitPending} key={unit} onPress={() => { if (edit?.canEdit && unit !== currentSpecifications.measurementUnit) void edit.onSetMeasurementUnit(unit); }} style={({ pressed }) => [styles.unitOption, selected && styles.unitOptionSelected, pressed && styles.pressed]}><Text style={[styles.unitText, selected && styles.unitTextSelected]}>{unit}</Text></Pressable>; })}</View></View> : null}
      </View></View>

      {sectionState.measurementExpanded && templateError ? <View style={styles.contentInset}><Text style={styles.templateError}>{templateError}</Text></View> : null}

      {sectionState.measurementExpanded ? currentSpecifications.pomColumns.length === 0 || currentSpecifications.sizes.length === 0 ? <EmptyNotice>등록된 완성 스펙 정보가 없습니다.</EmptyNotice> : <>
        {missingMeasurementCount > 0 ? <View style={styles.contentInset}><View style={styles.missingWarning}><AlertTriangle color={WAFL_THEME.color.brickOrange} size={15} /><Text style={styles.missingWarningText}>미입력 스펙값은 -로 표시됩니다.</Text></View></View> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.table} nestedScrollEnabled><View>
          <View style={styles.tableRow}><View style={[styles.cell, styles.measurementCell, styles.headerCell]}><Text style={styles.headerText}>스펙 항목</Text></View>{currentSpecifications.sizes.map((size) => <View key={size.id} style={[styles.cell, styles.numberCell, styles.headerCell]}><Text style={styles.headerText}>{size.displayLabel}</Text></View>)}</View>
          {currentSpecifications.pomColumns.map((pom) => <View key={pom.id} style={styles.tableRow}><View style={[styles.cell, styles.measurementCell]}><Text numberOfLines={2} style={styles.cellText}>{pom.displayName}</Text></View>{currentSpecifications.sizes.map((size) => { const cell = measurements.get(`${pom.id}:${size.id}`); const missing = !cell?.decimalValue; return <View key={size.id} style={[styles.cell, styles.numberCell, missing && styles.missingCell]}>{edit?.canEdit ? <MeasurementCellEditor cell={cell} edit={edit} pomColumnId={pom.id} sizeRowId={size.id} storedUnit={currentSpecifications.measurementUnit} /> : <Text style={styles.cellText}>{canonicalCellDisplay(cell, currentSpecifications.measurementUnit) || "-"}</Text>}</View>; })}</View>)}
        </View></ScrollView>
      </> : null}
    </View>
    {edit ? <MeasurementTemplatePickerSheet errorMessage={templateError} onApply={async (template) => { const saved = await edit.onApplyMeasurementTemplate(template.id); if (saved) setTemplatePickerOpen(false); return saved; }} onCancel={() => setTemplatePickerOpen(false)} pending={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} templates={templates} visible={templatePickerOpen} /> : null}
    {edit ? <CompanyTemplateSaveSheet companyTemplates={templates.filter((item) => item.sourceKind === "company")} onCancel={() => setTemplateSaveOpen(false)} onDisable={async (template) => { await patchCompanyMeasurementTemplate(template.id, { isActive: false }); await loadTemplates(true); return true; }} onRename={async (template, name) => { await patchCompanyMeasurementTemplate(template.id, { name }); await loadTemplates(true); return true; }} onSaveNew={async (name) => { const saved = await edit.onSaveMeasurementTemplate(name); if (saved) { await loadTemplates(true); setTemplateSaveOpen(false); } return saved; }} onUpdateExisting={async (template) => { const saved = await edit.onUpdateMeasurementTemplate(template.id); if (saved) { await loadTemplates(true); setTemplateSaveOpen(false); } return saved; }} pending={isSizeColorCommandPending(edit.pendingScope, "template") || templateLoading} visible={templateSaveOpen} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { paddingBottom: 22 }, contentStack: { gap: 12, paddingHorizontal: CONTENT_INSET, paddingTop: CONTENT_INSET }, contentInset: { paddingHorizontal: CONTENT_INSET },
  warning: { alignItems: "flex-start", backgroundColor: "#fff3e9", borderColor: "#efd0bc", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, padding: 11 }, warningText: { color: "#744531", flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18 },
  section: { borderTopColor: "#eee3d5", borderTopWidth: 1, gap: 10, marginTop: 18, paddingTop: 11 }, specHeaderStack: { gap: 6 }, sectionHeadingRow: { alignItems: "center", flexDirection: "row", gap: 7 }, specUnitRow: { alignItems: "flex-start", minHeight: 36 }, collapsibleHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 44 }, measurementToggle: { alignItems: "center", flex: 1, flexDirection: "row", gap: 6, minHeight: 44, minWidth: 0 }, sectionTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 12, lineHeight: 18 },
  templateSource: { color: WAFL_THEME.color.readOnly, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 10 }, modifiedBadge: { backgroundColor: "#fff0e7", borderColor: "#e8b79f", borderRadius: WAFL_THEME.radius.pill, borderWidth: 1, color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 }, missingBadge: { backgroundColor: "#fff8eb", borderColor: "#e7c98e", borderRadius: WAFL_THEME.radius.pill, borderWidth: 1, color: "#745721", fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 }, iconAction: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: 8, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  unitSegment: { backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.border, borderRadius: 9, borderWidth: 1, flexDirection: "row", padding: 2 }, unitOption: { alignItems: "center", borderRadius: 7, justifyContent: "center", minHeight: 30, minWidth: 41, paddingHorizontal: 7 }, unitOptionSelected: { backgroundColor: WAFL_THEME.color.navyInk }, unitText: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 10 }, unitTextSelected: { color: "#fffdf8", fontFamily: WAFL_FONTS.bold },
  templateError: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.medium, fontSize: 12, width: "100%" }, missingWarning: { alignItems: "center", backgroundColor: "#fff8eb", borderRadius: 8, flexDirection: "row", gap: 6, paddingHorizontal: 9, paddingVertical: 7 }, missingWarningText: { color: "#745721", fontFamily: WAFL_FONTS.medium, fontSize: 11 }, missingCell: { backgroundColor: "#fffaf0" },
  emptyNotice: { backgroundColor: "#faf7f1", borderRadius: 9, color: "#75665b", fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18, padding: 12 }, table: { paddingBottom: 4, paddingHorizontal: CONTENT_INSET }, tableRow: { flexDirection: "row" }, cell: { alignItems: "center", borderBottomColor: "#e8ded2", borderBottomWidth: 1, borderRightColor: "#e8ded2", borderRightWidth: 1, flexDirection: "row", justifyContent: "center", minHeight: 44, paddingHorizontal: 8, paddingVertical: 7 }, nameCell: { justifyContent: "flex-start", width: 132 }, measurementCell: { justifyContent: "flex-start", width: 148 }, numberCell: { width: 88 }, headerCell: { backgroundColor: "#f4ede4", borderTopColor: "#e8ded2", borderTopWidth: 1 }, headerText: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 10, lineHeight: 15, textAlign: "center" }, cellText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.medium, fontSize: 11, lineHeight: 17, textAlign: "center" }, measurementPressable: { alignItems: "center", justifyContent: "center", minHeight: 34, minWidth: 60 }, measurementSizeHeader: { alignItems: "center", flexDirection: "row", gap: 4 }, swatch: { borderColor: "#c8bcae", borderRadius: 7, borderWidth: 1, height: 14, marginRight: 7, width: 14 }, totalCell: { backgroundColor: "#faf4ec" }, totalText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.semibold, fontSize: 11 }, grandTotalCell: { backgroundColor: "#e9dfd2" }, grandTotalText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  memo: { backgroundColor: "#fbf6ee", borderRadius: 10, gap: 5, padding: 12 }, memoLabel: { color: "#806e60", fontFamily: WAFL_FONTS.semibold, fontSize: 11 }, memoText: { color: "#443930", fontFamily: WAFL_FONTS.regular, fontSize: 13, lineHeight: 20 }, statePanel: { alignItems: "center", backgroundColor: "#faf7f1", borderRadius: 12, gap: 9, margin: CONTENT_INSET, padding: 24 }, stateTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 15, textAlign: "center" }, stateText: { color: "#75665b", fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18, textAlign: "center" }, retryButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.brickOrange, borderRadius: 9, flexDirection: "row", gap: 6, marginTop: 4, minHeight: 42, paddingHorizontal: 14 }, retryText: { color: "#fffdf8", fontFamily: WAFL_FONTS.semibold, fontSize: 12 }, pressed: { opacity: 0.76 }, disabled: { opacity: 0.4 },
});
