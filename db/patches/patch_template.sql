-- =========================================
-- PeaceByPiece DB Patch
-- Version: 0.9.xx
-- Title:
--
-- 목적:
-- - 기존 DB를 다음 구조로 업그레이드한다.
--
-- 적용 전 확인:
-- - 운영 DB 직접 적용 금지
-- - 백업 또는 restore point 확인
-- - full_reset.sql 최종 구조와 정합성 확인
--
-- 주의:
-- - secret, token, DB URL 금지
-- - destructive change가 있으면 별도 승인 필요
-- =========================================

BEGIN;

-- =========================================
-- 1) TABLE / COLUMN 변경
-- =========================================

-- 예시:
-- ALTER TABLE example_table
--   ADD COLUMN IF NOT EXISTS example_column text;

-- =========================================
-- 2) INDEX / CONSTRAINT 변경
-- =========================================

-- 예시:
-- CREATE INDEX IF NOT EXISTS idx_example_table_example_column
--   ON example_table (example_column);

-- =========================================
-- 3) VIEW 재생성
-- =========================================

-- 예시:
-- DROP VIEW IF EXISTS example_view;
-- CREATE VIEW example_view AS
-- SELECT 1 AS value;

-- =========================================
-- 4) SEED / BACKFILL
-- =========================================

-- 예시:
-- INSERT INTO permission_catalog (permission_key, label, category)
-- VALUES ('example.permission', '예시 권한', 'example')
-- ON CONFLICT (permission_key) DO NOTHING;

COMMIT;
