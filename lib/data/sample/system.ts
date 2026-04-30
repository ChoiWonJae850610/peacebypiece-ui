import type { SystemCategoryRuleSummary, SystemCompanySummary, SystemInviteFlowStep, SystemInviteSummary, SystemOperationItem } from "@/lib/data/domain/system";

export const SAMPLE_WORKSPACE_COMPANY_NAME = "샘플 고객사";

export const SAMPLE_SYSTEM_COMPANY_SUMMARIES: SystemCompanySummary[] = [
  {
    id: "company-apm-studio",
    name: "APM 스튜디오",
    adminName: "김대표",
    seatSummary: "관리자 1 · 디자이너 3 · 재고관리 1",
    statusLabel: "운영중",
  },
  {
    id: "company-dongdaemun-lab",
    name: "동대문 랩",
    adminName: "이실장",
    seatSummary: "관리자 1 · 디자이너 2",
    statusLabel: "초대 준비",
  },
  {
    id: "company-nueva-line",
    name: "누에바 라인",
    adminName: "박팀장",
    seatSummary: "관리자 1 · 디자이너 1 · 재고관리 1",
    statusLabel: "테스트중",
  },
];

export const SAMPLE_SYSTEM_CATEGORY_RULE_SUMMARIES: SystemCategoryRuleSummary[] = [
  {
    id: "rule-short-sleeve-tee",
    title: "반팔 티셔츠 기본 규칙",
    keywordSummary: "반팔, 반소매, 티셔츠, 숏슬리브",
    recommendation: "상의 / 티셔츠 / 반팔",
    statusLabel: "사용중",
  },
  {
    id: "rule-denim-jacket",
    title: "데님 자켓 규칙",
    keywordSummary: "데님자켓, 청자켓, 트러커",
    recommendation: "아우터 / 자켓 / 데님",
    statusLabel: "사용중",
  },
  {
    id: "rule-skirt-pleats",
    title: "플리츠 스커트 규칙",
    keywordSummary: "플리츠, 주름스커트, pleats",
    recommendation: "하의 / 스커트 / 플리츠",
    statusLabel: "검토중",
  },
];

export const SAMPLE_SYSTEM_OPERATION_ITEMS: SystemOperationItem[] = [
  {
    id: "operation-company-approval",
    title: "고객사 승인/생성",
    description: "신규 고객사 신청을 확인하고 회사 기본 정보와 고객사 관리자 계정을 생성할 영역입니다.",
    statusLabel: "준비중",
  },
  {
    id: "operation-plan-storage",
    title: "요금제/용량 관리",
    description: "고객사별 저장소 사용량, 기본 제공 용량, 추가 용량 요청을 연결할 영역입니다.",
    statusLabel: "설계 필요",
  },
  {
    id: "operation-system-admin",
    title: "시스템 관리자 권한",
    description: "시스템 관리자와 고객사 관리자의 접근 범위를 분리하고 감사 로그를 남길 영역입니다.",
    statusLabel: "정책 준비",
  },
];

export const SAMPLE_SYSTEM_INVITE_FLOW_STEPS: SystemInviteFlowStep[] = [
  {
    id: "invite-create",
    title: "초대 생성",
    description: "고객사, 관리자 이메일, 역할, 만료일을 입력해 초대 레코드를 생성합니다.",
    statusLabel: "기준 확정",
  },
  {
    id: "invite-send",
    title: "초대 발송",
    description: "토큰 기반 초대 링크를 발송하고 링크 노출 여부를 감사 로그 대상으로 둡니다.",
    statusLabel: "UI 준비",
  },
  {
    id: "invite-accept",
    title: "초대 수락",
    description: "수락 시 고객사 관리자 계정과 company_users 연결을 생성하는 단계입니다.",
    statusLabel: "DB 연결 예정",
  },
  {
    id: "invite-expire",
    title: "만료/재발송",
    description: "만료된 초대는 재발송 또는 폐기만 가능하게 분리합니다.",
    statusLabel: "정책 준비",
  },
];

export const SAMPLE_SYSTEM_INVITE_SUMMARIES: SystemInviteSummary[] = [
  {
    id: "invite-apm-admin",
    companyName: "APM 스튜디오",
    inviteeName: "김대표",
    email: "owner@apm-studio.kr",
    roleLabel: "고객사 관리자",
    status: "sent",
    statusLabel: "수락 대기",
    expiresAtLabel: "D-5",
    tokenPreview: "inv_apm_••••_7K2",
    inviteUrlLabel: "초대 링크 생성됨",
    requestedByLabel: "시스템 관리자",
    acceptedAtLabel: null,
    actions: [
      { id: "copy", label: "링크 복사", tone: "secondary" },
      { id: "resend", label: "재발송", tone: "primary" },
      { id: "expire", label: "만료 처리", tone: "danger" },
    ],
  },
  {
    id: "invite-dongdaemun-admin",
    companyName: "동대문 랩",
    inviteeName: "이실장",
    email: "manager@ddm-lab.kr",
    roleLabel: "고객사 관리자",
    status: "draft",
    statusLabel: "발송 전",
    expiresAtLabel: "미설정",
    tokenPreview: "미생성",
    inviteUrlLabel: "발송 전",
    requestedByLabel: "시스템 관리자",
    acceptedAtLabel: null,
    actions: [
      { id: "send", label: "초대 발송", tone: "primary" },
      { id: "edit", label: "내용 수정", tone: "secondary" },
    ],
  },
  {
    id: "invite-nueva-admin",
    companyName: "누에바 라인",
    inviteeName: "박팀장",
    email: "lead@nueva-line.kr",
    roleLabel: "고객사 관리자",
    status: "accepted",
    statusLabel: "수락 완료",
    expiresAtLabel: "완료",
    tokenPreview: "inv_nueva_••••_9P1",
    inviteUrlLabel: "사용 완료",
    requestedByLabel: "시스템 관리자",
    acceptedAtLabel: "2026-04-28 14:10",
    actions: [
      { id: "view", label: "고객사 보기", tone: "secondary" },
    ],
  },
];
