-- WAFL 0.24.21.11 SAFE DDL DRAFT
-- DESIGN ONLY. DO NOT EXECUTE AS A MIGRATION.
-- Replace names/types only after reconciliation and deployed-schema verification.

-- A. Opaque workorder URL identifier
-- ALTER TABLE spec_sheets ADD COLUMN url_id uuid;
-- UPDATE spec_sheets SET url_id = gen_random_uuid() WHERE url_id IS NULL;
-- CREATE UNIQUE INDEX CONCURRENTLY spec_sheets_url_id_unique_idx ON spec_sheets (url_id);
-- ALTER TABLE spec_sheets ALTER COLUMN url_id SET NOT NULL;

-- B. One approved company per user (confirmed product policy)
-- Run reconciliation query #2 first. PostgreSQL partial unique index:
-- CREATE UNIQUE INDEX CONCURRENTLY company_members_one_approved_company_per_user_idx
--   ON company_members (user_id)
--   WHERE status = 'approved';

-- C. company_users compatibility uniqueness
-- Do not apply until canonical membership cutover and duplicate-role cleanup.
-- DROP INDEX CONCURRENTLY IF EXISTS company_users_company_user_role_unique;
-- CREATE UNIQUE INDEX CONCURRENTLY company_users_company_user_unique_idx
--   ON company_users (company_id, user_id);

-- D. Current final PDF uniqueness
-- Confirm generated_document_type vocabulary first.
-- CREATE UNIQUE INDEX CONCURRENTLY attachments_one_current_generated_document_idx
--   ON attachments (company_id, order_id, generated_document_type)
--   WHERE source_type = 'system'
--     AND generated_document_type IS NOT NULL
--     AND deleted_at IS NULL
--     AND COALESCE(is_active, true) = true;

-- E. Timestamp/date conversion pattern
-- Add parallel columns, backfill, validate, then cut over in a later migration.
-- ALTER TABLE spec_sheets ADD COLUMN created_at_tz timestamptz;
-- ALTER TABLE spec_sheets ADD COLUMN updated_at_tz timestamptz;
-- ALTER TABLE spec_sheets ADD COLUMN due_date_value date;
-- Backfill requires an explicitly selected legacy timezone and zero invalid date rows.

-- F. Staged foreign key pattern
-- ALTER TABLE <table> ADD CONSTRAINT <name>
--   FOREIGN KEY (<column>) REFERENCES <target>(id) NOT VALID;
-- ALTER TABLE <table> VALIDATE CONSTRAINT <name>;

-- G. RLS staged example; policy expressions require authenticated session design.
-- ALTER TABLE spec_sheets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY spec_sheets_tenant_select ON spec_sheets
--   FOR SELECT USING (company_id = current_setting('app.company_id', true));
-- Application-level tenant guards remain mandatory.

-- H. Future billing evidence tables (shape only)
-- CREATE TABLE payment_attempts (... provider_attempt_id text UNIQUE, company_id text NOT NULL, ...);
-- CREATE TABLE payment_transactions (... provider_transaction_id text UNIQUE, ...);
-- CREATE TABLE subscription_events (... immutable event_type, effective_at, payload_hash, ...);

-- I. Future account deletion execution tables (shape only)
-- CREATE TABLE company_deletion_jobs (... mode, status, scheduled_at, attempt_count, ...);
-- CREATE TABLE company_deletion_manifest_items (... resource_type, resource_id_hash, status, ...);

-- J. Future category/size/POM structures (shape only)
-- CREATE TABLE system_product_categories (... parent_id, depth, code UNIQUE, ...);
-- CREATE TABLE company_category_settings (... company_id, system_category_id, is_enabled, UNIQUE (...));
-- CREATE TABLE company_custom_categories (... company_id, parent_id, name, ...);
-- CREATE TABLE size_system_versions (... code, unit, version, ...);
-- CREATE TABLE pom_definitions (... measurement_type, diagram_key, ...);
-- CREATE TABLE size_measurement_values (... size_system_version_id, pom_id, size_code, value, ...);
