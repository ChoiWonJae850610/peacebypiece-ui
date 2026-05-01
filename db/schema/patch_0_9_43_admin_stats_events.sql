-- =========================================
-- PeaceByPiece 0.9.43
-- 관리자 통계 이벤트 보존 구조
-- 삭제된 작업지시서의 제작 차수, 공장별 불량/입고지연 같은 통계를
-- 현재 활성 테이블만으로 계산하지 않도록 누적 이벤트 테이블을 추가합니다.
-- =========================================

CREATE TABLE IF NOT EXISTS admin_stats_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  spec_sheet_id text,
  order_id text,
  factory_partner_id text,
  factory_name text,
  event_type text NOT NULL,
  production_round integer,
  production_round_label text,
  production_category text,
  quantity integer,
  expected_quantity integer,
  received_quantity integer,
  due_date date,
  inspected_at timestamptz,
  is_defect boolean NOT NULL DEFAULT false,
  is_inbound_delayed boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admin_stats_events_event_type_check
    CHECK (event_type IN (
      'WORKORDER_CREATED',
      'STATUS_CHANGED',
      'INSPECTION_COMPLETED',
      'DEFECT_REPORTED',
      'INBOUND_DELAYED'
    ))
);

CREATE INDEX IF NOT EXISTS admin_stats_events_company_created_idx
  ON admin_stats_events (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_stats_events_company_event_idx
  ON admin_stats_events (company_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_stats_events_company_factory_idx
  ON admin_stats_events (company_id, factory_partner_id, factory_name, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_stats_events_company_round_idx
  ON admin_stats_events (company_id, production_round, created_at DESC);
