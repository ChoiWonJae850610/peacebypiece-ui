export const WAFL_ALPHA_SYSTEM_SIZE_LABELS = Object.freeze(["XS", "S", "M", "L", "XL", "2XL", "FREE"]);
export const WAFL_KOREAN_SYSTEM_SIZE_LABELS = Object.freeze(["44", "55", "66", "77", "88"]);
export const WAFL_WAIST_SYSTEM_SIZE_LABELS = Object.freeze(["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]);

const ALL_SYSTEM_SIZE_LABELS = Object.freeze([...WAFL_ALPHA_SYSTEM_SIZE_LABELS, ...WAFL_KOREAN_SYSTEM_SIZE_LABELS, ...WAFL_WAIST_SYSTEM_SIZE_LABELS]);
const WOMENS_APPAREL_SIZES = Object.freeze(["44", "55", "66", "77", "2XL", "FREE"]);
const WOMENS_BOTTOM_SIZES = Object.freeze(["44", "55", "66", "77", "24", "26", "28", "30", "32", "34", "36", "FREE"]);
const MENS_APPAREL_SIZES = Object.freeze(["XS", "S", "M", "L", "XL", "2XL", "FREE"]);
const MENS_BOTTOM_SIZES = Object.freeze(["28", "30", "32", "34", "36", "FREE"]);
const TARGET_MAJOR_SIZE_RECOMMENDATIONS = Object.freeze({
  "여성": Object.freeze({ T: WOMENS_APPAREL_SIZES, B: WOMENS_BOTTOM_SIZES, O: WOMENS_APPAREL_SIZES, D: WOMENS_APPAREL_SIZES }),
  "남성": Object.freeze({ T: MENS_APPAREL_SIZES, B: MENS_BOTTOM_SIZES, O: MENS_APPAREL_SIZES, D: Object.freeze([]) }),
});

const MAJOR_SPEC_FALLBACKS = Object.freeze({
  T: Object.freeze(["body_length", "front_length", "back_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "sleeve_reach", "upper_arm_width", "cuff_width", "neck_width", "front_neck_depth", "back_neck_depth", "across_back"]),
  B: Object.freeze(["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "knee_width", "hem_width", "inseam", "outseam"]),
  O: Object.freeze(["body_length", "front_length", "back_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "sleeve_reach", "upper_arm_width", "cuff_width", "neck_width", "front_neck_depth", "back_neck_depth", "across_back"]),
  D: Object.freeze(["body_length", "front_length", "back_length", "shoulder_width", "chest_width", "waist_width", "hip_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "front_neck_depth", "back_neck_depth", "across_back", "waistline_height"]),
});

const SPEC_RECOMMENDATIONS = Object.freeze({
  T: Object.freeze({
    "티셔츠": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width"]),
    "셔츠": Object.freeze(["body_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "collar_height", "collar_width", "front_placket_width"]),
    "블라우스": Object.freeze(["body_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "collar_height", "collar_width", "front_placket_width"]),
    "폴로": Object.freeze(["body_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "collar_height", "collar_width", "front_placket_width"]),
    "니트": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width"]),
    "맨투맨": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width"]),
    "후드": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "hood_height", "hood_width"]),
    "탑·나시": Object.freeze(["body_length", "chest_width", "waist_width", "hem_width", "armhole_depth", "neck_width", "front_neck_depth", "back_neck_depth"]),
  }),
  B: Object.freeze({
    "팬츠": Object.freeze(["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "knee_width", "hem_width", "inseam", "outseam"]),
    "슬랙스": Object.freeze(["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "knee_width", "hem_width", "inseam", "outseam"]),
    "데님": Object.freeze(["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "knee_width", "hem_width", "inseam", "waistband_height"]),
    "쇼츠": Object.freeze(["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "hem_width", "inseam"]),
    "스커트": Object.freeze(["body_length", "waist_width", "hip_width", "hem_width"]),
    "레깅스": Object.freeze(["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "hem_width", "inseam"]),
  }),
  O: Object.freeze({
    "재킷": Object.freeze(["body_length", "shoulder_width", "across_back", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "lapel_width", "vent_length", "collar_height", "collar_width", "front_placket_width"]),
    "코트": Object.freeze(["body_length", "shoulder_width", "across_back", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "lapel_width", "vent_length", "collar_height", "collar_width", "front_placket_width"]),
    "점퍼": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "zipper_length"]),
    "패딩": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "zipper_length"]),
    "가디건": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width"]),
    "베스트": Object.freeze(["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "neck_width"]),
  }),
  D: Object.freeze({
    "원피스": Object.freeze(["body_length", "shoulder_width", "chest_width", "waist_width", "hip_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "waistline_height"]),
    "점프수트": Object.freeze(["body_length", "shoulder_width", "chest_width", "waist_width", "hip_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "waistline_height"]),
    "셔츠원피스": Object.freeze(["body_length", "shoulder_width", "chest_width", "waist_width", "hip_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width", "waistline_height"]),
    "니트원피스": Object.freeze(["body_length", "shoulder_width", "chest_width", "waist_width", "hip_width", "hem_width", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width"]),
  }),
});

function isRecommendationCategory(categoryCode) { return categoryCode === "T" || categoryCode === "B" || categoryCode === "O" || categoryCode === "D"; }
function normalizedItemCode(itemCode) { return itemCode?.normalize("NFKC").trim() ?? ""; }

export function listWaflAllSystemSizeLabels() { return ALL_SYSTEM_SIZE_LABELS; }
export function resolveWaflRecommendedSizeLabels(targetAudience, categoryCode) {
  if (!isRecommendationCategory(categoryCode)) return Object.freeze([]);
  return TARGET_MAJOR_SIZE_RECOMMENDATIONS[targetAudience]?.[categoryCode] ?? Object.freeze([]);
}
export function resolveWaflSizeRecommendationSections(targetAudience, categoryCode) {
  const recommended = resolveWaflRecommendedSizeLabels(targetAudience, categoryCode);
  const recommendedSet = new Set(recommended);
  return Object.freeze({ recommended: Object.freeze([...recommended]), additional: Object.freeze(ALL_SYSTEM_SIZE_LABELS.filter((label) => !recommendedSet.has(label))) });
}
export function resolveWaflRecommendedSpecCodes(categoryCode, itemCode) {
  if (!isRecommendationCategory(categoryCode)) return Object.freeze([]);
  return SPEC_RECOMMENDATIONS[categoryCode][normalizedItemCode(itemCode)] ?? MAJOR_SPEC_FALLBACKS[categoryCode];
}
export function listWaflRecommendedSpecItems(categoryCode, itemCode, systemItems) {
  const byCode = new Map(systemItems.map((item) => [item.code, item]));
  return Object.freeze(resolveWaflRecommendedSpecCodes(categoryCode, itemCode).flatMap((code) => byCode.has(code) ? [byCode.get(code)] : []));
}
export function resolveWaflSpecRecommendationSections(categoryCode, itemCode, systemItems) {
  const recommended = listWaflRecommendedSpecItems(categoryCode, itemCode, systemItems);
  const recommendedKeys = new Set(recommended.map((item) => item.key));
  return Object.freeze({ recommended, additional: Object.freeze(systemItems.filter((item) => !recommendedKeys.has(item.key))) });
}
export function isKnownWaflRecommendationDetail(categoryCode, itemCode) {
  return isRecommendationCategory(categoryCode) && Object.hasOwn(SPEC_RECOMMENDATIONS[categoryCode], normalizedItemCode(itemCode));
}
