import type { PartnerDbPreparationStatus } from "@/lib/partners/types";

export const PARTNER_DB_TABLE_SEQUENCE = [
  "partners",
  "units",
  "partner_items",
] as const;

export const PARTNER_DB_NEXT_VERSION_SEQUENCE = [
  { version: "0.6.431", goal: "partners 테이블 생성" },
  { version: "0.6.4311", goal: "units / partner_items 테이블 생성" },
  { version: "0.6.432", goal: "Partner DB Adapter 연결" },
  { version: "0.6.433", goal: "공장 선택 UI 전환" },
  { version: "0.6.434", goal: "원단 / 부자재 / 외주처 선택 연결" },
] as const;

export const PARTNER_DB_PREPARATION_STATUS: PartnerDbPreparationStatus = {
  codeStructureReady: true,
  sqlExecuted: true,
  dbAdapterConnected: true,
};

export const PARTNER_DB_IMPACT_SCOPE = [
  "관리자 기준정보 관리의 거래처 목록",
  "작업지시서 공장 선택",
  "작업지시서 원단 / 부자재 / 외주 선택",
  "발주요청 출력의 거래처명 snapshot",
  "향후 WorkOrder DB의 partner_id / partner_name_snapshot 저장 기준",
] as const;
