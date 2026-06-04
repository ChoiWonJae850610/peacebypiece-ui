export type CustomerPolicyDocumentCategory = "service" | "privacy" | "billing" | "data" | "operation";

export type CustomerPolicyDocument = {
  id: string;
  title: string;
  subtitle: string;
  category: CustomerPolicyDocumentCategory;
  categoryLabel: string;
  versionLabel: string;
  effectiveDateLabel: string;
  requiredForApproval: boolean;
  summary: string;
  sections: readonly {
    title: string;
    body: string;
  }[];
};

export const CUSTOMER_POLICY_DOCUMENTS: readonly CustomerPolicyDocument[] = [
  {
    id: "terms-of-service",
    title: "이용약관",
    subtitle: "WAFL 서비스 이용 조건과 계정 운영 기준",
    category: "service",
    categoryLabel: "서비스 이용",
    versionLabel: "v1.0",
    effectiveDateLabel: "시행 준비 중",
    requiredForApproval: true,
    summary:
      "고객사와 멤버가 WAFL을 이용할 때 적용되는 기본 조건, 계정 책임, 서비스 제한 기준을 정리합니다.",
    sections: [
      {
        title: "적용 범위",
        body:
          "이 약관은 고객사가 WAFL에 가입하고 작업지시서, 첨부파일, 디자인, 메모, 발주 관련 기능을 이용하는 전체 과정에 적용됩니다.",
      },
      {
        title: "계정과 권한",
        body:
          "고객사 관리자는 회사 정보, 멤버 초대, 권한 부여, 비활성화 요청을 관리하며 일반 멤버는 부여받은 권한 범위 안에서 업무 기능을 이용합니다.",
      },
      {
        title: "서비스 제한",
        body:
          "승인 대기, 이용 정지, 장기 미납, 해지 완료, 중대한 정책 위반 상태에서는 일부 또는 전체 업무 기능 접근이 제한될 수 있습니다.",
      },
    ],
  },
  {
    id: "privacy-policy",
    title: "개인정보처리방침",
    subtitle: "로그인 계정과 업무 프로필 정보 처리 기준",
    category: "privacy",
    categoryLabel: "개인정보",
    versionLabel: "v1.0",
    effectiveDateLabel: "시행 준비 중",
    requiredForApproval: true,
    summary:
      "Google 로그인 정보, 업무 프로필, 연락처, 권한, 파일 작성자 표시 등 서비스 제공에 필요한 개인정보 처리 기준을 정리합니다.",
    sections: [
      {
        title: "처리 항목",
        body:
          "로그인 이메일, 이름, 업무 표시명, 연락처, 역할, 권한, 접속·처리 이력 등 서비스 운영에 필요한 최소 정보를 처리합니다.",
      },
      {
        title: "처리 목적",
        body:
          "계정 식별, 고객사 소속 확인, 업무 담당자 표시, 권한 제어, 보안 감사, 고객지원 처리를 위해 개인정보를 사용합니다.",
      },
      {
        title: "보관과 삭제",
        body:
          "탈퇴 또는 계약 종료 이후에도 법령상 보관 의무, 분쟁 대응, 업무 이력 보존 필요 범위 안에서 일부 기록이 보관될 수 있습니다.",
      },
    ],
  },
  {
    id: "billing-refund-policy",
    title: "요금·환불정책",
    subtitle: "요금제, 무료체험, 결제 실패, 환불 기준",
    category: "billing",
    categoryLabel: "요금·환불",
    versionLabel: "v1.0",
    effectiveDateLabel: "시행 준비 중",
    requiredForApproval: true,
    summary:
      "무료체험, 요금제 변경, 결제 실패, 해지, 환불 요청의 기본 운영 기준을 고객 공개 문서로 정리합니다.",
    sections: [
      {
        title: "무료체험과 요금제",
        body:
          "초기 무료체험, 저장공간 한도, 멤버 수 제한, 요금제별 제공 기능은 서비스 운영 화면에 표시된 기준을 따릅니다.",
      },
      {
        title: "결제 실패와 제한",
        body:
          "결제 실패가 발생하면 안내 후 일부 기능이 제한될 수 있으며, 장기 미납 상태에서는 서비스 이용이 중지될 수 있습니다.",
      },
      {
        title: "환불과 해지",
        body:
          "해지 신청 후 다음 결제일까지 사용 가능 여부, 환불 가능 범위, 데이터 내보내기 기간은 별도 운영 기준에 따라 처리됩니다.",
      },
    ],
  },
  {
    id: "data-retention-policy",
    title: "데이터 보관·삭제정책",
    subtitle: "파일, 휴지통, 영구삭제, 데이터 내보내기 기준",
    category: "data",
    categoryLabel: "데이터 보관",
    versionLabel: "v1.0",
    effectiveDateLabel: "시행 준비 중",
    requiredForApproval: true,
    summary:
      "작업지시서, 첨부 문서, 디자인, 메모, 휴지통 항목의 보관·복원·삭제·내보내기 기준을 정리합니다.",
    sections: [
      {
        title: "휴지통 보관",
        body:
          "삭제된 작업지시서와 연결된 문서, 디자인, 메모는 즉시 영구삭제하지 않고 복원 가능한 휴지통 상태를 먼저 거칩니다.",
      },
      {
        title: "영구삭제",
        body:
          "휴지통 보관 기간이 지나거나 고객사 관리자가 명시적으로 영구삭제를 요청한 경우 복구할 수 없는 방식으로 삭제될 수 있습니다.",
      },
      {
        title: "데이터 내보내기",
        body:
          "고객사는 계약 종료 또는 운영상 필요 시 정해진 범위의 데이터를 내보내기 요청할 수 있으며 다운로드 링크는 제한된 기간 동안 제공됩니다.",
      },
    ],
  },
  {
    id: "service-operation-policy",
    title: "서비스 운영정책",
    subtitle: "초대, 승인, 권한, 고객지원, 운영 제한 기준",
    category: "operation",
    categoryLabel: "운영 기준",
    versionLabel: "v1.0",
    effectiveDateLabel: "시행 준비 중",
    requiredForApproval: false,
    summary:
      "고객사 승인, 멤버 초대, 권한 변경, 고객지원, 시스템관리자 검토 흐름의 운영 기준을 정리합니다.",
    sections: [
      {
        title: "고객사 승인",
        body:
          "고객사는 승인 요청 후 시스템관리자 검토를 거쳐 서비스를 이용하며, 승인 전에는 업무 기능 접근이 제한될 수 있습니다.",
      },
      {
        title: "멤버 운영",
        body:
          "멤버 초대, 역할 지정, 권한 변경, 비활성화, 탈퇴 요청 처리는 고객사 관리자와 시스템관리자 정책에 따라 처리됩니다.",
      },
      {
        title: "운영 고지",
        body:
          "장애, 점검, 정책 변경, 보안상 필요한 조치가 있는 경우 서비스 화면 또는 이메일을 통해 안내할 수 있습니다.",
      },
    ],
  },
] as const;

export function getRequiredPolicyDocumentCount(): number {
  return CUSTOMER_POLICY_DOCUMENTS.filter((document) => document.requiredForApproval).length;
}
