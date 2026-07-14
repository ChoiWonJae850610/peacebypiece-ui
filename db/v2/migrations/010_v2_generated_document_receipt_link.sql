-- WAFL v2 alpha.38 additive migration.
-- EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.38 DEV/TEST GATE.
-- Production execution, backfill, destructive SQL, and manual SQL Editor execution are forbidden.

BEGIN;

DO $alpha38_gate$
BEGIN
  IF current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.38-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 010 requires the approved alpha.38 dev/test runner';
  END IF;
END
$alpha38_gate$;

ALTER TABLE public.work_order_command_receipts
  ADD COLUMN IF NOT EXISTS result_generated_document_id uuid;

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.work_order_command_receipts'::regclass
      AND conname = 'work_order_command_receipts_generated_document_company_fk'
  ) THEN
    ALTER TABLE public.work_order_command_receipts
      ADD CONSTRAINT work_order_command_receipts_generated_document_company_fk
      FOREIGN KEY (company_id, result_generated_document_id)
      REFERENCES public.generated_documents (company_id, id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END
$constraint$;

COMMENT ON COLUMN public.work_order_command_receipts.result_generated_document_id
  IS 'Native UUID of the generated document reserved by this idempotent command result.';

COMMIT;
