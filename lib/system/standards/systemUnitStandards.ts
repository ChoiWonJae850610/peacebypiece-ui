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

export const SYSTEM_UNIT_STANDARD_ROWS: SystemUnitStandardRow[] = [
  {
    id: "system-unit-piece",
    code: "piece",
    koreanName: "장",
    englishCode: "pcs",
    category: "count",
    description: "일반 의류 수량 단위",
    example: "티셔츠 100장",
    status: "active",
    sortOrder: 10,
  },
  {
    id: "system-unit-set",
    code: "set",
    koreanName: "벌",
    englishCode: "set",
    category: "count",
    description: "상하의 세트 또는 묶음 단위",
    example: "트레이닝 세트 50벌",
    status: "active",
    sortOrder: 20,
  },
  {
    id: "system-unit-meter",
    code: "meter",
    koreanName: "미터",
    englishCode: "m",
    category: "length",
    description: "원단 길이 단위",
    example: "면 원단 30m",
    status: "active",
    sortOrder: 30,
  },
  {
    id: "system-unit-yard",
    code: "yard",
    koreanName: "야드",
    englishCode: "yd",
    category: "length",
    description: "수입 원단 길이 단위",
    example: "수입 원단 20yd",
    status: "active",
    sortOrder: 40,
  },
  {
    id: "system-unit-roll",
    code: "roll",
    koreanName: "롤",
    englishCode: "roll",
    category: "bundle",
    description: "롤 단위 원부자재",
    example: "심지 3롤",
    status: "active",
    sortOrder: 50,
  },
  {
    id: "system-unit-box",
    code: "box",
    koreanName: "박스",
    englishCode: "box",
    category: "bundle",
    description: "박스 단위 부자재",
    example: "단추 2박스",
    status: "active",
    sortOrder: 60,
  },
  {
    id: "system-unit-process",
    code: "process",
    koreanName: "공정",
    englishCode: "process",
    category: "service",
    description: "외주공정 단위",
    example: "자수 1공정",
    status: "active",
    sortOrder: 70,
  },
];

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
