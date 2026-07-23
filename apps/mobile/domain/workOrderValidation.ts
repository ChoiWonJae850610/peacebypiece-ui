import type { MaterialDraftFields, WorkOrderDetailCore, WorkOrderMaterialLine } from "@/domain/mobileContract";
import { calculateOrderQuantity, stripDecimalTrailingZeros } from "../lib/mobileDisplay.ts";

export type BasicInfoDraft = {
  readonly productName: string;
  readonly dueDate: string;
  readonly totalQuantity: string;
};

export type BasicInfoFieldErrors = Partial<Record<keyof BasicInfoDraft, string>>;
export type MaterialEditorFieldErrors = Partial<Record<keyof MaterialDraftFields, string>>;

export const EMPTY_MATERIAL_DRAFT: MaterialDraftFields = {
  name: "",
  colorOption: "",
  usageArea: "",
  requiredQuantity: "0",
  allowanceQuantity: "0",
  inventoryUsageQuantity: "0",
  orderQuantity: "0",
  unitCode: "",
  unitPrice: "0",
  memo: "",
};

const MATERIAL_QUANTITY_PATTERN = /^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/;
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
  return {
    productName: detail.header.productName,
    dueDate: detail.header.dueDate ?? "",
    totalQuantity: String(detail.header.totalQuantity),
  };
}

export function validateBasicInfoDraft(draft: BasicInfoDraft): BasicInfoFieldErrors {
  const errors: BasicInfoFieldErrors = {};
  const productName = draft.productName.trim();
  if (productName.length < 1 || productName.length > 200) errors.productName = "제품명은 1자 이상 200자 이하여야 합니다.";
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
  if (!/^\d+$/.test(draft.totalQuantity)) errors.totalQuantity = "총수량은 쉼표 없는 정수로 입력해 주세요.";
  else {
    const quantity = Number(draft.totalQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000_000) {
      errors.totalQuantity = "총수량은 0 이상 100,000,000 이하의 정수여야 합니다.";
    }
  }
  return errors;
}

export function materialDraftFromLine(line: WorkOrderMaterialLine): MaterialDraftFields {
  return createMaterialDraft({
    name: line.name,
    colorOption: line.colorOption ?? "",
    usageArea: line.usageArea ?? "",
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

export function validateMaterialDraft(input: MaterialDraftInput): MaterialEditorFieldErrors {
  const draft = createMaterialDraft(input);
  const errors: MaterialEditorFieldErrors = {};
  if (draft.name.trim().length < 1 || draft.name.trim().length > 200) errors.name = "원단명은 1자 이상 200자 이하여야 합니다.";
  if (draft.colorOption.trim().length > 200) errors.colorOption = "색상·옵션은 200자 이하여야 합니다.";
  if (draft.usageArea.trim().length > 1000) errors.usageArea = "사용부위는 1,000자 이하여야 합니다.";
  if (draft.memo.trim().length > 2000) errors.memo = "메모는 2,000자 이하여야 합니다.";
  if (draft.unitCode.trim().length < 1 || draft.unitCode.trim().length > 32) errors.unitCode = "단위는 1자 이상 32자 이하여야 합니다.";
  for (const field of ["requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity"] as const) {
    if (!MATERIAL_QUANTITY_PATTERN.test(draft[field].trim())) errors[field] = "0 이상의 소수점 3자리 이하 숫자를 입력해 주세요.";
  }
  if (!MATERIAL_PRICE_PATTERN.test(draft.unitPrice.trim())) errors.unitPrice = "단가는 0 이상의 정수 원 단위로 입력해 주세요.";
  const calculatedOrderQuantity = calculateOrderQuantity(draft);
  if (calculatedOrderQuantity !== null && !errors.unitPrice) {
    const [quantityWhole, quantityFraction = ""] = calculatedOrderQuantity.split(".");
    const [priceWhole, priceFraction = ""] = draft.unitPrice.trim().split(".");
    const quantityScaled = BigInt(quantityWhole) * 1000n + BigInt(quantityFraction.padEnd(3, "0"));
    const priceScaled = BigInt(priceWhole) * 100n + BigInt(priceFraction.padEnd(2, "0"));
    const amountCents = (quantityScaled * priceScaled + 500n) / 1000n;
    if (amountCents > 99999999999999n) errors.unitPrice = "계산 금액이 허용 범위를 넘지 않도록 단가를 줄여 주세요.";
  }
  return errors;
}

export function materialPatch(base: MaterialDraftFields, draft: MaterialDraftFields): Partial<MaterialDraftFields> {
  const normalizedBase = createMaterialDraft(base);
  const normalizedDraft = createMaterialDraft(draft, normalizedBase);
  const patch: Partial<Record<keyof MaterialDraftFields, string>> = {};
  for (const field of Object.keys(normalizedBase) as (keyof MaterialDraftFields)[]) {
    if (field === "orderQuantity") continue;
    const normalized = normalizedDraft[field].trim();
    if (normalized !== normalizedBase[field].trim()) patch[field] = normalized;
  }
  return patch;
}

export function normalizeMaterialDraft(input: MaterialDraftInput, fallback: MaterialDraftFields = EMPTY_MATERIAL_DRAFT): MaterialDraftFields {
  const draft = createMaterialDraft(input, fallback);
  const requiredQuantity = stripDecimalTrailingZeros(draft.requiredQuantity);
  const allowanceQuantity = stripDecimalTrailingZeros(draft.allowanceQuantity);
  const inventoryUsageQuantity = stripDecimalTrailingZeros(draft.inventoryUsageQuantity);
  return {
    name: draft.name.trim(),
    colorOption: draft.colorOption.trim(),
    usageArea: draft.usageArea.trim(),
    requiredQuantity,
    allowanceQuantity,
    inventoryUsageQuantity,
    orderQuantity: calculateOrderQuantity({ requiredQuantity, allowanceQuantity, inventoryUsageQuantity }) ?? "0",
    unitCode: draft.unitCode.trim(),
    unitPrice: stripDecimalTrailingZeros(draft.unitPrice),
    memo: draft.memo.trim(),
  };
}
