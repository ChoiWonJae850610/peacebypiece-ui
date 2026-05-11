export type SystemProductTemplateStatus = "active" | "draft" | "archived";

export type SystemProductTemplateLeaf = {
  id: string;
  name: string;
  description: string;
};

export type SystemProductTemplateSecondLevel = {
  id: string;
  name: string;
  children: SystemProductTemplateLeaf[];
};

export type SystemProductTemplateTopLevel = {
  id: string;
  name: string;
  children: SystemProductTemplateSecondLevel[];
};

export type SystemProductTemplateRow = {
  id: string;
  name: string;
  description: string;
  status: SystemProductTemplateStatus;
  sortOrder: number;
  tree: SystemProductTemplateTopLevel[];
};

export const SYSTEM_PRODUCT_TEMPLATE_STATUS_LABELS: Record<SystemProductTemplateStatus, string> = {
  active: "활성",
  draft: "초안",
  archived: "보관",
};

export const SYSTEM_PRODUCT_TEMPLATE_ROWS: SystemProductTemplateRow[] = [
  {
    id: "template-basic-apparel",
    name: "기본 의류 템플릿",
    description: "상의, 하의, 아우터, 원피스 중심의 신규 고객사 기본 분류입니다.",
    status: "active",
    sortOrder: 10,
    tree: [
      {
        id: "top-tops",
        name: "상의",
        children: [
          {
            id: "tops-tshirt",
            name: "티셔츠",
            children: [
              { id: "tops-tshirt-short", name: "반팔", description: "기본 반팔 티셔츠" },
              { id: "tops-tshirt-long", name: "긴팔", description: "기본 긴팔 티셔츠" },
              { id: "tops-tshirt-over", name: "오버핏", description: "여유핏 티셔츠" },
            ],
          },
          {
            id: "tops-shirt",
            name: "셔츠",
            children: [
              { id: "tops-shirt-basic", name: "기본 셔츠", description: "일반 셔츠" },
              { id: "tops-shirt-blouse", name: "블라우스", description: "여성 블라우스" },
            ],
          },
        ],
      },
      {
        id: "top-bottoms",
        name: "하의",
        children: [
          {
            id: "bottoms-pants",
            name: "팬츠",
            children: [
              { id: "bottoms-pants-wide", name: "와이드", description: "와이드 팬츠" },
              { id: "bottoms-pants-slim", name: "슬림", description: "슬림 팬츠" },
            ],
          },
          {
            id: "bottoms-skirt",
            name: "스커트",
            children: [
              { id: "bottoms-skirt-mini", name: "미니", description: "미니 스커트" },
              { id: "bottoms-skirt-long", name: "롱", description: "롱 스커트" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "template-sample-room",
    name: "샘플실 운영 템플릿",
    description: "샘플 제작과 리오더 관리에 적합한 실무형 기본 분류입니다.",
    status: "draft",
    sortOrder: 20,
    tree: [
      {
        id: "sample-top",
        name: "상의류",
        children: [
          {
            id: "sample-top-cutsew",
            name: "컷소",
            children: [
              { id: "sample-top-cutsew-basic", name: "기본형", description: "기본 컷소" },
              { id: "sample-top-cutsew-detail", name: "디테일형", description: "디테일 중심 컷소" },
            ],
          },
        ],
      },
      {
        id: "sample-outer",
        name: "아우터류",
        children: [
          {
            id: "sample-outer-jacket",
            name: "자켓",
            children: [
              { id: "sample-outer-jacket-crop", name: "크롭", description: "짧은 기장 자켓" },
              { id: "sample-outer-jacket-standard", name: "기본", description: "기본 자켓" },
            ],
          },
        ],
      },
    ],
  },
];

export const SYSTEM_PRODUCT_TEMPLATE_POLICY = [
  "생산품 유형은 고객사별 분류 차이가 크므로 고객관리자 직접 관리를 유지합니다.",
  "시스템관리자는 신규 고객사 생성 시 복사할 기본 템플릿만 관리합니다.",
  "후속 버전에서 system_product_type_templates와 company_product_type_categories 복사 흐름을 분리합니다.",
] as const;
