-- 0.6.632
-- 관리자 파일/용량 관리 화면의 실제 DB 조회와 purge 후보 조회를 위한 보완 인덱스입니다.
-- 이미 존재하면 건너뜁니다.

CREATE INDEX IF NOT EXISTS attachments_admin_active_list_idx
  ON attachments (created_at DESC)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS attachment_trash_items_purge_candidate_idx
  ON attachment_trash_items (purge_after_at ASC)
  WHERE restored_at IS NULL AND purged_at IS NULL AND purge_status IN ('pending', 'purge_requested');

CREATE INDEX IF NOT EXISTS attachment_trash_items_pending_list_idx
  ON attachment_trash_items (deleted_at DESC)
  WHERE restored_at IS NULL AND purged_at IS NULL AND purge_status = 'pending';
