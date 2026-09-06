import {
  decodeWorkOrderMajorCategoryCode,
  WORK_ORDER_MAJOR_CATEGORY_CODES,
} from "./workOrderCategoryCodePolicy.mjs";

export { decodeWorkOrderMajorCategoryCode, WORK_ORDER_MAJOR_CATEGORY_CODES };

export const WORK_ORDER_TARGET_AUDIENCES = ["여성", "남성", "공용", "키즈", "기타"] as const;
export const WORK_ORDER_CATEGORY_MAJORS = ["상의", "하의", "아우터", "원피스", "셋업", "기타"] as const;
export const WORK_ORDER_NEW_CATEGORY_MAJORS = ["상의", "하의", "아우터", "원피스", "기타"] as const;

export type WorkOrderTargetAudience = (typeof WORK_ORDER_TARGET_AUDIENCES)[number] | "";
export type WorkOrderCategoryMajor = (typeof WORK_ORDER_CATEGORY_MAJORS)[number] | "";
export type WorkOrderMajorCategoryCode = (typeof WORK_ORDER_MAJOR_CATEGORY_CODES)[number];

const TARGET_CODES: Readonly<Record<Exclude<WorkOrderTargetAudience, "">, string>> = {
  여성: "W",
  남성: "M",
  공용: "U",
  키즈: "K",
  기타: "X",
};

const TARGET_LABELS = Object.fromEntries(
  Object.entries(TARGET_CODES).map(([label, code]) => [code, label]),
) as Readonly<Record<string, Exclude<WorkOrderTargetAudience, "">>>;

export const WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL: Readonly<Record<Exclude<WorkOrderCategoryMajor, "">, WorkOrderMajorCategoryCode>> = {
  상의: "T",
  하의: "B",
  아우터: "O",
  원피스: "D",
  셋업: "S",
  기타: "X",
};

export const WORK_ORDER_MAJOR_CATEGORY_LABEL_BY_CODE = Object.fromEntries(
  Object.entries(WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL).map(([label, code]) => [code, label]),
) as Readonly<Record<WorkOrderMajorCategoryCode, Exclude<WorkOrderCategoryMajor, "">>>;

const CATEGORY_PREFIX = "wafl-c1";

export type WorkOrderCategorySelection = {
  readonly targetAudience: WorkOrderTargetAudience;
  readonly categoryMajor: WorkOrderCategoryMajor;
  readonly categoryDetail: string;
  readonly seasonCode: string;
};

export function decodeWorkOrderCategory(input: {
  readonly productTypeCode: string | null;
  readonly itemCode: string | null;
  readonly seasonCode: string | null;
}): WorkOrderCategorySelection {
  const code = input.productTypeCode?.trim() ?? "";
  const [prefix, targetCode = "", , extra] = code.split("|");
  const structured = prefix === CATEGORY_PREFIX && extra === undefined;
  const majorCode = decodeWorkOrderMajorCategoryCode(input.productTypeCode);
  return {
    targetAudience: structured ? TARGET_LABELS[targetCode] ?? "" : "",
    categoryMajor: majorCode ? WORK_ORDER_MAJOR_CATEGORY_LABEL_BY_CODE[majorCode] : "",
    categoryDetail: input.itemCode?.trim() ?? "",
    seasonCode: input.seasonCode?.trim() ?? "",
  };
}

export function encodeWorkOrderProductType(input: {
  readonly targetAudience: string;
  readonly categoryMajor: string;
}): string | null {
  const targetCode = TARGET_CODES[input.targetAudience as Exclude<WorkOrderTargetAudience, "">] ?? "";
  const majorCode = WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL[input.categoryMajor as Exclude<WorkOrderCategoryMajor, "">] ?? "";
  return targetCode || majorCode ? `${CATEGORY_PREFIX}|${targetCode}|${majorCode}` : null;
}

