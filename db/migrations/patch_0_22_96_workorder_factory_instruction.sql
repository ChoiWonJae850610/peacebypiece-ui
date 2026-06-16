BEGIN;

CREATE TABLE IF NOT EXISTS workorder_factory_instructions (
  work_order_id text PRIMARY KEY REFERENCES spec_sheets(id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  include_in_factory_pdf boolean NOT NULL DEFAULT true,
  updated_by_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workorder_factory_instructions_content_length_check CHECK (char_length(content) <= 5000)
);

CREATE INDEX IF NOT EXISTS workorder_factory_instructions_company_idx
  ON workorder_factory_instructions (company_id, updated_at DESC);

COMMIT;
