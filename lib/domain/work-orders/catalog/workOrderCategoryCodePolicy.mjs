export const WORK_ORDER_MAJOR_CATEGORY_CODES = Object.freeze(["T", "B", "O", "D", "S", "X"]);

const LEGACY_MAJOR_CODE_BY_PRODUCT_TYPE = Object.freeze({
  "apparel.top": "T",
  "apparel.bottom": "B",
  "apparel.outer": "O",
  "apparel.onepiece_set": "D",
});

const CATEGORY_PREFIX = "wafl-c1";

export function decodeWorkOrderMajorCategoryCode(productTypeCode) {
  const code = productTypeCode?.trim() ?? "";
  const [prefix, , majorCode = "", extra] = code.split("|");
  if (prefix === CATEGORY_PREFIX && extra === undefined && WORK_ORDER_MAJOR_CATEGORY_CODES.includes(majorCode)) {
    return majorCode;
  }
  return LEGACY_MAJOR_CODE_BY_PRODUCT_TYPE[code] ?? null;
}
