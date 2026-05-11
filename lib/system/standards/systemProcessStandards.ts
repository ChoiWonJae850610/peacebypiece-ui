export type SystemProcessStandardStatus = "active" | "inactive" | "review";

export type SystemProcessStandardRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  example: string;
  status: SystemProcessStandardStatus;
  sortOrder: number;
};

export const SYSTEM_PROCESS_STANDARD_STATUS_LABELS: Record<SystemProcessStandardStatus, string> = {
  active: "활성",
  inactive: "비활성",
  review: "검토",
};

export const SYSTEM_PROCESS_STANDARD_ROWS: SystemProcessStandardRow[] = [
  {
    id: "process-print",
    name: "나염",
    category: "프린트",
    description: "원단 또는 완제품 위에 그래픽을 찍는 외주 공정",
    example: "티셔츠 전면 나염",
    status: "active",
    sortOrder: 10,
  },
  {
    id: "process-embroidery",
    name: "자수",
    category: "장식",
    description: "로고, 문양, 포인트 장식을 실로 표현하는 공정",
    example: "가슴 로고 자수",
    status: "active",
    sortOrder: 20,
  },
  {
    id: "process-washing",
    name: "워싱",
    category: "후가공",
    description: "수축, 질감, 색감 보정을 위한 세탁·후가공 공정",
    example: "데님 워싱",
    status: "active",
    sortOrder: 30,
  },
  {
    id: "process-pleats",
    name: "플리츠",
    category: "형태가공",
    description: "열 또는 기계 가공으로 주름 형태를 고정하는 공정",
    example: "스커트 플리츠 가공",
    status: "review",
    sortOrder: 40,
  },
  {
    id: "process-bonding",
    name: "본딩",
    category: "접착",
    description: "원단과 부자재를 접착해 형태나 기능성을 보강하는 공정",
    example: "심지 본딩",
    status: "active",
    sortOrder: 50,
  },
];

export const SYSTEM_PROCESS_STANDARD_POLICY = [
  "외주공정 유형은 시스템관리자가 표준 원장을 관리하고 고객사는 필요한 공정만 사용합니다.",
  "고객관리자 화면에서는 새 공정명을 직접 추가하지 않고, 추가 요청은 개발 건의 또는 관리자 문의로 처리합니다.",
  "후속 버전에서 system_outsourcing_process_standards와 company_enabled_process_standards 저장 구조를 확정합니다.",
] as const;
