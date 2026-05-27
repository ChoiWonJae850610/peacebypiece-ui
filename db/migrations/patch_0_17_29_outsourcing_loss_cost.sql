-- 0.17.29 추가 공정 로스비 저장 컬럼
-- 기존 개발 DB에서 full_reset 없이 적용할 때 사용합니다.

ALTER TABLE spec_sheet_outsourcing_lines
  ADD COLUMN IF NOT EXISTS loss_cost numeric NOT NULL DEFAULT 0;
