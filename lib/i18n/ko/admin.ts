export const adminKo = {
  description:
    "이 페이지는 고객사 기준정보 관리, 사용자 운영, 기본 설정을 분리해서 확장하기 위한 관리자 운영 화면의 시작점이다. 이번 단계에서는 고객사 헤더와 운영 화면 골격을 먼저 정리한다.",
  sections: [
    { title: "기준정보", description: "공장, 거래처, 외주처, 공정 등 운영 기준정보를 확장할 영역" },
    { title: "사용자", description: "초대, 역할 변경, 활성 사용자 관리 화면으로 확장할 영역" },
    { title: "운영 설정", description: "알림, 기본값, 운영 설정을 정리할 영역" },
  ],
} as const;
