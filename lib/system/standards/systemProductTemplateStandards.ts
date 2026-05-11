export type SystemProductTemplateStatus = "active" | "draft" | "archived";

export type SystemProductTemplateLeaf = {
  id: string;
  name: string;
  description: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type SystemProductTemplateSecondLevel = {
  id: string;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
  children: SystemProductTemplateLeaf[];
};

export type SystemProductTemplateTopLevel = {
  id: string;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
  children: SystemProductTemplateSecondLevel[];
};

export type SystemProductTemplateRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  isDefault: boolean;
  status: SystemProductTemplateStatus;
  sortOrder: number;
  tree: SystemProductTemplateTopLevel[];
  createdAt?: string;
  updatedAt?: string;
};

export type SystemProductTemplateUpsertInput = {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type SystemProductTemplateUpdateInput = {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type SystemProductTemplateCategoryCreateInput = {
  templateId: string;
  parentId?: string | null;
  level: 1 | 2 | 3;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type SystemProductTemplateCategoryUpdateInput = {
  id: string;
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export const SYSTEM_PRODUCT_TEMPLATE_STATUS_LABELS: Record<SystemProductTemplateStatus, string> = {
  active: "활성",
  draft: "초안",
  archived: "보관",
};

export function toSystemProductTemplateStatus(isActive: boolean): SystemProductTemplateStatus {
  return isActive ? "active" : "archived";
}

export function isSystemProductTemplateActive(status: SystemProductTemplateStatus): boolean {
  return status !== "archived";
}

export const SYSTEM_PRODUCT_TEMPLATE_ROWS: SystemProductTemplateRow[] = [
  {
    id: "template-apparel-basic",
    code: "apparel-basic",
    name: "의류 기본 템플릿",
    description: "상의, 하의, 아우터, 원피스 중심의 신규 고객사 기본 분류입니다.",
    isDefault: true,
    status: "active",
    sortOrder: 10,
    tree: [
      {
        id: "template-apparel-basic:상의",
        name: "상의",
        isActive: true,
        sortOrder: 10,
        children: [
          {
            id: "template-apparel-basic:상의:티셔츠",
            name: "티셔츠",
            isActive: true,
            sortOrder: 10,
            children: [
              { id: "template-apparel-basic:상의:티셔츠:반팔", name: "반팔", description: "기본 반팔 티셔츠", isActive: true, sortOrder: 10 },
              { id: "template-apparel-basic:상의:티셔츠:긴팔", name: "긴팔", description: "기본 긴팔 티셔츠", isActive: true, sortOrder: 20 },
              { id: "template-apparel-basic:상의:티셔츠:오버핏", name: "오버핏", description: "여유핏 티셔츠", isActive: true, sortOrder: 30 },
            ],
          },
          {
            id: "template-apparel-basic:상의:셔츠",
            name: "셔츠",
            isActive: true,
            sortOrder: 20,
            children: [
              { id: "template-apparel-basic:상의:셔츠:기본", name: "기본 셔츠", description: "일반 셔츠", isActive: true, sortOrder: 10 },
              { id: "template-apparel-basic:상의:셔츠:블라우스", name: "블라우스", description: "여성 블라우스", isActive: true, sortOrder: 20 },
            ],
          },
        ],
      },
      {
        id: "template-apparel-basic:하의",
        name: "하의",
        isActive: true,
        sortOrder: 20,
        children: [
          {
            id: "template-apparel-basic:하의:팬츠",
            name: "팬츠",
            isActive: true,
            sortOrder: 10,
            children: [
              { id: "template-apparel-basic:하의:팬츠:와이드", name: "와이드", description: "와이드 팬츠", isActive: true, sortOrder: 10 },
              { id: "template-apparel-basic:하의:팬츠:슬랙스", name: "슬랙스", description: "슬랙스", isActive: true, sortOrder: 20 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "template-sample-room",
    code: "sample-room",
    name: "샘플실 운영 템플릿",
    description: "샘플 제작과 리오더 관리에 적합한 실무형 기본 분류입니다.",
    isDefault: false,
    status: "draft",
    sortOrder: 20,
    tree: [
      {
        id: "sample-top",
        name: "상의류",
        isActive: true,
        sortOrder: 10,
        children: [
          {
            id: "sample-top-cutsew",
            name: "컷소",
            isActive: true,
            sortOrder: 10,
            children: [
              { id: "sample-top-cutsew-basic", name: "기본형", description: "기본 컷소", isActive: true, sortOrder: 10 },
              { id: "sample-top-cutsew-detail", name: "디테일형", description: "디테일 중심 컷소", isActive: true, sortOrder: 20 },
            ],
          },
        ],
      },
    ],
  },
];

export const SYSTEM_PRODUCT_TEMPLATE_POLICY = [
  "생산품 유형은 고객사별 분류 차이가 크므로 고객관리자 직접 관리를 유지합니다.",
  "시스템관리자는 신규 고객사 생성 시 복사할 기본 템플릿 원장만 관리합니다.",
  "후속 버전에서 신규 고객사 생성 시 선택한 템플릿을 고객사 기준정보로 복사합니다.",
] as const;
