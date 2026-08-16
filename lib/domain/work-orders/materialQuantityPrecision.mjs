export const MATERIAL_QUANTITY_SCALE = 3;
export const MATERIAL_QUANTITY_MAX_WHOLE_DIGITS = 11;
export const MATERIAL_QUANTITY_FACTOR = BigInt(10) ** BigInt(MATERIAL_QUANTITY_SCALE);
export const MATERIAL_QUANTITY_MAX = `${"9".repeat(MATERIAL_QUANTITY_MAX_WHOLE_DIGITS)}.${"9".repeat(MATERIAL_QUANTITY_SCALE)}`;
export const MATERIAL_QUANTITY_MAX_SCALED = BigInt("9".repeat(MATERIAL_QUANTITY_MAX_WHOLE_DIGITS + MATERIAL_QUANTITY_SCALE));
export const MATERIAL_QUANTITY_PATTERN = new RegExp(
  `^(?:0|[1-9]\\d{0,${MATERIAL_QUANTITY_MAX_WHOLE_DIGITS - 1}})(?:\\.\\d{1,${MATERIAL_QUANTITY_SCALE}})?$`,
  "u",
);

export function parseMaterialQuantityScaled(value) {
  const text = String(value).trim();
  if (!MATERIAL_QUANTITY_PATTERN.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * MATERIAL_QUANTITY_FACTOR
    + BigInt(fraction.padEnd(MATERIAL_QUANTITY_SCALE, "0"));
}

export function formatMaterialQuantityScaled(value) {
  const whole = value / MATERIAL_QUANTITY_FACTOR;
  const fraction = (value % MATERIAL_QUANTITY_FACTOR)
    .toString()
    .padStart(MATERIAL_QUANTITY_SCALE, "0")
    .replace(/0+$/u, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

export function exceedsMaterialQuantityPrecision(value) {
  const fraction = value.trim().split(".", 2)[1] ?? "";
  return fraction.length > MATERIAL_QUANTITY_SCALE;
}

export function materialQuantityPrecisionMessage() {
  if (MATERIAL_QUANTITY_SCALE === 3) return "소수점 셋째 자리까지만 입력할 수 있어요.";
  return `소수점 ${MATERIAL_QUANTITY_SCALE}자리까지만 입력할 수 있어요.`;
}
