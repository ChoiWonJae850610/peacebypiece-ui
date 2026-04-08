export const MATERIAL_TYPE_OPTIONS = ["원단", "부자재", "기타"] as const;
export const MATERIAL_UNIT_OPTIONS = ["yd", "m", "개", "장", "롤", "kg"] as const;
export const OUTSOURCING_PROCESS_OPTIONS = ["재단", "봉제", "나염", "자수", "워싱", "후가공", "기타"] as const;
export const OUTSOURCING_UNIT_OPTIONS = ["장", "개", "벌", "세트", "롤"] as const;

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

export const SEASON_OPTIONS = ["SS", "FW", "NOS", "ALL"] as const;
const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 7 }, (_, index) => String(currentYear - 2 + index));
export const PRIORITY_OPTIONS = ["긴급", "일반", "여유"] as const;
export const ORDER_TYPE_OPTIONS = ["메인 생산", "추가 생산", "샘플", "재작업", "긴급"] as const;

export const PARTNER_OPTIONS = ["선택 안함", "에이원 트레이딩", "루나텍스타일", "해성어패럴"] as const;
export const FACTORY_OPTIONS = ["선택 안함", "한빛팩토리", "동명봉제", "세림공장"] as const;
export const REGISTRY_TYPE_OPTIONS = ["거래처", "공장"] as const;

export const DEFAULT_MATERIAL_TYPE = "원단" as const;
export const DEFAULT_MATERIAL_UNIT = "yd" as const;
export const DEFAULT_OUTSOURCING_PROCESS = "봉제" as const;
export const DEFAULT_OUTSOURCING_UNIT = "개" as const;
export const DEFAULT_ORDER_TYPE = "메인 생산" as const;
export const DEFAULT_BASIC_YEAR = String(currentYear) as string;
export const DEFAULT_PARTNER_OPTION = PARTNER_OPTIONS[0] as string;
export const DEFAULT_FACTORY_OPTION = FACTORY_OPTIONS[0] as string;
export const DEFAULT_REGISTRY_TYPE = REGISTRY_TYPE_OPTIONS[0] as string;
