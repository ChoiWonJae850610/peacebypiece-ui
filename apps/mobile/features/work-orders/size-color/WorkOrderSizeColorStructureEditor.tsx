import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, ChevronLeft, Plus, X } from "lucide-react-native";

import { WaflOptionReel } from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import type { ReelOption } from "@/features/inputs/reel-picker/reelPickerModel";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WorkOrderColorRow, WorkOrderSizeRow } from "@/domain/mobileContract";
import {
  COLOR_PALETTE_PRESETS,
  CUSTOM_COLOR_GROUPS,
  SIZE_ALPHA_PRESETS,
  SIZE_NUMERIC_PRESETS,
  hexToRgb,
  normalizeManualHex,
  togglePresetSelection,
  unavailableColorPresetKeys,
  unavailableSizePresetKeys,
} from "./sizeColorAutoSortPolicy";
import type { SizeColorCacheEntry } from "./sizeColorCache";
import type { ColorStructureDraft } from "./sizeColorStructureEditPolicy";
import type { SizeColorStructureEditBoundary } from "./useSizeColorStructureEditController";
import WorkOrderSizeColorReadOnly from "./WorkOrderSizeColorReadOnly";

type Props = {
  readonly identity: string;
  readonly state: SizeColorCacheEntry;
  readonly edit: SizeColorStructureEditBoundary;
  readonly onRetry: () => void;
};

function SheetFrame(props: { readonly title: string; readonly onClose: () => void; readonly children: ReactNode }) {
  return <Modal animationType="slide" onRequestClose={props.onClose} transparent visible>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalRoot}>
      <Pressable accessibilityLabel="선택 시트 닫기" onPress={props.onClose} style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{props.title}</Text>
          <Pressable accessibilityLabel={`${props.title} 닫기`} onPress={props.onClose} style={styles.iconButton}><X color="#23375a" size={19} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">{props.children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function PresetChip(props: { readonly label: string; readonly selected: boolean; readonly disabled: boolean; readonly swatch?: string; readonly onPress: () => void }) {
  return <Pressable
    accessibilityRole="checkbox"
    accessibilityState={{ checked: props.selected || props.disabled, disabled: props.disabled }}
    disabled={props.disabled}
    onPress={props.onPress}
    style={[styles.chip, props.selected && styles.chipSelected, props.disabled && styles.chipDisabled]}
  >
    {props.swatch ? <View style={[styles.paletteSwatch, { backgroundColor: props.swatch }]} /> : null}
    <Text style={[styles.chipText, props.selected && styles.chipTextSelected]}>{props.label}</Text>
    {props.disabled ? <Check color="#778397" size={14} /> : null}
  </Pressable>;
}

function AddLabel({ count }: { readonly count: number }) {
  return <>{count > 0 ? `${count}개 추가` : "추가"}</>;
}

