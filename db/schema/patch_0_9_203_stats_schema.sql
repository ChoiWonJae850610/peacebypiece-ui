-- =========================================
-- PeaceByPiece stats schema/index patch
-- Version: 0.9.203
--
-- 목적:
-- - 통계 API 1차 구현을 위한 summary table과 aggregate 조회용 index를 추가한다.
-- - 기존 데이터 마이그레이션은 수행하지 않는다.
-- - 현재 개발 DB는 전체 리셋 가능 상태이므로 full_reset.sql 반영을 우선 기준으로 둔다.
-- =========================================

BEGIN;

CREATE TABLE IF NOT EXISTS company_workorder_daily_stats (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stats_date date NOT NULL,
  created_workorder_count integer NOT NULL DEFAULT 0,
  active_workorder_count integer NOT NULL DEFAULT 0,
  completed_workorder_count integer NOT NULL DEFAULT 0,
  trashed_workorder_count integer NOT NULL DEFAULT 0,
  reorder_workorder_count integer NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  order_quantity_total numeric(14, 2) NOT NULL DEFAULT 0,
  labor_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  loss_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  memo_count integer NOT NULL DEFAULT 0,
  attachment_count integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_workorder_daily_stats_unique UNIQUE (company_id, stats_date),
  CONSTRAINT company_workorder_daily_stats_non_negative CHECK (
    created_workorder_count >= 0
    AND active_workorder_count >= 0
    AND completed_workorder_count >= 0
    AND trashed_workorder_count >= 0
    AND reorder_workorder_count >= 0
    AND order_count >= 0
    AND order_quantity_total >= 0
    AND labor_cost_total >= 0
    AND loss_cost_total >= 0
    AND memo_count >= 0
    AND attachment_count >= 0
  )
);

CREATE TABLE IF NOT EXISTS company_workorder_monthly_stats (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stats_month date NOT NULL,
  created_workorder_count integer NOT NULL DEFAULT 0,
  active_workorder_count integer NOT NULL DEFAULT 0,
  completed_workorder_count integer NOT NULL DEFAULT 0,
  trashed_workorder_count integer NOT NULL DEFAULT 0,
  reorder_workorder_count integer NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  order_quantity_total numeric(14, 2) NOT NULL DEFAULT 0,
  labor_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  loss_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  memo_count integer NOT NULL DEFAULT 0,
  attachment_count integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_workorder_monthly_stats_unique UNIQUE (company_id, stats_month),
  CONSTRAINT company_workorder_monthly_stats_month_start CHECK (stats_month = date_trunc('month', stats_month)::date),
  CONSTRAINT company_workorder_monthly_stats_non_negative CHECK (
    created_workorder_count >= 0
    AND active_workorder_count >= 0
    AND completed_workorder_count >= 0
    AND trashed_workorder_count >= 0
    AND reorder_workorder_count >= 0
    AND order_count >= 0
    AND order_quantity_total >= 0
    AND labor_cost_total >= 0
    AND loss_cost_total >= 0
    AND memo_count >= 0
    AND attachment_count >= 0
  )
);

CREATE TABLE IF NOT EXISTS company_storage_daily_stats (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stats_date date NOT NULL,
  active_attachment_count integer NOT NULL DEFAULT 0,
  active_attachment_bytes bigint NOT NULL DEFAULT 0,
  trash_attachment_count integer NOT NULL DEFAULT 0,
  trash_attachment_bytes bigint NOT NULL DEFAULT 0,
  purge_requested_count integer NOT NULL DEFAULT 0,
  purge_failed_count integer NOT NULL DEFAULT 0,
  purged_count integer NOT NULL DEFAULT 0,
  purged_bytes bigint NOT NULL DEFAULT 0,
  thumbnail_count integer NOT NULL DEFAULT 0,
  logical_attachment_count integer NOT NULL DEFAULT 0,
  physical_attachment_bytes bigint NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_storage_daily_stats_unique UNIQUE (company_id, stats_date),
  CONSTRAINT company_storage_daily_stats_non_negative CHECK (
    active_attachment_count >= 0
    AND active_attachment_bytes >= 0
    AND trash_attachment_count >= 0
    AND trash_attachment_bytes >= 0
    AND purge_requested_count >= 0
    AND purge_failed_count >= 0
    AND purged_count >= 0
    AND purged_bytes >= 0
    AND thumbnail_count >= 0
    AND logical_attachment_count >= 0
    AND physical_attachment_bytes >= 0
  )
);

CREATE INDEX IF NOT EXISTS spec_sheets_company_created_idx ON spec_sheets (company_id, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX IF NOT EXISTS spec_sheets_company_status_created_idx ON spec_sheets (company_id, status, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX IF NOT EXISTS spec_sheets_company_reorder_created_idx ON spec_sheets (company_id, reorder_group_id, reorder_round, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX IF NOT EXISTS spec_sheets_company_delete_status_idx ON spec_sheets (company_id, delete_status, deleted_at DESC);

CREATE INDEX IF NOT EXISTS orders_company_factory_created_idx ON orders (company_id, factory_partner_id, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX IF NOT EXISTS orders_company_created_idx ON orders (company_id, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX IF NOT EXISTS attachments_company_deleted_type_idx ON attachments (company_id, deleted_at, type);
CREATE INDEX IF NOT EXISTS attachments_company_size_idx ON attachments (company_id, size_bytes) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX IF NOT EXISTS company_workorder_daily_stats_company_date_idx ON company_workorder_daily_stats (company_id, stats_date DESC);
CREATE INDEX IF NOT EXISTS company_workorder_monthly_stats_company_month_idx ON company_workorder_monthly_stats (company_id, stats_month DESC);
CREATE INDEX IF NOT EXISTS company_storage_daily_stats_company_date_idx ON company_storage_daily_stats (company_id, stats_date DESC);

COMMENT ON TABLE company_workorder_daily_stats IS '고객사별 일 단위 작업지시서/발주/메모/첨부 통계 summary table. 초기 통계 API의 선택적 캐시/집계 저장소로 사용한다.';
COMMENT ON TABLE company_workorder_monthly_stats IS '고객사별 월 단위 작업지시서 통계 summary table. stats_month는 해당 월 1일로 저장한다.';
COMMENT ON TABLE company_storage_daily_stats IS '고객사별 일 단위 저장소/휴지통/purge 통계 summary table. 실제 R2 list 조회가 아니라 DB metadata 기준 집계를 저장한다.';

COMMIT;
