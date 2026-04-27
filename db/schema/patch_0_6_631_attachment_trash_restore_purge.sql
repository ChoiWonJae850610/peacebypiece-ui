-- =========================================
-- PeaceByPiece 0.6.631
-- attachment_trash_items 복구/영구삭제 요청 구조 보완
-- 기존 DB에 이미 0.6.625~0.6.630 SQL을 일부 적용한 경우 이 패치만 실행합니다.
-- =========================================

ALTER TABLE attachments
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE attachments
ADD COLUMN IF NOT EXISTS deleted_by text;

ALTER TABLE attachments
ADD COLUMN IF NOT EXISTS delete_reason text;

ALTER TABLE attachments
ADD COLUMN IF NOT EXISTS purge_after_at timestamptz;

CREATE TABLE IF NOT EXISTS attachment_trash_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text,
  company_name text,
  attachment_id text NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  thumbnail_key text,
  original_name text NOT NULL,
  mime_type text,
  size_bytes integer NOT NULL DEFAULT 0,
  deleted_by text,
  delete_reason text,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  purge_after_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  restored_at timestamptz,
  restored_by text,
  purged_at timestamptz,
  purge_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attachment_trash_items
ADD COLUMN IF NOT EXISTS restored_at timestamptz;

ALTER TABLE attachment_trash_items
ADD COLUMN IF NOT EXISTS restored_by text;

ALTER TABLE attachment_trash_items
ADD COLUMN IF NOT EXISTS purged_at timestamptz;

ALTER TABLE attachment_trash_items
ADD COLUMN IF NOT EXISTS purge_status text NOT NULL DEFAULT 'pending';

DROP INDEX IF EXISTS attachment_trash_items_attachment_unique_idx;

CREATE UNIQUE INDEX IF NOT EXISTS attachment_trash_items_pending_attachment_unique_idx
ON attachment_trash_items (attachment_id)
WHERE purge_status = 'pending' AND restored_at IS NULL AND purged_at IS NULL;

CREATE INDEX IF NOT EXISTS attachment_trash_items_attachment_idx
ON attachment_trash_items (attachment_id);

CREATE INDEX IF NOT EXISTS attachment_trash_items_order_idx
ON attachment_trash_items (order_id);

CREATE INDEX IF NOT EXISTS attachment_trash_items_purge_idx
ON attachment_trash_items (purge_status, purge_after_at);

CREATE INDEX IF NOT EXISTS attachment_trash_items_company_deleted_idx
ON attachment_trash_items (company_id, deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachments_deleted_at
ON attachments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_attachments_purge_after
ON attachments(purge_after_at);
