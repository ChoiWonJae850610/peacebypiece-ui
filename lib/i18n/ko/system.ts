export const systemKo = {
  eyebrow: "PeaceByPiece System",
  title: "최고관리자 운영 화면",
  description: "고객사 초대, 고객사별 운영 현황, 작업지시서 추천 규칙을 최고관리자 기준으로 확장하기 위한 기본 화면입니다.",
  versionLabel: "버전",
  moveToWorkspace: "작업지시서 화면으로 이동",
  cards: {
    companies: {
      title: "고객사 관리",
      description: "고객사 생성, 관리자 초대, 활성 상태 점검을 붙일 영역",
      badge: "다음 단계",
    },
    invites: {
      title: "초대 및 권한",
      description: "고객사 관리자 초대, 역할 분배, 좌석 상태를 관리할 영역",
      badge: "구조 준비",
    },
    categoryRules: {
      title: "추천 규칙 관리",
      description: "작업지시서명 키워드와 추천 분류 연결 규칙을 최고관리자 기준으로 관리할 영역",
      badge: "우선순위 높음",
    },
  },
  companySection: {
    title: "고객사 목록 미리보기",
    description: "최고관리자가 직접 관리할 고객사 샘플 목록입니다.",
    adminLabel: "고객사 관리자",
  },
  ruleSection: {
    title: "추천 규칙 미리보기",
    description: "향후 /system 전용 규칙 관리 화면으로 확장할 기본 리스트입니다.",
    keywordsLabel: "키워드",
    recommendationLabel: "추천 분류",
  },
} as const;
