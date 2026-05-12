export type InvitationDeliveryChannel = "manual_link" | "manual_qr" | "email" | "sms" | "kakao_alimtalk";

export type InvitationEmailProvider = "resend" | "aws_ses" | "sendgrid";

export type InvitationDeliveryReadiness = "current" | "candidate" | "deferred";

export interface InvitationDeliveryChannelPolicy {
  channel: InvitationDeliveryChannel;
  label: string;
  readiness: InvitationDeliveryReadiness;
  summary: string;
  requiredWork: readonly string[];
  blockedReason?: string;
}

export interface InvitationEmailProviderPolicy {
  provider: InvitationEmailProvider;
  label: string;
  strengths: readonly string[];
  risks: readonly string[];
  recommendedUse: string;
}

export interface InvitationEmailTemplatePolicy {
  templateId: string;
  title: string;
  subjectPurpose: string;
  requiredVariables: readonly string[];
  securityNotes: readonly string[];
}

export const INVITATION_DELIVERY_PRIMARY_CHANNEL: InvitationDeliveryChannel = "manual_link";

export const INVITATION_DELIVERY_CHANNEL_POLICIES: readonly InvitationDeliveryChannelPolicy[] = [
  {
    channel: "manual_link",
    label: "초대 링크 복사",
    readiness: "current",
    summary: "초대 링크를 생성한 뒤 사용자가 카카오톡, 문자, 이메일 등 원하는 채널로 직접 전달하는 1차 방식입니다.",
    requiredWork: ["invitations 저장", "raw token 1회 노출", "token_hash 저장", "초대 만료/취소 상태 관리"],
  },
  {
    channel: "manual_qr",
    label: "QR 직접 공유",
    readiness: "current",
    summary: "같은 초대 링크를 QR로 표현하는 방식이며 별도 발송 인프라 없이 오프라인 안내나 메신저 이미지 공유에 사용할 수 있습니다.",
    requiredWork: ["초대 URL 생성", "QR 렌더링", "만료/취소 상태 안내"],
  },
  {
    channel: "email",
    label: "자동 이메일 발송",
    readiness: "candidate",
    summary: "도메인 인증과 발송 로그 정책이 준비된 뒤 도입할 수 있는 후속 발송 채널입니다.",
    requiredWork: ["발송 provider 선택", "SPF/DKIM/DMARC 설정", "발송 실패/재발송 정책", "발송 감사 로그", "초대 이메일 템플릿"],
  },
  {
    channel: "sms",
    label: "SMS 자동 발송",
    readiness: "deferred",
    summary: "비용과 발신번호 등록, 스팸 정책 검토가 필요하므로 초기 버전에서는 제외합니다.",
    requiredWork: ["SMS provider 계약", "발신번호 등록", "비용 한도", "수신 거부/재발송 정책"],
    blockedReason: "초기 테스트에서는 링크 복사 방식으로 충분하며 SMS는 건당 비용이 발생합니다.",
  },
  {
    channel: "kakao_alimtalk",
    label: "카카오 알림톡",
    readiness: "deferred",
    summary: "템플릿 심사와 사업자/채널 요건이 필요하므로 고객사 초대 흐름 안정화 이후 검토합니다.",
    requiredWork: ["카카오 비즈니스 채널", "알림톡 템플릿 심사", "대행사 또는 발송 API 검토", "실패 시 대체 발송 정책"],
    blockedReason: "심사와 운영 비용이 필요해 1차 초대 기능의 범위를 넘습니다.",
  },
] as const;

export const INVITATION_EMAIL_PROVIDER_POLICIES: readonly InvitationEmailProviderPolicy[] = [
  {
    provider: "resend",
    label: "Resend",
    strengths: ["개발자 경험이 단순함", "초기 템플릿 테스트가 빠름", "Next.js 프로젝트와 연결하기 쉬움"],
    risks: ["운영 도메인 인증 필요", "요금제와 발송 한도 확인 필요", "장기 비용은 사용량 기준으로 재검토 필요"],
    recommendedUse: "초기 SaaS 초대 메일 테스트 후보입니다.",
  },
  {
    provider: "aws_ses",
    label: "AWS SES",
    strengths: ["대량 발송 단가가 낮은 편", "운영 인프라 확장성이 높음", "도메인/반송/불만 처리 구성이 가능함"],
    risks: ["초기 설정이 상대적으로 복잡함", "sandbox 해제와 DNS 설정이 필요함", "운영 모니터링 설계가 필요함"],
    recommendedUse: "발송량이 늘어난 뒤 장기 운영 후보입니다.",
  },
  {
    provider: "sendgrid",
    label: "SendGrid",
    strengths: ["전통적인 이메일 발송 관리 기능이 많음", "템플릿/통계 기능을 활용할 수 있음", "운영 사례가 많음"],
    risks: ["설정 항목이 많음", "요금제 확인 필요", "국내 수신 품질은 별도 테스트 필요"],
    recommendedUse: "마케팅/거래성 메일을 함께 키울 경우 비교 후보입니다.",
  },
] as const;

export const INVITATION_EMAIL_TEMPLATE_POLICIES: readonly InvitationEmailTemplatePolicy[] = [
  {
    templateId: "company_invitation",
    title: "시스템관리자 고객사 초대",
    subjectPurpose: "신규 고객사 담당자가 고객사 가입 신청 화면으로 이동하도록 안내합니다.",
    requiredVariables: ["companyCandidateName", "inviteUrl", "expiresAt", "inviterName"],
    securityNotes: ["raw token은 이메일 본문 URL에만 포함하고 DB에는 저장하지 않습니다.", "초대 URL은 만료일과 취소 상태를 서버에서 다시 검증합니다."],
  },
  {
    templateId: "member_invitation",
    title: "고객관리자 내부 멤버 초대",
    subjectPurpose: "디자이너, 검수담당자, 재고담당자 등 내부 멤버가 가입 신청 화면으로 이동하도록 안내합니다.",
    requiredVariables: ["companyName", "inviteUrl", "permissionPresetLabel", "expiresAt", "inviterName"],
    securityNotes: ["이메일 수신자와 로그인 이메일 일치 검증 정책을 적용합니다.", "승인 전에는 /pending 외 업무 화면 접근을 차단합니다."],
  },
] as const;

export function getCurrentInvitationDeliveryPolicy(): InvitationDeliveryChannelPolicy {
  return INVITATION_DELIVERY_CHANNEL_POLICIES.find((policy) => policy.channel === INVITATION_DELIVERY_PRIMARY_CHANNEL) ?? INVITATION_DELIVERY_CHANNEL_POLICIES[0];
}
