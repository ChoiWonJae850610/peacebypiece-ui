import type { WorkOrderColorRow, WorkOrderSizeRow } from "@/domain/mobileContract";

export type ColorStructureDraft = {
  readonly displayName: string;
  readonly hexValue: string;
};

export function normalizeStructureName(value: string) {
  return value.normalize("NFKC").trim();
}

export function normalizeColorHex(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return normalized || null;
}

export function validateSizeLabel(value: string, sizes: readonly WorkOrderSizeRow[], exceptId?: string) {
  const normalized = normalizeStructureName(value);
  if (!normalized || normalized.length > 40 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    return { value: normalized, error: "사이즈 이름은 1~40자로 입력해 주세요." };
  }
  const key = normalized.toLocaleLowerCase("en-US");
  if (sizes.some((row) => row.id !== exceptId && normalizeStructureName(row.displayLabel).toLocaleLowerCase("en-US") === key)) {
    return { value: normalized, error: "같은 사이즈 이름이 이미 있습니다." };
  }
  return { value: normalized, error: null };
}

export function validateColorDraft(
  draft: ColorStructureDraft,
  colors: readonly WorkOrderColorRow[],
  exceptId?: string,
) {
  const displayName = normalizeStructureName(draft.displayName);
  const hexValue = normalizeColorHex(draft.hexValue);
  if (!displayName || displayName.length > 80 || /[\u0000-\u001f\u007f]/.test(displayName)) {
    return { displayName, hexValue, error: "색상 이름은 1~80자로 입력해 주세요." };
  }
  if (hexValue !== null && !/^#[0-9A-F]{6}$/.test(hexValue)) {
    return { displayName, hexValue, error: "색상 코드는 #RRGGBB 형식으로 입력해 주세요." };
  }
  const key = displayName.toLocaleLowerCase("en-US");
  if (colors.some((row) => row.id !== exceptId && normalizeStructureName(row.displayName).toLocaleLowerCase("en-US") === key)) {
    return { displayName, hexValue, error: "같은 색상 이름이 이미 있습니다." };
  }
  return { displayName, hexValue, error: null };
}

export function sameColorDraft(row: WorkOrderColorRow, draft: ColorStructureDraft) {
  return normalizeStructureName(row.displayName) === normalizeStructureName(draft.displayName)
    && (row.hexValue ?? null) === normalizeColorHex(draft.hexValue);
}

export function isStructureMutationCommitAllowed(input: {
  readonly requestWorkOrderId: string;
  readonly activeWorkOrderId: string | null;
  readonly requestGeneration: number;
  readonly activeGeneration: number;
}) {
  return input.requestWorkOrderId === input.activeWorkOrderId
    && input.requestGeneration === input.activeGeneration;
}
