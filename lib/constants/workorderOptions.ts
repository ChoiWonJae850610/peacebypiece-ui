export const MATERIAL_TYPE_OPTIONS = ["원단", "부자재", "기타"] as const;
export const MATERIAL_UNIT_OPTIONS = ["yd", "m", "개", "장", "롤", "kg"] as const;
export const OUTSOURCING_PROCESS_OPTIONS = ["재단", "봉제", "나염", "자수", "워싱", "후가공", "기타"] as const;
export const OUTSOURCING_UNIT_OPTIONS = ["장", "개", "벌", "세트", "롤"] as const;

export const CATEGORY1_OPTIONS = ["상의", "하의", "아우터"] as const;

export const CATEGORY2_OPTIONS_MAP: Record<string, readonly string[]> = {
  상의: ["티셔츠", "셔츠", "니트"],
  하의: ["팬츠", "스커트", "데님"],
  아우터: ["자켓", "코트", "점퍼"],
} as const;

export const CATEGORY3_OPTIONS_MAP: Record<string, readonly string[]> = {
  티셔츠: ["반팔", "긴팔", "오버핏"],
  셔츠: ["베이직", "오버핏", "크롭"],
  니트: ["라운드", "가디건", "베스트"],
  팬츠: ["슬랙스", "와이드", "조거"],
  스커트: ["미니", "미디", "롱"],
  데님: ["스트레이트", "와이드", "부츠컷"],
  자켓: ["테일러드", "트위드", "크롭"],
  코트: ["롱", "하프", "트렌치"],
  점퍼: ["바람막이", "패딩", "블루종"],
} as const;

export const SEASON_OPTIONS = ["SS", "FW", "NOS", "ALL"] as const;
const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 7 }, (_, index) => String(currentYear - 2 + index));
export const PRIORITY_OPTIONS = ["긴급", "일반", "여유"] as const;

export const DEFAULT_MATERIAL_TYPE = "원단" as const;
export const DEFAULT_MATERIAL_UNIT = "yd" as const;
export const DEFAULT_OUTSOURCING_PROCESS = "봉제" as const;
export const DEFAULT_OUTSOURCING_UNIT = "개" as const;
export const DEFAULT_BASIC_YEAR = String(currentYear) as string;
