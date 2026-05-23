-- PeaceByPiece 0.15.93
-- 발주서 PDF 자동 첨부 준비: 시스템 생성 첨부파일 구분 컬럼

ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'user';

ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS generated_document_type text;

CREATE INDEX IF NOT EXISTS attachments_generated_document_idx
  ON attachments (company_id, order_id, generated_document_type, created_at DESC)
  WHERE source_type = 'system'
    AND generated_document_type IS NOT NULL
    AND deleted_at IS NULL
    AND COALESCE(is_active, true) = true;
