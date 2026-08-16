import type { MaterialDraftFields, MaterialType, WorkOrderDetailCore, WorkOrderMaterialLine } from "@/domain/mobileContract";
import {
  decodeWorkOrderCategory,
  WORK_ORDER_CATEGORY_MAJORS,
  WORK_ORDER_TARGET_AUDIENCES,
} from "./workOrderCategoryPolicy.ts";
import {
  calculateOrderQuantity,
  normalizeNumericCommitValue,
  stripDecimalTrailingZeros,
} from "../lib/mobileDisplay.ts";
import {
  MATERIAL_QUANTITY_FACTOR,
  MATERIAL_QUANTITY_PATTERN,
  MATERIAL_QUANTITY_SCALE,
  materialQuantityPrecisionMessage,
} from "./materialQuantityPrecision.ts";

export type BasicInfoDraft = {
  readonly productName: string;
  readonly dueDate: string;
  readonly totalQuantity: string;
  readonly targetAudience: string;
  readonly categoryMajor: string;
  readonly categoryDetail: string;
  readonly seasonCode: string;
};

export type BasicInfoFieldErrors = Partial<Record<keyof BasicInfoDraft, string>>;
export type MaterialEditorFieldErrors = Partial<Record<keyof MaterialDraftFields, string>>;

export const WORK_ORDER_PRODUCT_NAME_MAX_LENGTH = 200;

export function validateWorkOrderProductName(value: string): string | null {
  const productName = value.trim();
  return productName.length < 1 || productName.length > WORK_ORDER_PRODUCT_NAME_MAX_LENGTH
    ? `제품명은 1자 이상 ${WORK_ORDER_PRODUCT_NAME_MAX_LENGTH}자 이하여야 합니다.`
    : null;
}

export const EMPTY_MATERIAL_DRAFT: MaterialDraftFields = {
  name: "",
  colorOption: "",
  usageArea: "",
  partnerId: "",
  requiredQuantity: "0",
  allowanceQuantity: "0",
  inventoryUsageQuantity: "0",
  orderQuantity: "0",
  unitCode: "",
  unitPrice: "0",
  memo: "",
};

export function materialCreateDraft(materialType: MaterialType): MaterialDraftFields {
  return {
    ...EMPTY_MATERIAL_DRAFT,
    unitCode: materialType === "accessory" ? "개" : "yd",
  };
}

const MATERIAL_PRICE_PATTERN = /^(?:0|[1-9]\d{0,11})$/;

type MaterialDraftInput = Partial<Record<keyof MaterialDraftFields, unknown>>;

function materialDraftString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function createMaterialDraft(
  input: MaterialDraftInput,
  fallback: MaterialDraftFields = EMPTY_MATERIAL_DRAFT,
): MaterialDraftFields {
  return {
    name: materialDraftString(input.name, fallback.name),
    colorOption: materialDraftString(input.colorOption, fallback.colorOption),
    usageArea: materialDraftString(input.usageArea, fallback.usageArea),
    partnerId: materialDraftString(input.partnerId, fallback.partnerId),
    requiredQuantity: materialDraftString(input.requiredQuantity, fallback.requiredQuantity),
    allowanceQuantity: materialDraftString(input.allowanceQuantity, fallback.allowanceQuantity),
    inventoryUsageQuantity: materialDraftString(input.inventoryUsageQuantity, fallback.inventoryUsageQuantity),
    orderQuantity: materialDraftString(input.orderQuantity, fallback.orderQuantity),
    unitCode: materialDraftString(input.unitCode, fallback.unitCode),
    unitPrice: materialDraftString(input.unitPrice, fallback.unitPrice),
    memo: materialDraftString(input.memo, fallback.memo),
  };
}

export function basicInfoDraftFromDetail(detail: WorkOrderDetailCore): BasicInfoDraft {
  const category = decodeWorkOrderCategory(detail.header);
  return {
    productName: detail.header.productName,
    dueDate: detail.header.dueDate ?? "",
    totalQuantity: String(detail.header.totalQuantity),
    targetAudience: category.targetAudience,
    categoryMajor: category.categoryMajor,
    categoryDetail: category.categoryDetail,
    seasonCode: category.seasonCode,
  };
}

