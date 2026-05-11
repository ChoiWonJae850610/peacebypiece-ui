export type SystemProcessStandardStatus = "active" | "inactive" | "review";

export type SystemProcessStandardRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  example: string;
  status: SystemProcessStandardStatus;
  sortOrder: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SystemProcessStandardUpsertInput = {
  id?: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  example?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type SystemProcessStandardUpdateInput = Partial<SystemProcessStandardUpsertInput> & {
  id: string;
};

export const SYSTEM_PROCESS_STANDARD_STATUS_LABELS: Record<SystemProcessStandardStatus, string> = {
  active: "활성",
  inactive: "비활성",
  review: "검토",
};

export const SYSTEM_PROCESS_STANDARD_CATEGORY_LABELS: Record<string, string> = {
  surface: "표면가공",
  finishing: "후가공",
  construction: "구조보강",
  decoration: "장식",
  shape: "형태가공",
  general: "일반",
};

export const SYSTEM_PROCESS_STANDARD_ROWS: SystemProcessStandardRow[] = [];


export const SYSTEM_PROCESS_STANDARD_POLICY = [
  "외주공정 유형은 시스템관리자가 표준 원장을 관리하고 고객사는 필요한 공정만 사용합니다.",
  "고객관리자 화면에서는 새 공정명을 직접 추가하지 않고, 추가 요청은 개발 건의 또는 관리자 문의로 처리합니다.",
  "이번 단계부터 system_outsourcing_process_standards 원장 조회·추가·수정·활성 상태 변경을 1차 연결합니다.",
] as const;

export function toSystemProcessStandardStatus(isActive: boolean): SystemProcessStandardStatus {
  return isActive ? "active" : "inactive";
}

export function toSystemProcessStandardIsActive(status: SystemProcessStandardStatus): boolean {
  return status !== "inactive";
}