function SizeChooser(props: { readonly rows: readonly WorkOrderSizeRow[]; readonly busy: boolean; readonly onClose: () => void; readonly onAdd: SizeColorStructureEditBoundary["onAddSizes"] }) {
  const unavailable = useMemo(() => unavailableSizePresetKeys(props.rows), [props.rows]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [direct, setDirect] = useState("");
  const values = useMemo(() => [...selected, ...(direct.trim() ? [direct] : [])], [direct, selected]);
  const submit = async () => {
    if (!values.length || props.busy) return;
    const immutableSelection = Object.freeze([...values]);
    const result = await props.onAdd(immutableSelection);
    if (!result.failed) props.onClose();
  };
  return <SheetFrame onClose={props.onClose} title="사이즈 선택">
    <View style={styles.chipGrid}>{[...SIZE_ALPHA_PRESETS, ...SIZE_NUMERIC_PRESETS].map((label) => <PresetChip
      disabled={unavailable.has(label.toLocaleLowerCase("en-US"))}
      key={label}
      label={label}
      onPress={() => setSelected((current) => togglePresetSelection(current, label, unavailable))}
      selected={selected.includes(label)}
    />)}</View>
    <Text style={styles.fieldLabel}>직접 입력</Text>
    <TextInput maxLength={40} onChangeText={setDirect} placeholder="사이즈 이름" style={styles.input} value={direct} />
    <Pressable disabled={props.busy || values.length === 0} onPress={() => void submit()} style={[styles.primaryButton, (props.busy || values.length === 0) && styles.disabled]}>
      {props.busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}><AddLabel count={values.length} /></Text>}
    </Pressable>
  </SheetFrame>;
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

function ColorChooser(props: { readonly rows: readonly WorkOrderColorRow[]; readonly busy: boolean; readonly onClose: () => void; readonly onAdd: SizeColorStructureEditBoundary["onAddColors"] }) {
  const unavailable = useMemo(() => unavailableColorPresetKeys(props.rows), [props.rows]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [mode, setMode] = useState<"base" | "custom">("base");
  const [name, setName] = useState("");
  const [selectedHex, setSelectedHex] = useState("#FFFFFF");
  const selectedDrafts = COLOR_PALETTE_PRESETS.filter((preset) => selected.includes(preset.name)).map((preset) => ({ displayName: preset.name, hexValue: preset.hex }));
  const submit = async (drafts: readonly ColorStructureDraft[]) => {
    if (!drafts.length || props.busy) return;
    const immutableSelection = Object.freeze(drafts.map((draft) => Object.freeze({ ...draft })));
    const result = await props.onAdd(immutableSelection);
    if (!result.failed) props.onClose();
  };
  if (mode === "custom") return <SheetFrame onClose={props.onClose} title="직접 색상 만들기">
    <Pressable accessibilityLabel="기본 색상으로 돌아가기" onPress={() => setMode("base")} style={styles.backButton}><ChevronLeft color="#23375a" size={18} /><Text style={styles.backButtonText}>기본 색상</Text></Pressable>
    <Text style={styles.fieldLabel}>색상명</Text>
    <TextInput maxLength={80} onChangeText={setName} placeholder="색상 이름" style={styles.input} value={name} />
    <ColorGrid onChange={setSelectedHex} value={selectedHex} />
    <View style={styles.colorPreviewRow}><View style={[styles.customPreview, { backgroundColor: selectedHex }]} /><ReadOnlyColorValues hex={selectedHex} /></View>
    <Pressable disabled={props.busy || !name.trim()} onPress={() => void submit([{ displayName: name, hexValue: selectedHex }])} style={[styles.primaryButton, (props.busy || !name.trim()) && styles.disabled]}>
      {props.busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>1개 추가</Text>}
    </Pressable>
  </SheetFrame>;
  return <SheetFrame onClose={props.onClose} title="색상 선택">
    <View style={styles.chipGrid}>{COLOR_PALETTE_PRESETS.map((preset) => <PresetChip
      disabled={unavailable.has(preset.name.toLocaleLowerCase("en-US"))}
      key={preset.name}
      label={preset.name}
      onPress={() => setSelected((current) => togglePresetSelection(current, preset.name, unavailable))}
      selected={selected.includes(preset.name)}
      swatch={preset.hex}
    />)}</View>
    <Pressable onPress={() => setMode("custom")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>직접 색상 만들기</Text></Pressable>
    <Pressable disabled={props.busy || selectedDrafts.length === 0} onPress={() => void submit(selectedDrafts)} style={[styles.primaryButton, (props.busy || selectedDrafts.length === 0) && styles.disabled]}>
      {props.busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}><AddLabel count={selectedDrafts.length} /></Text>}
    </Pressable>
  </SheetFrame>;
}

function ExistingStructureEditor(props: {
  readonly kind: "size" | "color";
  readonly sizeRows: readonly WorkOrderSizeRow[];
  readonly colorRows: readonly WorkOrderColorRow[];
  readonly edit: SizeColorStructureEditBoundary;
  readonly onClose: () => void;
}) {
  const rows = props.kind === "size" ? props.sizeRows : props.colorRows;
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const selectedSize = props.kind === "size" ? props.sizeRows.find((row) => row.id === selectedId) : undefined;
  const selectedColor = props.kind === "color" ? props.colorRows.find((row) => row.id === selectedId) : undefined;
  const selectedRow = selectedSize ?? selectedColor;
  const [name, setName] = useState(selectedSize?.displayLabel ?? selectedColor?.displayName ?? "");
  const [hex, setHex] = useState(normalizeManualHex(selectedColor?.hexValue ?? "") ?? "#FFFFFF");
  const [paletteHex, setPaletteHex] = useState(hex);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const selectRow = (rowId: string) => {
    const size = props.sizeRows.find((row) => row.id === rowId);
    const color = props.colorRows.find((row) => row.id === rowId);
    setSelectedId(rowId);
    setName(size?.displayLabel ?? color?.displayName ?? "");
    const nextHex = normalizeManualHex(color?.hexValue ?? "") ?? "#FFFFFF";
    setHex(nextHex);
    setPaletteHex(nextHex);
    setPaletteOpen(false);
  };
  const options = useMemo<readonly ReelOption[]>(() => props.kind === "size"
    ? props.sizeRows.map((row) => ({ key: row.id, value: row.id, label: row.displayLabel }))
    : props.colorRows.map((row) => ({ key: row.id, value: row.id, label: row.displayName, swatchHex: row.hexValue })), [props.colorRows, props.kind, props.sizeRows]);
  const unchanged = selectedSize
    ? name.normalize("NFKC").trim() === selectedSize.displayLabel.normalize("NFKC").trim()
    : selectedColor
      ? name.normalize("NFKC").trim() === selectedColor.displayName.normalize("NFKC").trim()
      : true;
  const save = async () => {
    if (!selectedRow || unchanged || props.edit.busy) return;
    const saved = selectedSize
      ? await props.edit.onRenameSize(selectedSize.id, name)
      : await props.edit.onPatchColor((selectedColor as WorkOrderColorRow).id, { displayName: name, hexValue: hex });
    if (!saved) {
      setName(selectedSize?.displayLabel ?? selectedColor?.displayName ?? "");
      setHex(normalizeManualHex(selectedColor?.hexValue ?? "") ?? "#FFFFFF");
      return;
    }
    setName(name.normalize("NFKC").trim());
  };
  const cancelPalette = () => {
    const canonicalHex = normalizeManualHex(selectedColor?.hexValue ?? "") ?? hex;
    setPaletteHex(canonicalHex);
    setPaletteOpen(false);
  };
  const applyPalette = async () => {
    if (!selectedColor || props.edit.busy) return;
    const normalizedHex = normalizeManualHex(paletteHex);
    if (!normalizedHex || normalizedHex === normalizeManualHex(selectedColor.hexValue ?? "")) {
      setHex(normalizedHex ?? hex);
      setPaletteOpen(false);
      return;
    }
    const saved = await props.edit.onPatchColor(selectedColor.id, {
      displayName: selectedColor.displayName,
      hexValue: normalizedHex,
    });
    if (!saved) {
      const canonicalHex = normalizeManualHex(selectedColor.hexValue ?? "") ?? hex;
      setHex(canonicalHex);
      setPaletteHex(canonicalHex);
      return;
    }
    setHex(normalizedHex);
    setPaletteHex(normalizedHex);
    setPaletteOpen(false);
  };
  return <WaflInputSheet
    cancelAccessibilityLabel={`${props.kind === "size" ? "사이즈" : "색상"} 변경 취소`}
    confirmAccessibilityLabel={`${props.kind === "size" ? "사이즈" : "색상"} 변경 저장`}
    confirmDisabled={!selectedRow || unchanged}
    onCancel={props.onClose}
    onConfirm={save}
    pending={props.edit.busy}
    title={props.kind === "size" ? "사이즈" : "색상"}
    visible
  >
    {props.edit.errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{props.edit.errorMessage}</Text> : null}
    {options.length ? <View style={styles.reelEditorContent}>
          <WaflOptionReel accessibilityLabel={`${props.kind === "size" ? "사이즈" : "색상"} 편집 릴`} onSelect={selectRow} options={options} selectedValue={selectedId} />
          <View style={styles.fixedEditor}>
            <Text style={styles.fieldLabel}>이름</Text>
            <TextInput blurOnSubmit={false} maxLength={props.kind === "size" ? 40 : 80} onChangeText={setName} style={styles.input} value={name} />
            {selectedColor ? <>
              <Pressable accessibilityLabel={`${selectedColor.displayName} 색상 변경`} onPress={() => { setPaletteHex(hex); setPaletteOpen(true); }} style={styles.colorValueButton}>
                <View style={[styles.swatch, { backgroundColor: hex }]} /><ReadOnlyColorValues hex={hex} />
              </Pressable>
              {paletteOpen ? <WaflInputSheet
                cancelAccessibilityLabel="색상 팔레트 변경 취소"
                confirmAccessibilityLabel="색상 팔레트 적용"
                confirmDisabled={normalizeManualHex(paletteHex) === normalizeManualHex(selectedColor.hexValue ?? "")}
                onCancel={cancelPalette}
                onConfirm={applyPalette}
                pending={props.edit.busy}
                title="색상"
                visible
              >
                {props.edit.errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{props.edit.errorMessage}</Text> : null}
                <ScrollView style={styles.paletteScroll}><ColorGrid onChange={setPaletteHex} value={paletteHex} /></ScrollView>
                <View style={styles.colorPreviewRow}><View style={[styles.customPreview, { backgroundColor: paletteHex }]} /><ReadOnlyColorValues hex={paletteHex} /></View>
              </WaflInputSheet> : null}
            </> : null}
          </View>
    </View> : <Text style={styles.emptyText}>등록된 항목이 없습니다.</Text>}
  </WaflInputSheet>;
}

function StructureCard(props: { readonly kind: "size" | "color"; readonly count: number; readonly editable: boolean; readonly busy: boolean; readonly onAdd: () => void; readonly onEdit: () => void }) {
  const label = props.kind === "size" ? "사이즈" : "색상";
  return <View style={styles.structureAction}>
    {props.editable ? <>
      <Pressable accessibilityLabel={`${label} 추가`} disabled={props.busy} onPress={props.onAdd} style={({ pressed }) => [styles.addAction, pressed && styles.actionPressed, props.busy && styles.disabled]}>
        <Plus color="#fff" size={18} strokeWidth={2.4} />
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
      <View style={styles.actionDivider} />
      <Pressable accessibilityLabel={`${label} ${props.count}개 편집`} disabled={props.busy || props.count === 0} onPress={props.onEdit} style={({ pressed }) => [styles.editAction, pressed && styles.actionPressed, (props.busy || props.count === 0) && styles.disabled]}>
        <Text style={styles.countText}>{props.count}개</Text>
      </Pressable>
    </> : <View accessibilityLabel={`${label} ${props.count}개, 읽기 전용`} style={styles.staticAction}>
      <Text style={styles.actionText}>{label}</Text>
      <Text style={styles.countText}>{props.count}개</Text>
    </View>}
  </View>;
}

export default function WorkOrderSizeColorStructureEditor({ identity, state, edit, onRetry }: Props) {
  const matrix = state.bundle?.matrix;
  const [chooser, setChooser] = useState<"size" | "color" | null>(null);
  const [editor, setEditor] = useState<"size" | "color" | null>(null);
  const openEditor = (kind: "size" | "color") => {
    if (!edit.canEdit) return;
    edit.onBegin();
    setEditor(kind);
  };
  return <View>
    {matrix ? <View style={styles.cards}>
      {edit.errorMessage && !editor ? <Text accessibilityRole="alert" style={styles.error}>{edit.errorMessage}</Text> : null}
      <View style={styles.cardRow}>
        <StructureCard busy={edit.busy} count={matrix.sizes.length} editable={edit.canEdit} kind="size" onAdd={() => setChooser("size")} onEdit={() => openEditor("size")} />
        <StructureCard busy={edit.busy} count={matrix.colors.length} editable={edit.canEdit} kind="color" onAdd={() => setChooser("color")} onEdit={() => openEditor("color")} />
      </View>
      {edit.canEdit && chooser === "size" ? <SizeChooser busy={edit.busy} onAdd={edit.onAddSizes} onClose={() => setChooser(null)} rows={matrix.sizes} /> : null}
      {edit.canEdit && chooser === "color" ? <ColorChooser busy={edit.busy} onAdd={edit.onAddColors} onClose={() => setChooser(null)} rows={matrix.colors} /> : null}
      {edit.canEdit && editor ? <ExistingStructureEditor colorRows={matrix.colors} edit={edit} key={`${matrix.workOrderId}:${editor}`} kind={editor} onClose={() => { edit.onCancel(); setEditor(null); }} sizeRows={matrix.sizes} /> : null}
    </View> : null}
    <WorkOrderSizeColorReadOnly edit={edit} identity={identity} onRetry={onRetry} state={state} />
  </View>;
}

const styles = StyleSheet.create({
  cards: { gap: 9, paddingHorizontal: 12, paddingTop: 12 },
  cardRow: { flexDirection: "row", gap: 9 },
  structureAction: { alignItems: "stretch", backgroundColor: "#17263d", borderRadius: 8, flex: 1, flexDirection: "row", minHeight: 44, overflow: "hidden" },
  addAction: { alignItems: "center", flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 44, paddingHorizontal: 8 },
  editAction: { alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 54, paddingHorizontal: 9 },
  staticAction: { alignItems: "center", flex: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 44, paddingHorizontal: 12 },
  actionDivider: { alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.22)", width: 1 },
  actionText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  countText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  actionPressed: { backgroundColor: "#23375a", opacity: 0.78 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,29,43,0.38)" },
  sheet: { alignSelf: "center", backgroundColor: "#fffdf8", borderColor: "#d9cdbc", borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, maxHeight: "90%", maxWidth: 520, paddingBottom: 18, width: "100%" },
  sheetHandle: { alignSelf: "center", backgroundColor: "#c8b7a3", borderRadius: 999, height: 4, marginTop: 9, width: 42 },
  sheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  sheetTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 18 },
  iconButton: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  sheetContent: { gap: 10, paddingBottom: 12, paddingHorizontal: 16 },
  reelEditorContent: { gap: WAFL_THEME.spacing.md, marginTop: WAFL_THEME.spacing.md },
  fixedEditor: { backgroundColor: "#faf7f1", borderColor: "#e4d9cc", borderRadius: 12, borderWidth: 1, gap: 8, padding: 12 },
  paletteScroll: { maxHeight: 230 },
  colorValueButton: { alignItems: "center", borderColor: "#d5dbe4", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 44, paddingHorizontal: 8 },
  swatch: { borderColor: "#c8bcae", borderRadius: 7, borderWidth: 1, height: 28, width: 28 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { alignItems: "center", backgroundColor: "#fff", borderColor: "#cbd3df", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 40, paddingHorizontal: 12 },
  chipSelected: { backgroundColor: "#e7ecf3", borderColor: "#53647e" },
  chipDisabled: { opacity: 0.46 },
  chipText: { color: "#53647e", fontFamily: WAFL_FONTS.semibold, fontSize: 12 },
  chipTextSelected: { color: "#17263d", fontFamily: WAFL_FONTS.bold },
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