export function validateBasicInfoDraft(draft: BasicInfoDraft): BasicInfoFieldErrors {
  const errors: BasicInfoFieldErrors = {};
  const totalQuantity = normalizeNumericCommitValue(draft.totalQuantity);
  const productName = draft.productName.trim();
  const productNameError = validateWorkOrderProductName(productName);
  if (productNameError) errors.productName = productNameError;
  if (draft.dueDate) {
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(draft.dueDate);
    const year = Number(matched?.[1] ?? 0);
    const month = Number(matched?.[2] ?? 0);
    const day = Number(matched?.[3] ?? 0);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (!matched || year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
      errors.dueDate = "납기는 YYYY-MM-DD 형식의 유효한 날짜여야 합니다.";
    }
  }
  if (!/^\d+$/.test(totalQuantity)) errors.totalQuantity = "총수량은 쉼표 없는 정수로 입력해 주세요.";
  else {
    const quantity = Number(totalQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000_000) {
      errors.totalQuantity = "총수량은 0 이상 100,000,000 이하의 정수여야 합니다.";
    }
  }
  if (draft.targetAudience && !WORK_ORDER_TARGET_AUDIENCES.includes(draft.targetAudience as (typeof WORK_ORDER_TARGET_AUDIENCES)[number])) {
    errors.targetAudience = "대상을 목록에서 선택해 주세요.";
  }
  if (draft.categoryMajor && !WORK_ORDER_CATEGORY_MAJORS.includes(draft.categoryMajor as (typeof WORK_ORDER_CATEGORY_MAJORS)[number])) {
    errors.categoryMajor = "대분류를 목록에서 선택해 주세요.";
  }
  if (draft.categoryDetail.trim().length > 24) errors.categoryDetail = "세부 품목은 24자 이하여야 합니다.";
  if (draft.seasonCode.trim().length > 16) errors.seasonCode = "시즌은 16자 이하여야 합니다.";
  return errors;
}

export function materialDraftFromLine(line: WorkOrderMaterialLine): MaterialDraftFields {
  return createMaterialDraft({
    name: line.name,
    colorOption: line.colorOption ?? "",
    usageArea: line.usageArea ?? "",
    partnerId: line.partnerId ?? "",
    requiredQuantity: stripDecimalTrailingZeros(line.requiredQuantity),
    allowanceQuantity: stripDecimalTrailingZeros(line.allowanceQuantity),
    inventoryUsageQuantity: stripDecimalTrailingZeros(line.inventoryUsageQuantity),
    orderQuantity: stripDecimalTrailingZeros(line.orderQuantity),
    unitCode: line.unitCode,
    unitPrice: stripDecimalTrailingZeros(line.unitPrice),
    memo: line.memo ?? "",
  });
}

export function sameMaterialDraft(left: MaterialDraftFields, right: MaterialDraftFields): boolean {
  return (Object.keys(left) as (keyof MaterialDraftFields)[]).every((field) => left[field] === right[field]);
}

export function validateMaterialDraft(input: MaterialDraftInput, materialType: MaterialType = "fabric"): MaterialEditorFieldErrors {
  const draft = createMaterialDraft(input);
  const numericDraft = {
    ...draft,
    requiredQuantity: normalizeNumericCommitValue(draft.requiredQuantity),
    allowanceQuantity: normalizeNumericCommitValue(draft.allowanceQuantity),
    inventoryUsageQuantity: normalizeNumericCommitValue(draft.inventoryUsageQuantity),
    unitPrice: normalizeNumericCommitValue(draft.unitPrice),
  };
  const errors: MaterialEditorFieldErrors = {};
  const nameLabel = materialType === "accessory" ? "부자재명" : "원단명";
  if (draft.name.trim().length < 1 || draft.name.trim().length > 200) errors.name = `${nameLabel}은 1자 이상 200자 이하여야 합니다.`;
  if (draft.colorOption.trim().length > 200) errors.colorOption = "색상·옵션은 200자 이하여야 합니다.";
  if (draft.usageArea.trim().length > 1000) errors.usageArea = "사용부위는 1,000자 이하여야 합니다.";
  if (draft.memo.trim().length > 2000) errors.memo = "메모는 2,000자 이하여야 합니다.";
  if (draft.unitCode.trim().length < 1 || draft.unitCode.trim().length > 32) errors.unitCode = "단위는 1자 이상 32자 이하여야 합니다.";
  for (const field of ["requiredQuantity", "allowanceQuantity"] as const) {
    if (!MATERIAL_QUANTITY_PATTERN.test(numericDraft[field])) errors[field] = materialQuantityPrecisionMessage();
  }
  if (!MATERIAL_PRICE_PATTERN.test(numericDraft.unitPrice)) errors.unitPrice = "단가는 0 이상의 정수 원 단위로 입력해 주세요.";
  const calculatedOrderQuantity = calculateOrderQuantity(numericDraft);
  if (calculatedOrderQuantity !== null && !errors.unitPrice) {
    const [quantityWhole, quantityFraction = ""] = calculatedOrderQuantity.split(".");
    const [priceWhole, priceFraction = ""] = numericDraft.unitPrice.split(".");
    const quantityScaled = BigInt(quantityWhole) * MATERIAL_QUANTITY_FACTOR + BigInt(quantityFraction.padEnd(MATERIAL_QUANTITY_SCALE, "0"));
    const priceScaled = BigInt(priceWhole) * 100n + BigInt(priceFraction.padEnd(2, "0"));
    const amountCents = (quantityScaled * priceScaled + (MATERIAL_QUANTITY_FACTOR / 2n)) / MATERIAL_QUANTITY_FACTOR;
    if (amountCents > 99999999999999n) errors.unitPrice = "계산 금액이 허용 범위를 넘지 않도록 단가를 줄여 주세요.";
  }
  return errors;
}

