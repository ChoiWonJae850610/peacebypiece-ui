import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from "react-native";
import { Check, ChevronLeft } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { CompanyWorkOrderStructureOption, WorkOrderColorRow, WorkOrderSizeRow } from "@/domain/mobileContract";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
import {
  createStagedDeletionMessage,
  createStagedStructureSelection,
  diffStagedStructureSelection,
  structureSelectionKey,
  summarizeStagedDeletionQuantity,
  toggleStagedStructureSelection,
  type StructureSelectionBatchDiff,
  type StructureSelectionCandidate,
} from "@/domain/sizeColorSelectionBatchPolicy";
import {
  COLOR_PALETTE_PRESETS,
  CUSTOM_COLOR_GROUPS,
  SIZE_ALPHA_PRESETS,
  SIZE_NUMERIC_PRESETS,
  hexToRgb,
  normalizeManualHex,
} from "@/domain/sizeColorStructurePolicy";
import type { SizeColorCacheEntry } from "./sizeColorCache";
import type { ColorStructureDraft } from "./sizeColorStructureEditPolicy";
import type { SizeColorStructureEditBoundary } from "./useSizeColorStructureEditController";
import { isSizeColorCommandPending } from "./sizeColorPendingPolicy";
import WorkOrderSizeColorReadOnly from "./WorkOrderSizeColorReadOnly";
import SpecItemSelectionSheet from "./SpecItemSelectionSheet";
import { workOrderMutationController } from "@/features/work-orders/workOrderMutationController";
import { workOrderQueryController } from "@/features/work-orders/workOrderQueryController";
import WaflOptionGrid, { type WaflOptionGridItem } from "@/features/inputs/WaflOptionGrid";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflSheetTextInput from "@/features/inputs/WaflSheetTextInput";
import { WAFL_REUSABLE_CATALOG_CREATE_SIZING } from "@/domain/waflSheetDetentPolicy";
import { decodeWorkOrderMajorCategoryCode } from "@/domain/workOrderCategoryPolicy";
import { listWaflSystemSpecItems } from "@/domain/systemSpecItemCatalog";
import { useWaflNestedSheetHandoff } from "@/features/inputs/useWaflNestedSheetHandoff";
import type { WaflSheetSizing } from "@/domain/waflSheetDetentPolicy";

type Props = {
  readonly identity: string;
  readonly state: SizeColorCacheEntry;
  readonly edit: SizeColorStructureEditBoundary;
  readonly onRetry: () => void;
  readonly productTypeCode: string | null;
};

function StructureSelectionSheet(props: { readonly title: string; readonly onClose: () => void; readonly onAfterClose?: () => void; readonly onAfterOpen?: () => void; readonly onApply?: () => void; readonly applyDisabled?: boolean; readonly busy?: boolean; readonly children: ReactNode; readonly sizing?: WaflSheetSizing; readonly visible?: boolean }) {
  return <WaflInputSheet
    cancelAccessibilityLabel={`${props.title} 변경 취소`}
    confirmAccessibilityLabel={`${props.title} 변경 적용`}
    confirmDisabled={props.applyDisabled}
    contentStyle={styles.structureSheetContent}
    onCancel={props.onClose}
    onAfterClose={props.onAfterClose}
    onAfterOpen={props.onAfterOpen}
    onConfirm={props.onApply}
    pending={props.busy}
    sizing={props.sizing ?? "expandable"}
    title={props.title}
    visible={props.visible ?? true}
  >
    <View style={styles.sheetContent}>{props.children}</View>
  </WaflInputSheet>;
}

