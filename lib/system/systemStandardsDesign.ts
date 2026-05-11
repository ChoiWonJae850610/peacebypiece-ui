export type SystemStandardScope = "system" | "company" | "template";

export type SystemStandardDesignTabId =
  | "units"
  | "outsourcingProcesses"
  | "productTypeTemplates";

export type SystemStandardDesignTab = {
  id: SystemStandardDesignTabId;
  title: string;
  label: string;
  description: string;
  scopeLabel: string;
  statusLabel: string;
  notes: string[];
};

export type SystemStandardSampleRow = {
  id: string;
  primary: string;
  secondary?: string;
  description: string;
  statusLabel: string;
};

export const SYSTEM_STANDARD_DESIGN_TABS: SystemStandardDesignTab[] = [
  {
    id: "units",
    title: "단위 표준",
    label: "시스템 표준",
    description:
      "시스템관리자가 한글명과 영문 코드/약어를 관리하고, 고객사는 필요한 항목만 사용/미사용으로 선택합니다.",
    scopeLabel: "시스템관리자 추가·수정 / 고객관리자 사용 여부 선택",
    statusLabel: "schema 확정",
    notes: [
      "고객사별 자유 입력은 통계와 발주 수량 해석을 흔들 수 있으므로 제한합니다.",
      "고객관리자 화면에서는 새 단위 추가 대신 개발 건의 또는 관리자 문의로 요청합니다.",
      "0.10.38에서 system_unit_standards와 company_enabled_unit_standards schema를 확정했습니다.",
    ],
  },
  {
    id: "outsourcingProcesses",
    title: "외주공정 유형",
    label: "시스템 표준",
    description:
      "나염, 자수, 워싱 같은 공정명은 시스템 표준으로 유지하고 고객사는 사용하는 공정만 선택합니다.",
    scopeLabel: "시스템관리자 추가·수정 / 고객관리자 사용 여부 선택",
    statusLabel: "schema 확정",
    notes: [
      "프린팅/프린트/나염처럼 같은 의미의 항목이 중복되지 않도록 표준명을 관리합니다.",
      "협력업체 관리와 작업지시서 외주 구성의 기준값으로 재사용합니다.",
      "0.10.38에서 system_outsourcing_process_standards와 company_enabled_process_standards schema를 확정했습니다.",
    ],
  },
  {
    id: "productTypeTemplates",
    title: "생산품 유형 기본 템플릿",
    label: "기본 템플릿",
    description:
      "생산품 유형은 고객사별 구조 차이가 크므로 직접 관리를 유지하되, 신규 고객사 생성 시 복사할 기본 템플릿만 시스템에서 관리합니다.",
    scopeLabel: "시스템관리자 기본 템플릿 / 고객관리자 고객사별 직접 관리",
    statusLabel: "schema 확정",
    notes: [
      "1차 → 2차 → 3차 계층은 고객사마다 운영 방식이 다를 수 있어 고객관리자 수정 권한을 유지합니다.",
      "시스템 템플릿은 신규 고객사 onboarding 초기값으로만 사용합니다.",
      "0.10.38에서 system_product_type_templates와 system_product_type_template_categories schema를 확정했습니다.",
    ],
  },
];

export const SYSTEM_UNIT_STANDARD_SAMPLES: SystemStandardSampleRow[] = [
  { id: "unit-pcs", primary: "장", secondary: "pcs", description: "일반 의류 수량 단위", statusLabel: "활성" },
  { id: "unit-set", primary: "벌", secondary: "set", description: "상하의 세트 또는 묶음 단위", statusLabel: "활성" },
  { id: "unit-meter", primary: "미터", secondary: "m", description: "원단 길이 단위", statusLabel: "활성" },
  { id: "unit-yard", primary: "야드", secondary: "yd", description: "수입 원단 길이 단위", statusLabel: "활성" },
];

export const SYSTEM_PROCESS_STANDARD_SAMPLES: SystemStandardSampleRow[] = [
  { id: "process-print", primary: "나염", description: "원단 또는 완제품 위 프린트 공정", statusLabel: "활성" },
  { id: "process-embroidery", primary: "자수", description: "로고·문양 자수 공정", statusLabel: "활성" },
  { id: "process-washing", primary: "워싱", description: "수축·질감·후가공 워싱 공정", statusLabel: "활성" },
  { id: "process-pleats", primary: "플리츠", description: "주름 고정 외주 공정", statusLabel: "검토" },
];

export const SYSTEM_PRODUCT_TEMPLATE_SAMPLES: SystemStandardSampleRow[] = [
  { id: "product-top", primary: "상의", secondary: "티셔츠 / 셔츠 / 니트", description: "기본 상의 계층 템플릿", statusLabel: "기본값" },
  { id: "product-bottom", primary: "하의", secondary: "팬츠 / 스커트", description: "기본 하의 계층 템플릿", statusLabel: "기본값" },
  { id: "product-outer", primary: "아우터", secondary: "자켓 / 코트 / 점퍼", description: "기본 아우터 계층 템플릿", statusLabel: "기본값" },
];

export const SYSTEM_STANDARDS_POLICY_NOTES = [
  "고객관리자 환경설정에서는 단위 표준과 외주공정 유형을 직접 추가하지 않고 사용 여부만 선택합니다.",
  "생산품 유형은 고객사별 분류 방식 차이가 크므로 고객관리자 직접 관리를 유지합니다.",
  "0.10.38에서 시스템 표준 원장과 고객사별 사용 관계 schema를 확정했습니다. 실제 CRUD와 고객사 신규 생성 시 복사 로직은 후속 버전에서 분리합니다.",
] as const;
