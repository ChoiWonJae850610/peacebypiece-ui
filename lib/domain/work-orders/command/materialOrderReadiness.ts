export type MaterialOrderReadinessField =
  | "requiredQuantity"
  | "allowanceQuantity"
  | "inventoryUsageQuantity"
  | "orderQuantity"
  | "unitCode"
  | "partnerId"
  | "unitPrice";

export type MaterialOrderReadinessBlocker = {
  readonly field: MaterialOrderReadinessField;
  readonly code: "INVALID" | "REQUIRED" | "DEMAND_REQUIRED" | "CALCULATION_MISMATCH";
};

export type MaterialOrderReadiness = {
  readonly ready: boolean;
  readonly mode: "stock-covered" | "external-order" | "invalid";
  readonly demand: string | null;
  readonly orderQuantity: string | null;
  readonly blockers: readonly MaterialOrderReadinessBlocker[];
};

type DecimalInput = string | number | null | undefined;

function parseScaled(value: DecimalInput, scale: number): bigint | null {
  const text = typeof value === "number" || typeof value === "string"
    ? String(value).trim()
    : "";
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(text);
  if (!match || (match[2]?.length ?? 0) > scale) return null;
  const fraction = (match[2] ?? "").padEnd(scale, "0");
  return BigInt(match[1]) * (BigInt(10) ** BigInt(scale)) + BigInt(fraction || "0");
}

function formatScaled(value: bigint, scale: number): string {
  const divisor = BigInt(10) ** BigInt(scale);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(scale, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

function addBlocker(
  blockers: MaterialOrderReadinessBlocker[],
  field: MaterialOrderReadinessField,
  code: MaterialOrderReadinessBlocker["code"],
) {
  if (!blockers.some((blocker) => blocker.field === field && blocker.code === code)) {
    blockers.push({ field, code });
  }
}

export function evaluateMaterialOrderReadiness(input: {
  readonly requiredQuantity: DecimalInput;
  readonly allowanceQuantity: DecimalInput;
  readonly inventoryUsageQuantity: DecimalInput;
  readonly orderQuantity: DecimalInput;
  readonly unitCode: unknown;
  readonly supplierPartnerId: unknown;
  readonly unitPrice: DecimalInput;
}): MaterialOrderReadiness {
  const blockers: MaterialOrderReadinessBlocker[] = [];
  const required = parseScaled(input.requiredQuantity, 3);
  const allowance = parseScaled(input.allowanceQuantity, 3);
  const stock = parseScaled(input.inventoryUsageQuantity, 3);
  const storedOrderQuantity = parseScaled(input.orderQuantity, 3);

  if (required === null) addBlocker(blockers, "requiredQuantity", "INVALID");
  if (allowance === null) addBlocker(blockers, "allowanceQuantity", "INVALID");
  if (stock === null) addBlocker(blockers, "inventoryUsageQuantity", "INVALID");
  if (storedOrderQuantity === null) addBlocker(blockers, "orderQuantity", "INVALID");

  const unitCode = typeof input.unitCode === "string" ? input.unitCode.trim() : "";
  if (unitCode.length < 1 || unitCode.length > 32) addBlocker(blockers, "unitCode", "REQUIRED");

  if (required === null || allowance === null || stock === null) {
    return { ready: false, mode: "invalid", demand: null, orderQuantity: null, blockers };
  }

  const demand = required + allowance;
  const calculatedOrderQuantity = demand > stock ? demand - stock : BigInt(0);
  if (demand === BigInt(0)) addBlocker(blockers, "orderQuantity", "DEMAND_REQUIRED");
  if (storedOrderQuantity !== null && storedOrderQuantity !== calculatedOrderQuantity) {
    addBlocker(blockers, "orderQuantity", "CALCULATION_MISMATCH");
  }

  const unitPriceText = typeof input.unitPrice === "number" || typeof input.unitPrice === "string"
    ? String(input.unitPrice).trim()
    : "";
  const unitPrice = unitPriceText ? parseScaled(unitPriceText, 2) : null;
  const stockCovered = demand > BigInt(0) && stock >= demand && calculatedOrderQuantity === BigInt(0);

  if (stockCovered) {
    if (unitPriceText && unitPrice === null) addBlocker(blockers, "unitPrice", "INVALID");
  } else if (calculatedOrderQuantity > BigInt(0)) {
    if (typeof input.supplierPartnerId !== "string" || !input.supplierPartnerId.trim()) {
      addBlocker(blockers, "partnerId", "REQUIRED");
    }
    if (unitPrice === null || unitPrice <= BigInt(0)) addBlocker(blockers, "unitPrice", "REQUIRED");
  }

  const mode = stockCovered
    ? "stock-covered"
    : calculatedOrderQuantity > BigInt(0)
      ? "external-order"
      : "invalid";
  return {
    ready: blockers.length === 0,
    mode,
    demand: formatScaled(demand, 3),
    orderQuantity: formatScaled(calculatedOrderQuantity, 3),
    blockers,
  };
}