function SizeChooser(props: {
  readonly rows: readonly WorkOrderSizeRow[];
  readonly companyOptions: readonly CompanyWorkOrderStructureOption[];
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onCreate: (name: string) => Promise<CompanyWorkOrderStructureOption | null>;
  readonly onRemove: (option: CompanyWorkOrderStructureOption) => void;
  readonly onApply: (diff: StructureSelectionBatchDiff) => Promise<boolean>;
}) {
  const nested = useWaflNestedSheetHandoff<"select" | "create">("select");
  const directInputRef = useRef<TextInput>(null);
  const [direct, setDirect] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>(() => createStagedStructureSelection(props.rows.map((row) => ({ id: row.id, displayName: row.displayLabel, hexValue: null }))));
  const selected = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  if (nested.route === "create") return <StructureSelectionSheet onAfterClose={nested.finishClose} onAfterOpen={() => directInputRef.current?.focus()} onClose={props.onClose} sizing={WAFL_REUSABLE_CATALOG_CREATE_SIZING} title="직접 사이즈 만들기" visible={nested.visible}>
    <Pressable accessibilityLabel="기본 사이즈로 돌아가기" onPress={() => nested.transition("select")} style={styles.backButton}><ChevronLeft color="#23375a" size={18} /><Text style={styles.backButtonText}>기본 사이즈</Text></Pressable>
    <Text style={styles.fieldLabel}>사이즈명</Text>
    <WaflSheetTextInput maxLength={40} onChangeText={setDirect} placeholder="예: 프리사이즈" ref={directInputRef} style={styles.input} value={direct} />
    <Text style={styles.catalogHint}>추가하면 회사에서 다음 작업지시서에도 다시 선택할 수 있습니다.</Text>
    <Pressable disabled={props.busy || !direct.trim()} onPress={() => { void props.onCreate(direct).then((created) => { if (created) { setSelectedKeys((current) => [...new Set([...current, structureSelectionKey(created.displayName)])]); setDirect(""); nested.transition("select"); } }); }} style={[styles.primaryButton, (props.busy || !direct.trim()) && styles.disabled]}>
      {props.busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>추가</Text>}
    </Pressable>
  </StructureSelectionSheet>;
  const system = [...SIZE_ALPHA_PRESETS, ...SIZE_NUMERIC_PRESETS];
  const candidates = [...system.map((displayName) => ({ displayName, hexValue: null })), ...props.companyOptions.map((option) => ({ displayName: option.displayName, hexValue: null }))];
  const diff = diffStagedStructureSelection({ existing: props.rows.map((row) => ({ id: row.id, displayName: row.displayLabel, hexValue: null })), candidates, selectedKeys });
  const systemItems: readonly WaflOptionGridItem[] = system.map((label) => ({ key: `system:${label}`, label, selected: selected.has(structureSelectionKey(label)) }));
  const companyItems: readonly WaflOptionGridItem[] = props.companyOptions.map((option) => ({ key: option.id, label: option.displayName, selected: selected.has(structureSelectionKey(option.displayName)), removable: true }));
  const companyById = new Map(props.companyOptions.map((option) => [option.id, option]));
  return <StructureSelectionSheet applyDisabled={diff.additions.length === 0 && diff.deletionIds.length === 0} busy={props.busy} onAfterClose={nested.finishClose} onApply={() => { void props.onApply(diff); }} onClose={props.onClose} title="사이즈 선택" visible={nested.visible}>
    <Text style={styles.catalogHint}>항목을 고른 뒤 V를 누르면 변경사항을 한 번에 저장합니다.</Text>
    <Text style={styles.catalogSectionTitle}>WAFL 기본 사이즈</Text>
    <WaflOptionGrid accessibilityLabel="WAFL 기본 사이즈 선택" columns={4} disabled={props.busy} items={systemItems} onToggle={(item) => setSelectedKeys((current) => toggleStagedStructureSelection(current, item.label))} />
    <Text style={styles.catalogSectionTitle}>등록 사이즈</Text>
    {companyItems.length > 0 ? <WaflOptionGrid accessibilityLabel="등록 사이즈 선택" columns={4} disabled={props.busy} items={companyItems} onRemove={(item) => { const option = companyById.get(item.key); if (option) props.onRemove(option); }} onToggle={(item) => setSelectedKeys((current) => toggleStagedStructureSelection(current, item.label))} /> : <Text style={styles.catalogEmpty}>등록한 사이즈가 없습니다.</Text>}
    <Pressable onPress={() => nested.transition("create")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>직접 만들기</Text></Pressable>
  </StructureSelectionSheet>;
}

function ColorGrid(props: { readonly value: string; readonly onChange: (hex: string) => void }) {
  return <View accessibilityLabel="시각 색상 선택" style={styles.groupedPalette}>{CUSTOM_COLOR_GROUPS.map((group) => <View key={group.name} style={styles.colorGroup}>
    <Text style={styles.colorGroupName}>{group.name}</Text>
    <View style={styles.colorGrid}>{group.colors.map((hex, toneIndex) => {
      const selected = hex === props.value;
      return <Pressable
        accessibilityLabel={`${group.name} ${toneIndex + 1}`}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        key={`${group.name}-${hex}`}
        onPress={() => props.onChange(hex)}
        style={[styles.colorCell, { backgroundColor: hex }, selected && styles.colorCellSelected]}
      >{selected ? <Check color={hex === "#FFFFFF" ? "#17263d" : "#fff"} size={15} /> : null}</Pressable>;
    })}</View>
  </View>)}</View>;
}

function ReadOnlyColorValues({ hex }: { readonly hex: string }) {
  const rgb = hexToRgb(hex);
  return <View style={styles.readOnlyValues}>
    <Text style={styles.readOnlyValue}>RGB {rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "—"}</Text>
    <Text style={styles.readOnlyValue}>HEX {normalizeManualHex(hex) ?? "—"}</Text>
  </View>;
}

function ColorChooser(props: {
  readonly rows: readonly WorkOrderColorRow[];
  readonly companyOptions: readonly CompanyWorkOrderStructureOption[];
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onCreate: (draft: ColorStructureDraft) => Promise<CompanyWorkOrderStructureOption | null>;
  readonly onRemove: (option: CompanyWorkOrderStructureOption) => void;
  readonly onApply: (diff: StructureSelectionBatchDiff) => Promise<boolean>;
}) {
  const nested = useWaflNestedSheetHandoff<"base" | "custom">("base");
  const nameInputRef = useRef<TextInput>(null);
  const [name, setName] = useState("");
  const [selectedHex, setSelectedHex] = useState("#FFFFFF");
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>(() => createStagedStructureSelection(props.rows.map((row) => ({ id: row.id, displayName: row.displayName, hexValue: row.hexValue }))));
  const selected = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  if (nested.route === "custom") return <StructureSelectionSheet onAfterClose={nested.finishClose} onAfterOpen={() => nameInputRef.current?.focus()} onClose={props.onClose} sizing={WAFL_REUSABLE_CATALOG_CREATE_SIZING} title="직접 색상 만들기" visible={nested.visible}>
    <Pressable accessibilityLabel="기본 색상으로 돌아가기" onPress={() => nested.transition("base")} style={styles.backButton}><ChevronLeft color="#23375a" size={18} /><Text style={styles.backButtonText}>기본 색상</Text></Pressable>
    <Text style={styles.fieldLabel}>색상명</Text>
    <WaflSheetTextInput maxLength={80} onChangeText={setName} placeholder="색상 이름" ref={nameInputRef} style={styles.input} value={name} />
    <ColorGrid onChange={setSelectedHex} value={selectedHex} />
    <View style={styles.colorPreviewRow}><View style={[styles.customPreview, { backgroundColor: selectedHex }]} /><ReadOnlyColorValues hex={selectedHex} /></View>
    <Text style={styles.catalogHint}>추가하면 회사에서 다음 작업지시서에도 다시 선택할 수 있습니다.</Text>
    <Pressable disabled={props.busy || !name.trim()} onPress={() => { void props.onCreate({ displayName: name, hexValue: selectedHex }).then((created) => { if (created) { setSelectedKeys((current) => [...new Set([...current, structureSelectionKey(created.displayName)])]); setName(""); nested.transition("base"); } }); }} style={[styles.primaryButton, (props.busy || !name.trim()) && styles.disabled]}>
      {props.busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>추가</Text>}
    </Pressable>
  </StructureSelectionSheet>;
  const candidates: readonly StructureSelectionCandidate[] = [...COLOR_PALETTE_PRESETS.map((preset) => ({ displayName: preset.name, hexValue: preset.hex })), ...props.companyOptions.map((option) => ({ displayName: option.displayName, hexValue: option.hexValue }))];
  const diff = diffStagedStructureSelection({ existing: props.rows.map((row) => ({ id: row.id, displayName: row.displayName, hexValue: row.hexValue })), candidates, selectedKeys });
  const systemItems: readonly WaflOptionGridItem[] = COLOR_PALETTE_PRESETS.map((preset) => ({ key: `system:${preset.name}`, label: preset.name, selected: selected.has(structureSelectionKey(preset.name)), swatchHex: preset.hex }));
  const companyItems: readonly WaflOptionGridItem[] = props.companyOptions.map((option) => ({ key: option.id, label: option.displayName, selected: selected.has(structureSelectionKey(option.displayName)), swatchHex: option.hexValue, removable: true }));
  const companyById = new Map(props.companyOptions.map((option) => [option.id, option]));
  return <StructureSelectionSheet applyDisabled={diff.additions.length === 0 && diff.deletionIds.length === 0} busy={props.busy} onAfterClose={nested.finishClose} onApply={() => { void props.onApply(diff); }} onClose={props.onClose} title="색상 선택" visible={nested.visible}>
    <Text style={styles.catalogHint}>항목을 고른 뒤 V를 누르면 변경사항을 한 번에 저장합니다.</Text>
    <Text style={styles.catalogSectionTitle}>WAFL 기본 색상</Text>
    <WaflOptionGrid accessibilityLabel="WAFL 기본 색상 선택" columns={3} disabled={props.busy} items={systemItems} onToggle={(item) => setSelectedKeys((current) => toggleStagedStructureSelection(current, item.label))} />
    <Text style={styles.catalogSectionTitle}>등록 색상</Text>
    {companyItems.length > 0 ? <WaflOptionGrid accessibilityLabel="등록 색상 선택" columns={3} disabled={props.busy} items={companyItems} onRemove={(item) => { const option = companyById.get(item.key); if (option) props.onRemove(option); }} onToggle={(item) => setSelectedKeys((current) => toggleStagedStructureSelection(current, item.label))} /> : <Text style={styles.catalogEmpty}>등록한 색상이 없습니다.</Text>}
    <Pressable onPress={() => nested.transition("custom")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>직접 만들기</Text></Pressable>
  </StructureSelectionSheet>;
}

export default function WorkOrderSizeColorStructureEditor({ identity, state, edit, onRetry, productTypeCode }: Props) {
  const matrix = state.bundle?.matrix;
  const categoryCode = decodeWorkOrderMajorCategoryCode(productTypeCode);
  const systemSpecItems = useMemo(() => listWaflSystemSpecItems(categoryCode), [categoryCode]);
  const [chooser, setChooser] = useState<"size" | "color" | "spec_item" | null>(null);
  const [companyOptions, setCompanyOptions] = useState<readonly CompanyWorkOrderStructureOption[]>([]);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const loadOptions = useCallback(async () => {
    if (!matrix) return;
    try {
      const page = await workOrderQueryController.structureOptions(matrix.workOrderId);
      setCompanyOptions(page.items);
      setCatalogError(null);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "회사 선택지를 불러오지 못했습니다.");
    }
  }, [matrix]);
  const nextCatalogIdentity = (kind: string) => `alpha62-company-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const createOption = async (kind: "size" | "color" | "spec_item", displayName: string, hexValue?: string | null) => {
    if (!matrix || catalogBusy) return null;
    setCatalogBusy(true);
    setCatalogError(null);
    try {
      const clientRequestId = nextCatalogIdentity("client");
      const created = await workOrderMutationController.createStructureOption(matrix.workOrderId, { clientRequestId, expectedVersion: matrix.entityVersion, kind, displayName, hexValue }, nextCatalogIdentity("idempotency"));
      await loadOptions();
      return created.item ?? null;
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "회사 선택지를 저장하지 못했습니다.");
      return null;
    } finally { setCatalogBusy(false); }
  };
  const renameOption = async (option: CompanyWorkOrderStructureOption, displayName: string) => {
    if (!matrix || catalogBusy || option.kind !== "spec_item") return false;
    setCatalogBusy(true);
    setCatalogError(null);
    try {
      const clientRequestId = nextCatalogIdentity("client");
      await workOrderMutationController.renameStructureOption(matrix.workOrderId, option.id, { clientRequestId, expectedVersion: matrix.entityVersion, displayName }, nextCatalogIdentity("idempotency"));
      await loadOptions();
      return true;
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "회사 스펙 항목 이름을 변경하지 못했습니다.");
      return false;
    } finally { setCatalogBusy(false); }
  };
  const removeOption = (option: CompanyWorkOrderStructureOption) => {
    if (!matrix || catalogBusy) return;
    confirmWaflDestructiveAction({
      title: "회사 선택지 제거",
      message: `“${option.displayName}”을(를) 앞으로의 선택 목록에서 제거합니다. 이미 사용한 작업지시서 이력은 유지됩니다.`,
      onConfirm: () => {
        void (async () => {
          setCatalogBusy(true);
          try {
            await workOrderMutationController.removeStructureOption(matrix.workOrderId, option.id, { clientRequestId: nextCatalogIdentity("client"), expectedVersion: matrix.entityVersion }, nextCatalogIdentity("idempotency"));
            await loadOptions();
          } catch (error) { setCatalogError(error instanceof Error ? error.message : "회사 선택지를 제거하지 못했습니다."); }
          finally { setCatalogBusy(false); }
        })();
      },
    });
  };
  const applyBatch = async (targetKind: "size" | "color", diff: StructureSelectionBatchDiff) => {
    if (!matrix || isSizeColorCommandPending(edit.pendingScope, "structure")) return false;
    const execute = async () => {
      const saved = await edit.onApplySelectionBatch(targetKind, diff.additions, diff.deletionIds);
      if (saved) { edit.onCancel(); setChooser(null); }
      return saved;
    };
    if (diff.deletionIds.length === 0) return execute();
    const removedQuantity = summarizeStagedDeletionQuantity({ targetKind, deletionIds: diff.deletionIds, quantityCells: matrix.quantityCells });
    confirmWaflDestructiveAction({
      title: targetKind === "size" ? "사이즈 삭제" : "색상 삭제",
      message: createStagedDeletionMessage({ targetKind, deletedDisplayNames: diff.deletedDisplayNames, removedQuantity }),
      onConfirm: () => { void execute(); },
    });
    return false;
  };
  const structureBusy = catalogBusy || isSizeColorCommandPending(edit.pendingScope, "structure");
  const editorSurfaceVisible = Boolean(edit.errorMessage || catalogError || (edit.canEdit && chooser));
  return <View>
    {matrix && editorSurfaceVisible ? <View style={styles.cards}>
      {edit.errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{edit.errorMessage}</Text> : null}
      {catalogError ? <Text accessibilityRole="alert" style={styles.error}>{catalogError}</Text> : null}
      {edit.canEdit && chooser === "size" ? <SizeChooser busy={structureBusy} companyOptions={companyOptions.filter((item) => item.kind === "size")} onApply={(diff) => applyBatch("size", diff)} onClose={() => { edit.onCancel(); setChooser(null); }} onCreate={(name) => createOption("size", name)} onRemove={removeOption} rows={matrix.sizes} /> : null}
      {edit.canEdit && chooser === "color" ? <ColorChooser busy={structureBusy} companyOptions={companyOptions.filter((item) => item.kind === "color")} onApply={(diff) => applyBatch("color", diff)} onClose={() => { edit.onCancel(); setChooser(null); }} onCreate={(draft) => createOption("color", draft.displayName, draft.hexValue)} onRemove={removeOption} rows={matrix.colors} /> : null}
      {edit.canEdit && chooser === "spec_item" ? <SpecItemSelectionSheet
        busy={structureBusy}
        currentPoms={state.bundle?.specifications.pomColumns ?? []}
        onApply={(items) => edit.onSetPomSelection(items)}
        onClose={() => { edit.onCancel(); setChooser(null); }}
        onCreate={(name) => createOption("spec_item", name)}
        onRemove={removeOption}
        onRename={renameOption}
        options={companyOptions.filter((item) => item.kind === "spec_item")}
        recommendationAvailable={categoryCode !== null}
        systemItems={systemSpecItems}
      /> : null}
    </View> : null}
    <WorkOrderSizeColorReadOnly
      edit={edit}
      identity={identity}
      onEditColor={() => { edit.onBegin(); setChooser("color"); void loadOptions(); }}
      onEditSize={() => { edit.onBegin(); setChooser("size"); void loadOptions(); }}
      onEditSpecItems={() => { edit.onBegin(); setChooser("spec_item"); void loadOptions(); }}
      onRetry={onRetry}
      state={state}
      structureBusy={structureBusy}
    />
  </View>;
}

const styles = StyleSheet.create({
  cards: { gap: WAFL_THEME.layout.controlGap, paddingHorizontal: WAFL_THEME.layout.cardPadding, paddingTop: WAFL_THEME.layout.cardPadding },
  addAction: { alignItems: "center", flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 44, paddingHorizontal: 8 },
  editAction: { alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 54, paddingHorizontal: 9 },
  actionDivider: { alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.22)", width: 1 },
  countText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  structureSheetContent: { paddingTop: 10 },
  sheetContent: { gap: 10, paddingBottom: 12, paddingHorizontal: 16 },
  reelEditorContent: { gap: WAFL_THEME.spacing.md, marginTop: WAFL_THEME.spacing.md },
  fixedEditor: { backgroundColor: "#faf7f1", borderColor: "#e4d9cc", borderRadius: 12, borderWidth: 1, gap: 8, padding: 12 },
  colorValueButton: { alignItems: "center", borderColor: "#d5dbe4", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 44, paddingHorizontal: 8 },
  destructiveAction: { alignItems: "center", alignSelf: "flex-start", borderColor: "#e2a5aa", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 40, paddingHorizontal: 12 },
  destructiveActionText: { color: "#b52b35", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  swatch: { borderColor: "#c8bcae", borderRadius: 7, borderWidth: 1, height: 28, width: 28 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { alignItems: "center", backgroundColor: "#fff", borderColor: "#cbd3df", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 40, paddingHorizontal: 12 },
  chipSelected: { backgroundColor: "#e7ecf3", borderColor: "#53647e" },
  chipDisabled: { opacity: 0.46 },
  chipText: { color: "#53647e", fontFamily: WAFL_FONTS.semibold, fontSize: 12 },
  chipTextSelected: { color: "#17263d", fontFamily: WAFL_FONTS.bold },
  catalogList: { gap: 7 },
  catalogSectionTitle: { color: "#334561", fontFamily: WAFL_FONTS.bold, fontSize: 12, marginTop: 3 },
  catalogEmpty: { color: "#75695e", fontFamily: WAFL_FONTS.regular, fontSize: 11, paddingVertical: 6 },
  catalogChoice: { alignItems: "stretch", backgroundColor: "#fff", borderColor: "#cbd3df", borderRadius: 9, borderWidth: 1, flexDirection: "row", minHeight: 44, overflow: "hidden" },
  catalogChoiceSelected: { backgroundColor: "#e7ecf3", borderColor: "#53647e" },
  catalogChoiceMain: { alignItems: "center", flex: 1, flexDirection: "row", gap: 7, minHeight: 44, paddingHorizontal: 11 },
  catalogChoiceText: { color: "#334561", flex: 1, fontFamily: WAFL_FONTS.semibold, fontSize: 12 },
  companyBadge: { backgroundColor: "#f2e6d8", borderRadius: 999, color: "#7a482d", fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  catalogRemove: { alignItems: "center", borderLeftColor: "#d7c9bd", borderLeftWidth: 1, justifyContent: "center", minHeight: 44, width: 44 },
  catalogHint: { color: "#75695e", fontFamily: WAFL_FONTS.regular, fontSize: 11, lineHeight: 17 },
  paletteSwatch: { borderColor: "#b9af9f", borderRadius: 999, borderWidth: 1, height: 16, width: 16 },
  fieldLabel: { color: "#53647e", fontFamily: WAFL_FONTS.semibold, fontSize: 10, marginTop: 2 },
  input: { backgroundColor: "#fff", borderColor: "#b9c2d0", borderRadius: 8, borderWidth: 1, color: "#17263d", fontFamily: WAFL_FONTS.medium, minHeight: 44, paddingHorizontal: 10 },
  primaryButton: { alignItems: "center", backgroundColor: "#23375a", borderRadius: 9, justifyContent: "center", marginTop: 2, minHeight: 46 },
  primaryButtonText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  secondaryButton: { alignItems: "center", borderColor: "#aeb9c9", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 10 },
  secondaryButtonText: { color: "#334561", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  backButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 4, minHeight: 44, paddingRight: 12 },
  backButtonText: { color: "#23375a", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.68 },
  groupedPalette: { gap: 10 },
  colorGroup: { gap: 5 },
  colorGroupName: { color: "#65594e", fontFamily: WAFL_FONTS.semibold, fontSize: 10 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  colorCell: { alignItems: "center", borderColor: "#c8bcae", borderRadius: 8, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  colorCellSelected: { borderColor: "#17263d", borderWidth: 3 },
  colorPreviewRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  customPreview: { borderColor: "#b9af9f", borderRadius: 10, borderWidth: 1, height: 62, width: 62 },
  readOnlyValues: { flex: 1, gap: 2 },
  readOnlyValue: { color: "#53647e", fontFamily: WAFL_FONTS.medium, fontSize: 10, lineHeight: 15 },
  error: { color: "#a94f32", fontFamily: WAFL_FONTS.medium, fontSize: 10, lineHeight: 14, paddingHorizontal: 16 },
  emptyText: { color: "#75665b", fontFamily: WAFL_FONTS.medium, padding: 20, textAlign: "center" },
});
