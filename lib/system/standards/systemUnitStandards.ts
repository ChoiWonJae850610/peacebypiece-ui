export type SystemUnitStandardStatus = "active" | "inactive" | "review";

export type SystemUnitStandardRow = {
  id: string;
  code: string;
  koreanName: string;
  englishCode: string;
  category: string;
  description: string;
  example: string;
  status: SystemUnitStandardStatus;
  sortOrder: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SystemUnitStandardUpsertInput = {
  id?: string;
  code: string;
  koreanName: string;
  englishCode: string;
  category: string;
  description?: string | null;
  example?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type SystemUnitStandardUpdateInput = Partial<SystemUnitStandardUpsertInput> & {
  id: string;
};

export const SYSTEM_UNIT_STANDARD_STATUS_LABELS: Record<SystemUnitStandardStatus, string> = {
  active: "활성",
  inactive: "비활성",
  review: "검토",
};

export const SYSTEM_UNIT_STANDARD_CATEGORY_LABELS: Record<string, string> = {
  count: "수량",
  length: "길이",
  bundle: "묶음",
  service: "공정",
  general: "일반",
};

export const SYSTEM_UNIT_STANDARD_ROWS: SystemUnitStandardRow[] = [];


export const SYSTEM_UNIT_STANDARD_POLICY = [
  "단위 표준은 시스템관리자가 원장을 관리하고 고객사는 필요한 항목만 사용합니다.",
  "고객관리자 화면에서는 새 단위를 직접 추가하지 않고, 추가 요청은 개발 건의 또는 관리자 문의로 처리합니다.",
  "이번 단계부터 system_unit_standards 원장 조회·추가·수정·활성 상태 변경을 1차 연결합니다.",
] as const;

export function toSystemUnitStandardStatus(isActive: boolean): SystemUnitStandardStatus {
  return isActive ? "active" : "inactive";
}

export function toSystemUnitStandardIsActive(status: SystemUnitStandardStatus): boolean {
  return status !== "inactive";
}
