export type WorkOrderCategoryRecommendation = {
  category1: string;
  category2: string;
  category3: string;
  reason: string;
};

export type WorkOrderCategoryKeywordRule = {
  keywords: string[];
  recommendation: WorkOrderCategoryRecommendation;
};

export const WORKORDER_CATEGORY_KEYWORD_RULES: WorkOrderCategoryKeywordRule[] = [
  {
    keywords: ["반팔", "반소매", "숏슬리브", "티셔츠", "티"],
    recommendation: {
      category1: "상의",
      category2: "티셔츠",
      category3: "반팔",
      reason: "제목에 반팔/티셔츠 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["긴팔", "롱슬리브", "long sleeve"],
    recommendation: {
      category1: "상의",
      category2: "티셔츠",
      category3: "긴팔",
      reason: "제목에 긴팔 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["셔츠", "남방"],
    recommendation: {
      category1: "상의",
      category2: "셔츠",
      category3: "베이직",
      reason: "제목에 셔츠 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["니트", "스웨터", "가디건"],
    recommendation: {
      category1: "상의",
      category2: "니트",
      category3: "라운드",
      reason: "제목에 니트 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["팬츠", "바지", "슬랙스", "조거"],
    recommendation: {
      category1: "하의",
      category2: "팬츠",
      category3: "와이드",
      reason: "제목에 팬츠/바지 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["데님", "청바지", "진"],
    recommendation: {
      category1: "하의",
      category2: "데님",
      category3: "스트레이트",
      reason: "제목에 데님 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["스커트", "치마"],
    recommendation: {
      category1: "하의",
      category2: "스커트",
      category3: "미디",
      reason: "제목에 스커트 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["자켓", "재킷", "블레이저"],
    recommendation: {
      category1: "아우터",
      category2: "자켓",
      category3: "테일러드",
      reason: "제목에 자켓 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["코트", "트렌치"],
    recommendation: {
      category1: "아우터",
      category2: "코트",
      category3: "롱",
      reason: "제목에 코트 계열 키워드가 포함되어 있습니다.",
    },
  },
  {
    keywords: ["점퍼", "패딩", "블루종", "바람막이"],
    recommendation: {
      category1: "아우터",
      category2: "점퍼",
      category3: "바람막이",
      reason: "제목에 점퍼/아우터 계열 키워드가 포함되어 있습니다.",
    },
  },
];
