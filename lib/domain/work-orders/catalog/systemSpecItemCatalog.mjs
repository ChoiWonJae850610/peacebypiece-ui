const SEEDS = Object.freeze({
  T: Object.freeze([
    ["body_length", "총장"], ["front_length", "앞길이"], ["back_length", "뒷길이"], ["shoulder_width", "어깨너비"], ["chest_width", "가슴단면"], ["waist_width", "허리단면"], ["hem_width", "밑단단면"], ["armhole_depth", "암홀"], ["sleeve_length", "소매길이"], ["sleeve_reach", "화장"], ["upper_arm_width", "소매통"], ["cuff_width", "소매단"], ["neck_width", "목너비"], ["front_neck_depth", "앞목깊이"], ["back_neck_depth", "뒷목깊이"], ["across_back", "등너비"], ["collar_height", "카라높이"], ["collar_width", "카라너비"], ["front_placket_width", "앞여밈폭"], ["hood_height", "후드높이"], ["hood_width", "후드폭"],
  ]),
  B: Object.freeze([
    ["body_length", "총장"], ["waist_width", "허리단면"], ["hip_width", "힙단면"], ["front_rise", "앞밑위"], ["back_rise", "뒷밑위"], ["thigh_width", "허벅지단면"], ["knee_width", "무릎단면"], ["hem_width", "밑단단면"], ["inseam", "인심"], ["outseam", "아웃심"], ["waistband_height", "허리벨트높이"],
  ]),
  O: Object.freeze([
    ["body_length", "총장"], ["front_length", "앞길이"], ["back_length", "뒷길이"], ["shoulder_width", "어깨너비"], ["across_back", "등너비"], ["chest_width", "가슴단면"], ["waist_width", "허리단면"], ["hem_width", "밑단단면"], ["armhole_depth", "암홀"], ["sleeve_length", "소매길이"], ["sleeve_reach", "화장"], ["upper_arm_width", "소매통"], ["cuff_width", "소매단"], ["neck_width", "목너비"], ["front_neck_depth", "앞목깊이"], ["back_neck_depth", "뒷목깊이"], ["lapel_width", "라펠너비"], ["vent_length", "트임길이"], ["collar_height", "카라높이"], ["collar_width", "카라너비"], ["front_placket_width", "앞여밈폭"], ["zipper_length", "지퍼길이"],
  ]),
  D: Object.freeze([
    ["body_length", "총장"], ["front_length", "앞길이"], ["back_length", "뒷길이"], ["shoulder_width", "어깨너비"], ["chest_width", "가슴단면"], ["waist_width", "허리단면"], ["hip_width", "힙단면"], ["hem_width", "밑단단면"], ["armhole_depth", "암홀"], ["sleeve_length", "소매길이"], ["upper_arm_width", "소매통"], ["cuff_width", "소매단"], ["neck_width", "목너비"], ["front_neck_depth", "앞목깊이"], ["back_neck_depth", "뒷목깊이"], ["across_back", "등너비"], ["waistline_height", "허리선높이"],
  ]),
  S: Object.freeze([
    ["top_length", "상의 총장"], ["shoulder_width", "어깨너비"], ["chest_width", "가슴단면"], ["top_waist_width", "상의 허리단면"], ["sleeve_length", "소매길이"], ["upper_arm_width", "소매통"], ["cuff_width", "소매단"], ["bottom_length", "하의 총장"], ["bottom_waist_width", "하의 허리단면"], ["hip_width", "힙단면"], ["front_rise", "앞밑위"], ["back_rise", "뒷밑위"], ["thigh_width", "허벅지단면"], ["bottom_hem_width", "하의 밑단단면"], ["inseam", "인심"],
  ]),
  X: Object.freeze([
    ["overall_length", "전체길이"], ["overall_width", "전체너비"], ["overall_height", "전체높이"], ["circumference", "둘레"], ["opening_width", "입구너비"], ["depth", "깊이"], ["thickness", "두께"], ["strap_length", "끈길이"], ["handle_drop", "손잡이높이"], ["spacing", "간격"],
  ]),
});

export const WAFL_SYSTEM_SPEC_ITEM_CATALOG = Object.freeze(Object.fromEntries(
  Object.entries(SEEDS).map(([categoryCode, seeds]) => [categoryCode, Object.freeze(seeds.map(([code, displayName]) => Object.freeze({ key: `${categoryCode}:${code}`, categoryCode, code, displayName })))]),
));
export function listWaflSystemSpecItems(categoryCode) { return categoryCode ? WAFL_SYSTEM_SPEC_ITEM_CATALOG[categoryCode] : []; }
export function findWaflSystemSpecItem(categoryCode, key) { return WAFL_SYSTEM_SPEC_ITEM_CATALOG[categoryCode].find((item) => item.key === key) ?? null; }
