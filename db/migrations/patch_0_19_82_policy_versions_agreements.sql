-- 0.19.82 정책 버전/동의 이력 DB 1차
-- 운영 DB 적용 전 백업 후 실행한다.

BEGIN;

CREATE TABLE IF NOT EXISTS policy_documents (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  document_key text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  is_customer_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT policy_documents_key_check CHECK (length(trim(document_key)) > 0),
  CONSTRAINT policy_documents_category_check CHECK (category IN ('service', 'privacy', 'billing', 'data', 'operation'))
);

CREATE TABLE IF NOT EXISTS policy_versions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  policy_document_id text NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
  version_label text NOT NULL,
  effective_date date,
  effective_date_label text NOT NULL DEFAULT '',
  is_current boolean NOT NULL DEFAULT false,
  is_required_for_approval boolean NOT NULL DEFAULT false,
  requires_reagreement boolean NOT NULL DEFAULT false,
  content_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT policy_versions_label_check CHECK (length(trim(version_label)) > 0),
  CONSTRAINT policy_versions_document_version_unique UNIQUE (policy_document_id, version_label)
);

CREATE UNIQUE INDEX IF NOT EXISTS policy_versions_one_current_per_document_idx
  ON policy_versions (policy_document_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS policy_versions_current_required_idx
  ON policy_versions (is_current, is_required_for_approval);

CREATE TABLE IF NOT EXISTS policy_agreements (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  policy_version_id text NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_scope text NOT NULL DEFAULT 'user',
  agreement_source text NOT NULL DEFAULT 'workspace_legal',
  ip_address text,
  user_agent text,
  agreed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT policy_agreements_scope_check CHECK (agreement_scope IN ('user', 'company_admin_onboarding')),
  CONSTRAINT policy_agreements_version_user_unique UNIQUE (policy_version_id, user_id)
);

CREATE INDEX IF NOT EXISTS policy_agreements_company_user_idx
  ON policy_agreements (company_id, user_id, agreed_at DESC);

COMMIT;
