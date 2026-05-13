-- PeaceByPiece 0.11.71
-- 작업지시서 목록 필터/정렬 조회 최적화용 선택 적용 SQL입니다.
-- 운영 DB에 바로 적용하기 전 EXPLAIN ANALYZE로 실제 실행계획을 확인하세요.

CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_active_status_updated
ON spec_sheets (company_id, is_active, status, updated_at DESC, created_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_active_status_due_date
ON spec_sheets (company_id, is_active, status, due_date ASC, updated_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_active_title
ON spec_sheets (company_id, is_active, lower(title), id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_spec_sheets_company_active_vendor
ON spec_sheets (company_id, is_active, lower(coalesce(vendor, '')), lower(title), id DESC)
WHERE deleted_at IS NULL;
