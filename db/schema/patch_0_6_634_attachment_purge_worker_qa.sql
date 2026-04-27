-- 0.6.634 attachment purge worker QA patch
-- 영구삭제 요청 단계에서는 purged_at을 세팅하지 않는다.
-- 0.6.631 이전/부분 적용으로 purge_requested + purged_at이 같이 들어간 행을 worker 처리 가능 상태로 복구한다.

UPDATE attachment_trash_items
   SET purged_at = NULL,
       updated_at = now()
 WHERE purge_status = 'purge_requested'
   AND restored_at IS NULL
   AND purged_at IS NOT NULL;

DROP INDEX IF EXISTS attachment_trash_items_pending_attachment_unique_idx;

CREATE UNIQUE INDEX IF NOT EXISTS attachment_trash_items_pending_attachment_unique_idx
  ON attachment_trash_items (attachment_id)
  WHERE purge_status IN ('pending', 'purge_requested')
    AND restored_at IS NULL
    AND purged_at IS NULL;

CREATE INDEX IF NOT EXISTS attachment_trash_items_purge_requested_idx
  ON attachment_trash_items (purge_status, purge_after_at ASC)
  WHERE restored_at IS NULL
    AND purged_at IS NULL
    AND purge_status IN ('pending', 'purge_requested');
