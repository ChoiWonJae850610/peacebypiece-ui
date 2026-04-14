import type { SystemCategoryRuleSummary, SystemCompanySummary } from "@/lib/data/domain/system";

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
