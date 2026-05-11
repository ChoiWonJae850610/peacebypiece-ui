export type SystemUnitStandardStatus = "active" | "inactive" | "review";

export type SystemUnitStandardRow = {
  id: string;
  koreanName: string;
  englishCode: string;
  description: string;
  example: string;
  status: SystemUnitStandardStatus;
  sortOrder: number;
};

export const SYSTEM_UNIT_STANDARD_STATUS_LABELS: Record<SystemUnitStandardStatus, string> = {
  active: "활성",
  inactive: "비활성",
  review: "검토",
};

export const SYSTEM_UNIT_STANDARD_ROWS: SystemUnitStandardRow[] = [
  {
    id: "unit-pcs",
    koreanName: "장",
    englishCode: "pcs",
    description: "일반 의류 완제품 수량 단위",
    example: "티셔츠 100장",
    status: "active",
    sortOrder: 10,
  },
  {
    id: "unit-set",
    koreanName: "벌",
    englishCode: "set",
    description: "세트 상품 또는 묶음 생산 단위",
    example: "상하의 20벌",
    status: "active",
    sortOrder: 20,
  },
  {
    id: "unit-meter",
    koreanName: "미터",
    englishCode: "m",
    description: "원단 길이 기준 단위",
    example: "원단 15m",
    status: "active",
    sortOrder: 30,
  },
  {
    id: "unit-yard",
    koreanName: "야드",
    englishCode: "yd",
    description: "수입 원단 길이 기준 단위",
    example: "원단 10yd",
    status: "active",
    sortOrder: 40,
  },
  {
    id: "unit-roll",
    koreanName: "롤",
    englishCode: "roll",
    description: "원단 또는 부자재 묶음 기준 단위",
    example: "심지 2roll",
    status: "review",
    sortOrder: 50,
  },
];

export const SYSTEM_UNIT_STANDARD_POLICY = [
  "단위 표준은 시스템관리자가 원장을 관리하고 고객사는 필요한 항목만 사용합니다.",
  "고객관리자 화면에서는 새 단위를 직접 추가하지 않고, 추가 요청은 개발 건의 또는 관리자 문의로 처리합니다.",
  "후속 버전에서 system_unit_standards와 company_enabled_unit_standards 저장 구조를 확정합니다.",
] as const;
