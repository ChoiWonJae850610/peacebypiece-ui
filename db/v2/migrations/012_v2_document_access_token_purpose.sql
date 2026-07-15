-- WAFL v2 alpha.42 additive migration.
-- EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.42 DEV/TEST GATE.
-- Production execution, backfill, destructive SQL, and manual SQL Editor execution are forbidden.

BEGIN;

DO $alpha42_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.42-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 012 requires the approved alpha.42 dev/test runner';
  END IF;
END
$alpha42_gate$;

ALTER TABLE public.document_access_tokens
  ADD COLUMN token_purpose text NOT NULL DEFAULT 'manual_share';

ALTER TABLE public.document_access_tokens
  ADD CONSTRAINT document_access_tokens_token_purpose_check
  CHECK (token_purpose IN ('manual_share', 'embedded_qr'));

CREATE UNIQUE INDEX document_access_tokens_one_embedded_qr_per_document_idx
  ON public.document_access_tokens (company_id, generated_document_id)
  WHERE token_purpose = 'embedded_qr';

COMMENT ON COLUMN public.document_access_tokens.token_purpose
  IS 'Distinguishes short-lived manual shares from the single immutable QR embedded in a generated PDF.';

COMMIT;
