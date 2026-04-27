-- =========================================
-- PeaceByPiece patch 0.6.6360
-- 고객사별 관리자 환경설정 저장 구조
-- =========================================

BEGIN;

CREATE TABLE IF NOT EXISTS company_settings (
  company_id text PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  theme_color text NOT NULL DEFAULT 'blue',
  language text NOT NULL DEFAULT 'ko',
  compact_mode boolean NOT NULL DEFAULT false,
  soft_delete_enabled boolean NOT NULL DEFAULT true,
  include_trash_in_usage boolean NOT NULL DEFAULT true,
  trash_retention_days integer NOT NULL DEFAULT 15,
  storage_limit_gb integer NOT NULL DEFAULT 5,
  warning_threshold_percent integer NOT NULL DEFAULT 80,
  review_request_enabled boolean NOT NULL DEFAULT true,
  order_ready_enabled boolean NOT NULL DEFAULT true,
  storage_warning_enabled boolean NOT NULL DEFAULT true,
  purge_result_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT company_settings_theme_color_check
    CHECK (theme_color IN ('blue', 'emerald', 'violet', 'stone')),
  CONSTRAINT company_settings_language_check
    CHECK (language IN ('ko', 'en')),
  CONSTRAINT company_settings_trash_retention_days_check
    CHECK (trash_retention_days IN (1, 5, 15, 30)),
  CONSTRAINT company_settings_storage_limit_gb_check
    CHECK (storage_limit_gb > 0),
  CONSTRAINT company_settings_warning_threshold_percent_check
    CHECK (warning_threshold_percent BETWEEN 1 AND 100)
);

INSERT INTO company_settings (company_id)
SELECT id
FROM companies
WHERE id = 'company-sample-customer'
ON CONFLICT (company_id) DO NOTHING;

COMMIT;
