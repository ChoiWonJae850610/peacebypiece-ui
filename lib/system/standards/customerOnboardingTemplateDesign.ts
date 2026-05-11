export type CustomerOnboardingTemplateCopyStep = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
};

export type CustomerOnboardingTemplateCopyCheck = {
  id: string;
  label: string;
  detail: string;
};

export const CUSTOMER_ONBOARDING_TEMPLATE_COPY_STEPS: CustomerOnboardingTemplateCopyStep[] = [
  {
    id: "select-default-template",
    title: "기본 템플릿 선택",
    description:
      "시스템관리자가 기본으로 지정한 활성 생산품 유형 템플릿 1개를 신규 고객사의 초기 생산품 유형 기준으로 사용합니다.",
    statusLabel: "필수",
  },
  {
    id: "create-company",
    title: "고객사 생성",
    description:
      "고객사 기본 정보와 관리자 초대 정보를 만든 뒤 기준정보 복사를 같은 흐름에서 실행할지 분리 실행할지 결정합니다.",
    statusLabel: "설계",
  },
  {
    id: "copy-product-categories",
    title: "생산품 유형 복사",
    description:
      "system_product_type_template_categories의 1차→2차→3차 계층을 고객사 item_categories로 복사합니다.",
    statusLabel: "설계",
  },
  {
    id: "enable-system-standards",
    title: "단위·외주공정 기본 사용 연결",
    description:
      "system_unit_standards와 system_outsourcing_process_standards의 활성 항목을 고객사 사용 상태로 초기 연결합니다.",
    statusLabel: "설계",
  },
  {
    id: "write-audit-log",
    title: "감사 로그 기록",
    description:
      "고객사 생성, 템플릿 복사, 기준정보 초기 연결 결과를 system audit log에 남깁니다.",
    statusLabel: "후속",
  },
];

export const CUSTOMER_ONBOARDING_TEMPLATE_COPY_CHECKS: CustomerOnboardingTemplateCopyCheck[] = [
  {
    id: "single-default-template",
    label: "기본 활성 템플릿은 1개",
    detail:
      "고객사 기본값 복원과 신규 고객사 초기화가 같은 기준을 쓰려면 is_default=true이고 is_active=true인 템플릿이 정확히 1개여야 합니다.",
  },
  {
    id: "db-only",
    label: "fallback 사용 금지",
    detail:
      "신규 고객사 생성 시에도 하드코딩 기본값을 쓰지 않고 DB의 시스템 기준정보만 복사합니다.",
  },
  {
    id: "company-owned-copy",
    label: "고객사 소유 데이터로 복사",
    detail:
      "복사 후 고객관리자가 생산품 유형을 자유롭게 수정할 수 있도록 system template을 참조하지 않고 고객사 item_categories로 독립 저장합니다.",
  },
  {
    id: "idempotent-copy",
    label: "중복 복사 방지",
    detail:
      "이미 고객사 생산품 유형이 있는 경우 자동 덮어쓰기를 막고, 초기 생성/명시적 복원 흐름을 분리해야 합니다.",
  },
];
