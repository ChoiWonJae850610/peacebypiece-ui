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

export const SYSTEM_PRODUCT_TEMPLATE_ROWS: SystemProductTemplateRow[] = [];


export const SYSTEM_PRODUCT_TEMPLATE_POLICY = [
  "생산품 유형은 고객사별 분류 차이가 크므로 고객관리자 직접 관리를 유지합니다.",
  "시스템관리자는 신규 고객사 생성 시 복사할 기본 템플릿 원장만 관리합니다.",
  "후속 버전에서 신규 고객사 생성 시 선택한 템플릿을 고객사 기준정보로 복사합니다.",
] as const;
