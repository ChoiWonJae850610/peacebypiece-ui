export function hasCategoryDependentWorkOrderData(input: {
  readonly itemCode: string | null;
  readonly totalQuantity: number;
  readonly sizeCount: number;
  readonly colorCount: number;
  readonly allocationCount: number;
  readonly specPomCount: number;
  readonly specCellCount: number;
  readonly sourceTemplateId: string | null;
}) {
  return Boolean(input.itemCode)
    || input.totalQuantity > 0
    || input.sizeCount > 0
    || input.colorCount > 0
    || input.allocationCount > 0
    || input.specPomCount > 0
    || input.specCellCount > 0
    || Boolean(input.sourceTemplateId);
}

export function resolveCategoryDependentResetDecision(input: {
  readonly changed: boolean;
  readonly hasDependents: boolean;
  readonly kind: "targetAudience" | "categoryMajor";
}) {
  if (!input.changed || !input.hasDependents) return null;
  return Object.freeze({
    title: input.kind === "targetAudience" ? "성별을 변경할까요?" : "대분류를 변경할까요?",
    helper: "적용 중인 사이즈와 스펙 정보가 초기화됩니다.",
    safeLabel: "취소",
    actionLabel: "변경",
  });
}
