import { ATTACHMENT_MEMO_DB_TABLE_SEQUENCE } from "@/lib/workorder/persistence/attachmentMemoTypes";

export const ATTACHMENT_MEMO_DB_NEXT_VERSION_SEQUENCE = [
  { version: "0.6.436", goal: "Attachment / Memo DB 연결 준비" },
  { version: "0.6.437", goal: "Attachment / Memo SQL 생성" },
  { version: "0.6.438", goal: "Attachment / Memo DB adapter 연결" },
  { version: "0.6.439", goal: "R2 storage key / URL 저장 연결" },
] as const;

export const ATTACHMENT_MEMO_DB_PREPARATION_STATUS = {
  tableSequence: ATTACHMENT_MEMO_DB_TABLE_SEQUENCE,
  codeStructureReady: true,
  sqlExecuted: false,
  dbAdapterConnected: false,
  r2StorageConnected: false,
} as const;

export const ATTACHMENT_MEMO_DB_IMPACT_SCOPE = [
  "작업지시서 공식 첨부",
  "작업지시서 디자인 첨부",
  "작업지시서 메모 스레드",
  "작업지시서 메모 답글",
  "첨부 파일 soft-delete 표시 정책",
  "R2 저장 key / URL / metadata 저장 기준",
] as const;

export const ATTACHMENT_MEMO_DB_SQL_PLANNING_NOTES = [
  "파일 원본은 DB에 저장하지 않고 R2에 저장한다.",
  "DB에는 storage_key, url, content_type, file_size 같은 metadata만 저장한다.",
  "삭제는 물리 삭제 대신 deleted_at과 is_visible로 처리한다.",
  "표시 여부 판단은 presentation 계층에서 처리한다.",
  "첨부와 메모는 WorkOrder draft 저장 정책을 유지한 뒤 버튼 action에서 저장한다.",
] as const;