export function workOrderCategorySummary(selection: WorkOrderCategorySelection): string | null {
  const values = [selection.targetAudience, selection.categoryMajor, selection.categoryDetail, selection.seasonCode].filter(Boolean);
  return values.length > 0 ? values.join(" · ") : null;
}

export function workOrderProductClassificationSummary(input: {
  readonly productTypeCode: string | null;
  readonly itemCode: string | null;
}): string | null {
  const selection = decodeWorkOrderCategory({ ...input, seasonCode: null });
  const values = [selection.targetAudience, selection.categoryMajor, selection.categoryDetail].filter(Boolean);
  return values.length > 0 ? values.join(" · ") : null;
}

/** New authoring omits retired setup while an existing persisted setup remains representable until explicitly changed. */
export function workOrderMajorCategoryPickerOptions(
  currentCategory: string,
  targetAudience: WorkOrderTargetAudience = "",
): readonly WorkOrderCategoryMajor[] {
  const authored = targetAudience === "남성"
    ? WORK_ORDER_NEW_CATEGORY_MAJORS.filter((category) => category !== "원피스")
    : WORK_ORDER_NEW_CATEGORY_MAJORS;
  const legacyCurrent = currentCategory === "셋업" || (targetAudience === "남성" && currentCategory === "원피스")
    ? [currentCategory as WorkOrderCategoryMajor]
    : [];
  return ["", ...legacyCurrent, ...authored];
}

/** Returns only whether a major is valid for new authoring under the target taxonomy. */
export function isWorkOrderMajorCategoryValidForTarget(
  categoryMajor: string,
  targetAudience: WorkOrderTargetAudience,
) {
  if (!categoryMajor) return false;
  return WORK_ORDER_NEW_CATEGORY_MAJORS.includes(categoryMajor as (typeof WORK_ORDER_NEW_CATEGORY_MAJORS)[number])
    && !(targetAudience === "남성" && categoryMajor === "원피스");
}

/**
 * Staged target changes preserve an existing classification only when the
 * major remains authorable for the new target. Legacy/current picker escape
 * options intentionally do not make an invalid combination valid.
 */
export function resolveWorkOrderTargetAudienceTransition(input: {
  readonly categoryDetail: string;
  readonly categoryMajor: string;
  readonly currentTargetAudience: string;
  readonly nextTargetAudience: WorkOrderTargetAudience;
}) {
  if (input.nextTargetAudience === input.currentTargetAudience) {
    return { categoryDetail: input.categoryDetail, categoryMajor: input.categoryMajor, targetAudience: input.nextTargetAudience } as const;
  }
  const preserveCategory = isWorkOrderMajorCategoryValidForTarget(
    input.categoryMajor,
    input.nextTargetAudience,
  );
  return {
    categoryDetail: preserveCategory ? input.categoryDetail : "",
    categoryMajor: preserveCategory ? input.categoryMajor : "",
    targetAudience: input.nextTargetAudience,
  } as const;
}

/** A changed major owns an immediate staged detail reset. */
export function resolveWorkOrderMajorCategoryTransition(input: {
  readonly categoryDetail: string;
  readonly currentCategoryMajor: string;
  readonly nextCategoryMajor: string;
}) {
  return {
    categoryDetail: input.nextCategoryMajor === input.currentCategoryMajor ? input.categoryDetail : "",
    categoryMajor: input.nextCategoryMajor,
  } as const;
}

/**
 * WAFL starter-spec recommendations exist only for the four authored apparel
 * categories. The input is already a decoded major-category code; decoding it
 * again would erase valid T/B/O/D values.
 */
export function resolveWaflBasicSpecRecommendationCategory(
  categoryCode: WorkOrderMajorCategoryCode | null,
): Extract<WorkOrderMajorCategoryCode, "T" | "B" | "O" | "D"> | null {
  return categoryCode === "T" || categoryCode === "B" || categoryCode === "O" || categoryCode === "D"
    ? categoryCode
    : null;
}
