export const WORK_ORDER_TARGET_AUDIENCES = ["여성", "남성", "공용", "키즈", "기타"] as const;
export const WORK_ORDER_CATEGORY_MAJORS = ["상의", "하의", "아우터", "원피스", "셋업", "기타"] as const;
export const WORK_ORDER_MAJOR_CATEGORY_CODES = ["T", "B", "O", "D", "S", "X"] as const;

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

const LEGACY_MAJOR_CODE_BY_PRODUCT_TYPE: Readonly<Record<string, WorkOrderMajorCategoryCode>> = {
  "apparel.top": "T",
  "apparel.bottom": "B",
  "apparel.outer": "O",
  "apparel.onepiece_set": "D",
};

const CATEGORY_PREFIX = "wafl-c1";

export type WorkOrderCategorySelection = {
  readonly targetAudience: WorkOrderTargetAudience;
  readonly categoryMajor: WorkOrderCategoryMajor;
  readonly categoryDetail: string;
  readonly seasonCode: string;
};

export function decodeWorkOrderMajorCategoryCode(productTypeCode: string | null): WorkOrderMajorCategoryCode | null {
  const code = productTypeCode?.trim() ?? "";
  const [prefix, , majorCode = "", extra] = code.split("|");
  if (prefix === CATEGORY_PREFIX && extra === undefined && WORK_ORDER_MAJOR_CATEGORY_CODES.includes(majorCode as WorkOrderMajorCategoryCode)) {
    return majorCode as WorkOrderMajorCategoryCode;
  }
  return LEGACY_MAJOR_CODE_BY_PRODUCT_TYPE[code] ?? null;
}

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
