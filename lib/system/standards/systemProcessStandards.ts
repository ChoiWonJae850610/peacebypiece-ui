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

export const SYSTEM_PROCESS_STANDARD_ROWS: SystemProcessStandardRow[] = [
  {
    id: "system-process-printing",
    code: "printing",
    name: "나염",
    category: "surface",
    description: "원단 또는 완제품 위 프린트 공정",
    example: "앞판 나염",
    status: "active",
    sortOrder: 10,
  },
  {
    id: "system-process-embroidery",
    code: "embroidery",
    name: "자수",
    category: "decoration",
    description: "로고, 문양, 포인트 장식을 실로 표현하는 공정",
    example: "가슴 로고 자수",
    status: "active",
    sortOrder: 20,
  },
  {
    id: "system-process-washing",
    code: "washing",
    name: "워싱",
    category: "finishing",
    description: "수축, 질감, 색감 보정을 위한 세탁·후가공 공정",
    example: "데님 워싱",
    status: "active",
    sortOrder: 30,
  },
  {
    id: "system-process-pleats",
    code: "pleats",
    name: "플리츠",
    category: "shape",
    description: "열 또는 기계 가공으로 주름 형태를 고정하는 공정",
    example: "스커트 플리츠 가공",
    status: "active",
    sortOrder: 40,
  },
  {
    id: "system-process-bonding",
    code: "bonding",
    name: "본딩",
    category: "construction",
    description: "원단과 부자재를 접착해 형태나 기능성을 보강하는 공정",
    example: "심지 본딩",
    status: "active",
    sortOrder: 50,
  },
];

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
