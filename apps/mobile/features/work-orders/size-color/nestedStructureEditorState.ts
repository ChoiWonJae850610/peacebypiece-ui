export type NestedStructureRow = {
  readonly id: string;
  readonly name: string;
  readonly hex: string | null;
};

export type NestedStructureEditorState = {
  readonly selectedId: string;
  readonly nameDraft: string;
  readonly hexDraft: string;
  readonly paletteDraft: string;
  readonly child: "row" | "palette";
};

const fallbackHex = "#FFFFFF";

export function createNestedStructureEditorState(row: NestedStructureRow | null): NestedStructureEditorState {
  const hex = row?.hex ?? fallbackHex;
  return {
    selectedId: row?.id ?? "",
    nameDraft: row?.name ?? "",
    hexDraft: hex,
    paletteDraft: hex,
    child: "row",
  };
}

export function selectNestedStructureRow(
  state: NestedStructureEditorState,
  row: NestedStructureRow,
): NestedStructureEditorState {
  const hex = row.hex ?? fallbackHex;
  return { ...state, selectedId: row.id, nameDraft: row.name, hexDraft: hex, paletteDraft: hex, child: "row" };
}

export function openNestedColorPalette(state: NestedStructureEditorState): NestedStructureEditorState {
  return { ...state, paletteDraft: state.hexDraft, child: "palette" };
}

export function cancelNestedColorPalette(
  state: NestedStructureEditorState,
  canonicalHex: string,
): NestedStructureEditorState {
  return { ...state, hexDraft: canonicalHex, paletteDraft: canonicalHex, child: "row" };
}

export function applyNestedColorPalette(
  state: NestedStructureEditorState,
  savedHex: string,
): NestedStructureEditorState {
  return { ...state, hexDraft: savedHex, paletteDraft: savedHex, child: "row" };
}

export function acceptNestedStructureServerRow(
  state: NestedStructureEditorState,
  row: NestedStructureRow,
): NestedStructureEditorState {
  if (state.selectedId !== row.id) return state;
  const hex = row.hex ?? fallbackHex;
  return { ...state, nameDraft: row.name, hexDraft: hex, paletteDraft: hex, child: "row" };
}

export function reconcileNestedStructureSelection(
  state: NestedStructureEditorState,
  rows: readonly NestedStructureRow[],
): NestedStructureEditorState {
  if (rows.some((row) => row.id === state.selectedId)) return state;
  return createNestedStructureEditorState(rows[0] ?? null);
}
