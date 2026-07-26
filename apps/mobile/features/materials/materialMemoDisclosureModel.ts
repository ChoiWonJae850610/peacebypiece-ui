export const MATERIAL_MEMO_COMPACT_LINES = 2;

export type MaterialMemoDisclosureModel = {
  readonly expanded: boolean;
  readonly hasOverflow: boolean;
  readonly label: "더보기" | "접기" | null;
  readonly numberOfLines: number | null;
};

export function createMaterialMemoDisclosureModel(
  measuredLineCount: number,
  expanded: boolean,
): MaterialMemoDisclosureModel {
  const normalizedLineCount = Number.isSafeInteger(measuredLineCount) && measuredLineCount > 0
    ? measuredLineCount
    : 0;
  const hasOverflow = normalizedLineCount > MATERIAL_MEMO_COMPACT_LINES;
  if (!hasOverflow) {
    return {
      expanded: false,
      hasOverflow: false,
      label: null,
      numberOfLines: MATERIAL_MEMO_COMPACT_LINES,
    };
  }
  return {
    expanded,
    hasOverflow: true,
    label: expanded ? "접기" : "더보기",
    numberOfLines: expanded ? null : MATERIAL_MEMO_COMPACT_LINES,
  };
}
