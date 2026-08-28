export type StructureSelectionCandidate = {
  readonly displayName: string;
  readonly hexValue: string | null;
};

export type ExistingStructureSelection = StructureSelectionCandidate & {
  readonly id: string;
};

export type StructureSelectionBatchDiff = {
  readonly additions: readonly StructureSelectionCandidate[];
  readonly deletionIds: readonly string[];
  readonly deletedDisplayNames: readonly string[];
};

export function structureSelectionKey(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

export function createStagedStructureSelection(items: readonly ExistingStructureSelection[]) {
  return Object.freeze(items.map((item) => structureSelectionKey(item.displayName)));
}

export function toggleStagedStructureSelection(selectedKeys: readonly string[], displayName: string) {
  const key = structureSelectionKey(displayName);
  return selectedKeys.includes(key)
    ? Object.freeze(selectedKeys.filter((candidate) => candidate !== key))
    : Object.freeze([...selectedKeys, key]);
}

export function diffStagedStructureSelection(input: {
  readonly existing: readonly ExistingStructureSelection[];
  readonly candidates: readonly StructureSelectionCandidate[];
  readonly selectedKeys: readonly string[];
}): StructureSelectionBatchDiff {
  const selected = new Set(input.selectedKeys);
  const existingKeys = new Set(input.existing.map((item) => structureSelectionKey(item.displayName)));
  const candidateByKey = new Map<string, StructureSelectionCandidate>();
  for (const candidate of input.candidates) {
    const key = structureSelectionKey(candidate.displayName);
    if (!candidateByKey.has(key)) candidateByKey.set(key, Object.freeze({ ...candidate }));
  }
  const additions = [...selected]
    .filter((key) => !existingKeys.has(key))
    .map((key) => candidateByKey.get(key))
    .filter((candidate): candidate is StructureSelectionCandidate => candidate !== undefined);
  const deleted = input.existing.filter((item) => !selected.has(structureSelectionKey(item.displayName)));
  return Object.freeze({
    additions: Object.freeze(additions),
    deletionIds: Object.freeze(deleted.map((item) => item.id)),
    deletedDisplayNames: Object.freeze(deleted.map((item) => item.displayName)),
  });
}

export function summarizeStagedDeletionQuantity(input: {
  readonly targetKind: "size" | "color";
  readonly deletionIds: readonly string[];
  readonly quantityCells: readonly { readonly sizeRowId: string; readonly colorId: string; readonly quantity: string }[];
}) {
  const deleted = new Set(input.deletionIds);
  return input.quantityCells.reduce((sum, cell) => {
    const targetId = input.targetKind === "size" ? cell.sizeRowId : cell.colorId;
    if (!deleted.has(targetId)) return sum;
    const quantity = Number(cell.quantity);
    return sum + (Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
}

export type StagedReplacementImpact = {
  readonly removedQuantity: number;
  readonly removedMeasurementValueCount: number;
  readonly hasLoss: boolean;
};

export function resolveStagedReplacementImpact(input: {
  readonly targetKind: "size" | "color";
  readonly deletionIds: readonly string[];
  readonly quantityCells: readonly { readonly sizeRowId: string; readonly colorId: string; readonly quantity: string }[];
  readonly measurementCells: readonly { readonly sizeRowId: string; readonly decimalValue: string | null }[];
}): StagedReplacementImpact {
  const removedQuantity = summarizeStagedDeletionQuantity(input);
  const deleted = new Set(input.deletionIds);
  const removedMeasurementValueCount = input.targetKind === "size"
    ? input.measurementCells.filter((cell) => deleted.has(cell.sizeRowId) && cell.decimalValue !== null && cell.decimalValue.trim() !== "").length
    : 0;
  return Object.freeze({
    removedQuantity,
    removedMeasurementValueCount,
    hasLoss: removedQuantity > 0 || removedMeasurementValueCount > 0,
  });
}

export function resolveStagedReplacementDecision(input: {
  readonly targetKind: "size" | "color";
  readonly impact: StagedReplacementImpact;
}) {
  if (!input.impact.hasLoss) return null;
  return Object.freeze({
    title: input.targetKind === "size" ? "사이즈를 변경할까요?" : "색상을 변경할까요?",
    helper: input.targetKind === "size"
      ? "적용 중인 스펙 정보가 함께 삭제됩니다."
      : "입력된 수량 정보가 함께 삭제됩니다.",
    safeLabel: "취소",
    actionLabel: "변경",
  });
}

export function createStagedReplacementLossMessage(input: {
  readonly targetKind: "size" | "color";
  readonly deletedDisplayNames: readonly string[];
  readonly impact: StagedReplacementImpact;
}) {
  const label = input.targetKind === "size" ? "사이즈" : "색상";
  const names = input.deletedDisplayNames.map((name) => `'${name}'`).join(", ");
  const losses = [
    input.impact.removedQuantity > 0 ? `입력된 수량 ${input.impact.removedQuantity.toLocaleString("ko-KR")}개` : null,
    input.impact.removedMeasurementValueCount > 0 ? `치수 ${input.impact.removedMeasurementValueCount.toLocaleString("ko-KR")}개` : null,
  ].filter((value): value is string => value !== null);
  return `${label} ${names}을 제거하면 ${losses.join("와 ")}가 함께 삭제됩니다.`;
}

export function createStagedDeletionMessage(input: {
  readonly targetKind: "size" | "color";
  readonly deletedDisplayNames: readonly string[];
  readonly removedQuantity: number;
}) {
  const label = input.targetKind === "size" ? "사이즈" : "색상";
  const names = input.deletedDisplayNames.map((name) => `'${name}'`).join(", ");
  const question = `선택한 ${label} ${names}을 삭제하시겠습니까?`;
  return input.removedQuantity > 0
    ? `${question}\n입력된 수량 ${input.removedQuantity.toLocaleString("ko-KR")}개도 함께 삭제됩니다.`
    : question;
}
