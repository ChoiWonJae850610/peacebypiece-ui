export const adminKo = {
  eyebrow: "PeaceByPiece Admin",
  title: "관리자 페이지 기본 라우트",
  description: "이 페이지는 관리자 대시보드, 사용자 관리, 운영 설정을 분리해서 붙이기 위한 기본 엔트리다. 이번 단계에서는 라우트 구조와 페이지 골격만 준비한다.",
  sections: [
    { title: "통계", description: "상태별 집계, 최근 변경, 병목 구간 요약을 배치할 영역" },
    { title: "사용자", description: "초대, 역할 변경, 활성 사용자 관리 화면으로 확장할 영역" },
    { title: "설정", description: "알림, 기본값, 운영 설정을 정리할 영역" },
  ],
} as const;
