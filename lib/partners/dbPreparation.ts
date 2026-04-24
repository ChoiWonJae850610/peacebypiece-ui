import type { PartnerDbPreparationStatus } from "@/lib/partners/types";

export const PARTNER_DB_PREPARATION_STATUS: PartnerDbPreparationStatus = {
  codeStructureReady: true,
  sqlExecuted: false,
  dbAdapterConnected: false,
};

export const PARTNER_SQL_CREATION_SEQUENCE = [
  "partners 테이블 생성",
  "company_id 인덱스 생성",
  "type 인덱스 생성",
  "is_active 인덱스 생성",
  "updated_at 자동 갱신 트리거는 0.6.431에서 필요 여부 검토",
] as const;

export const PARTNER_WORKORDER_INPUT_IMPACT = [
  {
    area: "작업지시서 발주정보 공장 필드",
    current: "orderEntries[].factory 문자열을 사용한다.",
    next: "0.6.433에서 partner_id + partner_name snapshot 구조로 전환 검토가 필요하다.",
  },
  {
    area: "발주요청 확인 모달",
    current: "factoryName 문자열 payload를 사용한다.",
    next: "선택된 Partner 기준의 id/snapshot payload로 확장해야 한다.",
  },
  {
    area: "검수 모달",
    current: "orderEntries[].factory 문자열 목록에서 공장 옵션을 만든다.",
    next: "Partner 선택 전환 후에도 과거 문자열 데이터 fallback을 유지해야 한다.",
  },
  {
    area: "원단/부자재/외주 선택",
    current: "Partner master 이름 목록을 helper로 가져와 문자열 옵션으로 사용한다.",
    next: "0.6.434에서 type/capability 기반 Partner 선택값으로 전환한다.",
  },
] as const;
