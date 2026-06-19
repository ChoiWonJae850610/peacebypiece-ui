export const CATEGORY_TREE = {
  상의: {
    티셔츠: ["반팔 티셔츠", "긴팔 티셔츠", "오버핏 티셔츠", "카라 티셔츠"],
    셔츠: ["기본 셔츠", "오버핏 셔츠", "스트라이프 셔츠", "반팔 셔츠"],
    맨투맨: ["기본 맨투맨", "오버핏 맨투맨", "기모 맨투맨", "크롭 맨투맨"],
    후드: ["후드 티셔츠", "후드 집업", "크롭 후드"],
    니트: ["라운드 니트", "가디건", "니트 베스트"],
  },
  하의: {
    팬츠: ["슬랙스", "와이드 팬츠", "조거 팬츠", "카고 팬츠"],
    데님: ["스트레이트 데님", "와이드 데님", "부츠컷 데님"],
    스커트: ["미니 스커트", "미디 스커트", "롱 스커트", "플레어 스커트"],
    쇼츠: ["기본 쇼츠", "데님 쇼츠", "밴딩 쇼츠"],
  },
  아우터: {
    재킷: ["테일러드 재킷", "트위드 재킷", "크롭 재킷"],
    점퍼: ["바람막이", "블루종", "패딩 점퍼"],
    코트: ["롱 코트", "하프 코트", "트렌치 코트"],
    베스트: ["패딩 베스트", "수트 베스트", "니트 베스트"],
  },
  원피스: {
    데일리: ["A라인 원피스", "셔츠 원피스", "랩 원피스"],
    길이: ["미니 원피스", "미디 원피스", "롱 원피스"],
  },
  셋업: {
    수트: ["재킷 팬츠 셋업", "재킷 스커트 셋업"],
    캐주얼: ["맨투맨 팬츠 셋업", "후드 팬츠 셋업"],
  },
  잡화: {
    가방: ["토트백", "크로스백", "파우치"],
    모자: ["볼캡", "버킷햇", "비니"],
    스카프: ["스퀘어 스카프", "롱 스카프"],
  },
  홈웨어: {
    세트: ["파자마 세트", "라운지 세트"],
    단품: ["파자마 상의", "파자마 하의", "로브"],
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