export function validateMaterialCreateDraft(
  input: MaterialDraftInput,
  materialType: MaterialType = "fabric",
): MaterialEditorFieldErrors {
  const draft = createMaterialDraft(input);
  const errors = validateMaterialDraft(draft, materialType);
  const requiredQuantity = normalizeNumericCommitValue(draft.requiredQuantity);
  if (!MATERIAL_QUANTITY_PATTERN.test(requiredQuantity) || Number(requiredQuantity) <= 0) {
    errors.requiredQuantity = "필요수량을 0보다 크게 입력해 주세요.";
  }
  if (!draft.unitCode.trim()) {
    errors.unitCode = "단위를 선택해 주세요.";
  }
  return errors;
}

export function validateMaterialOrderRequest(line: WorkOrderMaterialLine): MaterialEditorFieldErrors {
  const draft = materialDraftFromLine(line);
  const draftErrors = validateMaterialDraft(draft, line.materialType);
  const errors: MaterialEditorFieldErrors = {};
  for (const field of [
    "requiredQuantity",
    "allowanceQuantity",
    "inventoryUsageQuantity",
    "unitCode",
  ] as const) {
    if (draftErrors[field]) errors[field] = draftErrors[field];
  }
  const calculated = calculateOrderQuantity(draft);
  const externalOrder = calculated !== null && Number(calculated) > 0;
  if (externalOrder && !draft.partnerId.trim()) errors.partnerId = "거래처를 선택해 주세요.";
  const required = MATERIAL_QUANTITY_PATTERN.test(draft.requiredQuantity.trim())
    ? Number(draft.requiredQuantity)
    : null;
  const allowance = MATERIAL_QUANTITY_PATTERN.test(draft.allowanceQuantity.trim())
    ? Number(draft.allowanceQuantity)
    : null;
  const demand = required === null || allowance === null ? null : required + allowance;
  if (required === null || required <= 0) {
    errors.requiredQuantity = "필요수량을 0보다 크게 입력해 주세요.";
  }
  if (
    calculated === null
    || demand === null
    || demand <= 0
    || Number(calculated) !== Number(line.orderQuantity)
  ) {
    errors.orderQuantity = "발주수량 계산값을 확인해 주세요.";
  }
  const unitPrice = draft.unitPrice.trim();
  if (externalOrder && (!MATERIAL_PRICE_PATTERN.test(unitPrice) || Number(unitPrice) <= 0)) {
    errors.unitPrice = "단가를 0보다 크게 입력해 주세요.";
  }
  return errors;
}

export function materialPatch(base: MaterialDraftFields, draft: MaterialDraftFields): Partial<MaterialDraftFields> {
  const normalizedBase = createMaterialDraft(base);
  const normalizedDraft = createMaterialDraft(draft, normalizedBase);
  const patch: Partial<Record<keyof MaterialDraftFields, string>> = {};
  for (const field of Object.keys(normalizedBase) as (keyof MaterialDraftFields)[]) {
    if (field === "orderQuantity" || field === "inventoryUsageQuantity") continue;
    const normalized = normalizedDraft[field].trim();
    if (normalized !== normalizedBase[field].trim()) patch[field] = normalized;
  }
  return patch;
}

export function normalizeMaterialDraft(input: MaterialDraftInput, fallback: MaterialDraftFields = EMPTY_MATERIAL_DRAFT): MaterialDraftFields {
  const draft = createMaterialDraft(input, fallback);
  const requiredQuantity = stripDecimalTrailingZeros(normalizeNumericCommitValue(draft.requiredQuantity));
  const allowanceQuantity = stripDecimalTrailingZeros(normalizeNumericCommitValue(draft.allowanceQuantity));
  const inventoryUsageQuantity = stripDecimalTrailingZeros(normalizeNumericCommitValue(draft.inventoryUsageQuantity));
  return {
    name: draft.name.trim(),
    colorOption: draft.colorOption.trim(),
    usageArea: draft.usageArea.trim(),
    partnerId: draft.partnerId.trim(),
    requiredQuantity,
    allowanceQuantity,
    inventoryUsageQuantity,
    orderQuantity: calculateOrderQuantity({ requiredQuantity, allowanceQuantity, inventoryUsageQuantity }) ?? "0",
    unitCode: draft.unitCode.trim(),
    unitPrice: stripDecimalTrailingZeros(normalizeNumericCommitValue(draft.unitPrice)),
    memo: draft.memo.trim(),
  };
}
