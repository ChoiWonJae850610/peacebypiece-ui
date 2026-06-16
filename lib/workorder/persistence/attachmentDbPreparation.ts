import { ATTACHMENT_DB_TABLE_SEQUENCE } from "@/lib/workorder/persistence/attachmentTypes";

export const ATTACHMENT_DB_PREPARATION_STATUS = {
  tableSequence: ATTACHMENT_DB_TABLE_SEQUENCE,
  codeStructureReady: true,
  sqlExecuted: true,
  dbAdapterConnected: true,
  r2StorageConnected: true,
} as const;

export const ATTACHMENT_DB_IMPACT_SCOPE = [
  "작업지시서 공식 첨부",
  "작업지시서 디자인 첨부",
  "첨부 파일 soft-delete 표시 정책",
  "R2 저장 key / URL / metadata 저장 기준",
] as const;
