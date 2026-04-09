export const CATEGORY_TREE = {
  상의: {
    티셔츠: ["반팔", "긴팔", "오버핏"],
    셔츠: ["베이직", "오버핏", "크롭"],
    니트: ["라운드", "가디건", "베스트"],
  },
  하의: {
    팬츠: ["슬랙스", "와이드", "조거"],
    스커트: ["미니", "미디", "롱"],
    데님: ["스트레이트", "와이드", "부츠컷"],
  },
  아우터: {
    자켓: ["테일러드", "트위드", "크롭"],
    코트: ["롱", "하프", "트렌치"],
    점퍼: ["바람막이", "패딩", "블루종"],
  },
} as const;

export const CATEGORY1_OPTIONS = Object.keys(CATEGORY_TREE) as Array<keyof typeof CATEGORY_TREE>;

export const CATEGORY2_OPTIONS_MAP: Record<string, readonly string[]> = Object.fromEntries(
  CATEGORY1_OPTIONS.map((category1) => [category1, Object.keys(CATEGORY_TREE[category1])]),
);

export const CATEGORY3_OPTIONS_MAP: Record<string, readonly string[]> = Object.fromEntries(
  CATEGORY1_OPTIONS.flatMap((category1) =>
    Object.entries(CATEGORY_TREE[category1]).map(([category2, category3Options]) => [category2, category3Options]),
  ),
);

export const DEFAULT_CATEGORY1 = CATEGORY1_OPTIONS[0] ?? "상의";
export const DEFAULT_CATEGORY2 = CATEGORY2_OPTIONS_MAP[DEFAULT_CATEGORY1]?.[0] ?? "미분류";
export const DEFAULT_CATEGORY3 = CATEGORY3_OPTIONS_MAP[DEFAULT_CATEGORY2]?.[0] ?? "미분류";
