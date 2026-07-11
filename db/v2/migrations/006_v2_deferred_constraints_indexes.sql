-- WAFL v2 alpha.21 additive migration draft.
-- EXECUTION IS PROHIBITED IN ALPHA.21. Do not run this file against any database.
-- Requires the separately approved dev/test gate and migrations 001-005. Production execution is forbidden.
-- Foreign keys marked NOT VALID are validated only in alpha.22 after read-only reconciliation passes.

BEGIN;

SELECT wafl_v2_assert_migration_draft_gate();

CREATE UNIQUE INDEX IF NOT EXISTS partners_company_id_id_unique_idx
  ON partners (company_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS materials_company_id_id_unique_idx
  ON materials (company_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS company_members_company_id_id_unique_idx
  ON company_members (company_id, id);

ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_current_revision_company_fk
  FOREIGN KEY (company_id, current_revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_creator_company_fk
  FOREIGN KEY (company_id, created_by_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (created_by_member_id)
  NOT VALID;

ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_assignee_company_fk
  FOREIGN KEY (company_id, assignee_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (assignee_member_id)
  NOT VALID;

ALTER TABLE work_order_revisions
  ADD CONSTRAINT work_order_revisions_work_order_company_fk
  FOREIGN KEY (company_id, work_order_id)
  REFERENCES work_orders (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_revisions
  ADD CONSTRAINT work_order_revisions_source_company_fk
  FOREIGN KEY (company_id, source_revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_revisions
  ADD CONSTRAINT work_order_revisions_author_company_fk
  FOREIGN KEY (company_id, author_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (author_member_id)
  NOT VALID;

ALTER TABLE work_order_revisions
  ADD CONSTRAINT work_order_revisions_finalizer_company_fk
  FOREIGN KEY (company_id, finalized_by_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (finalized_by_member_id)
  NOT VALID;

ALTER TABLE work_order_command_receipts
  ADD CONSTRAINT work_order_command_receipts_work_order_company_fk
  FOREIGN KEY (company_id, work_order_id)
  REFERENCES work_orders (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_command_receipts
  ADD CONSTRAINT work_order_command_receipts_revision_company_fk
  FOREIGN KEY (company_id, result_revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_material_lines
  ADD CONSTRAINT work_order_material_lines_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_material_lines
  ADD CONSTRAINT work_order_material_lines_material_company_fk
  FOREIGN KEY (company_id, material_id)
  REFERENCES materials (company_id, id)
  ON DELETE SET NULL (material_id)
  NOT VALID;

ALTER TABLE work_order_material_lines
  ADD CONSTRAINT work_order_material_lines_supplier_company_fk
  FOREIGN KEY (company_id, supplier_partner_id)
  REFERENCES partners (company_id, id)
  ON DELETE SET NULL (supplier_partner_id)
  NOT VALID;

ALTER TABLE work_order_colors
  ADD CONSTRAINT work_order_colors_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_sizes
  ADD CONSTRAINT work_order_sizes_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE color_size_quantities
  ADD CONSTRAINT color_size_quantities_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE color_size_quantities
  ADD CONSTRAINT color_size_quantities_color_company_fk
  FOREIGN KEY (company_id, color_id)
  REFERENCES work_order_colors (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE color_size_quantities
  ADD CONSTRAINT color_size_quantities_size_company_fk
  FOREIGN KEY (company_id, size_id)
  REFERENCES work_order_sizes (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_specs
  ADD CONSTRAINT work_order_size_specs_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_sizes
  ADD CONSTRAINT work_order_size_spec_sizes_spec_company_fk
  FOREIGN KEY (company_id, size_spec_id)
  REFERENCES work_order_size_specs (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_sizes
  ADD CONSTRAINT work_order_size_spec_sizes_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_poms
  ADD CONSTRAINT work_order_size_spec_poms_spec_company_fk
  FOREIGN KEY (company_id, size_spec_id)
  REFERENCES work_order_size_specs (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_poms
  ADD CONSTRAINT work_order_size_spec_poms_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_values
  ADD CONSTRAINT work_order_size_spec_values_spec_company_fk
  FOREIGN KEY (company_id, size_spec_id)
  REFERENCES work_order_size_specs (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_values
  ADD CONSTRAINT work_order_size_spec_values_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_values
  ADD CONSTRAINT work_order_size_spec_values_size_company_fk
  FOREIGN KEY (company_id, size_row_id)
  REFERENCES work_order_size_spec_sizes (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_size_spec_values
  ADD CONSTRAINT work_order_size_spec_values_pom_company_fk
  FOREIGN KEY (company_id, pom_column_id)
  REFERENCES work_order_size_spec_poms (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_processes
  ADD CONSTRAINT work_order_processes_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_processes
  ADD CONSTRAINT work_order_processes_partner_company_fk
  FOREIGN KEY (company_id, partner_id)
  REFERENCES partners (company_id, id)
  ON DELETE SET NULL (partner_id)
  NOT VALID;

ALTER TABLE work_order_processes
  ADD CONSTRAINT work_order_processes_completed_by_company_fk
  FOREIGN KEY (company_id, completed_by_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (completed_by_member_id)
  NOT VALID;

ALTER TABLE work_order_images
  ADD CONSTRAINT work_order_images_work_order_company_fk
  FOREIGN KEY (company_id, work_order_id)
  REFERENCES work_orders (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_images
  ADD CONSTRAINT work_order_images_creator_company_fk
  FOREIGN KEY (company_id, created_by_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (created_by_member_id)
  NOT VALID;

ALTER TABLE work_order_attachments
  ADD CONSTRAINT work_order_attachments_work_order_company_fk
  FOREIGN KEY (company_id, work_order_id)
  REFERENCES work_orders (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_attachments
  ADD CONSTRAINT work_order_attachments_creator_company_fk
  FOREIGN KEY (company_id, created_by_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (created_by_member_id)
  NOT VALID;

ALTER TABLE work_order_revision_images
  ADD CONSTRAINT work_order_revision_images_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_revision_images
  ADD CONSTRAINT work_order_revision_images_image_company_fk
  FOREIGN KEY (company_id, image_id)
  REFERENCES work_order_images (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_revision_attachments
  ADD CONSTRAINT work_order_revision_attachments_revision_company_fk
  FOREIGN KEY (company_id, revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_order_revision_attachments
  ADD CONSTRAINT work_order_revision_attachments_attachment_company_fk
  FOREIGN KEY (company_id, attachment_id)
  REFERENCES work_order_attachments (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_representative_image_company_fk
  FOREIGN KEY (company_id, representative_image_id)
  REFERENCES work_order_images (company_id, id)
  ON DELETE SET NULL (representative_image_id)
  NOT VALID;

ALTER TABLE work_order_material_lines
  ADD CONSTRAINT work_order_material_lines_image_company_fk
  FOREIGN KEY (company_id, image_id)
  REFERENCES work_order_images (company_id, id)
  ON DELETE SET NULL (image_id)
  NOT VALID;

ALTER TABLE generated_documents
  ADD CONSTRAINT generated_documents_work_order_company_fk
  FOREIGN KEY (company_id, work_order_id)
  REFERENCES work_orders (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE generated_documents
  ADD CONSTRAINT generated_documents_revision_company_fk
  FOREIGN KEY (company_id, work_order_revision_id)
  REFERENCES work_order_revisions (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE document_access_tokens
  ADD CONSTRAINT document_access_tokens_document_company_fk
  FOREIGN KEY (company_id, generated_document_id)
  REFERENCES generated_documents (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE document_access_tokens
  ADD CONSTRAINT document_access_tokens_rotation_company_fk
  FOREIGN KEY (company_id, rotated_from_token_id)
  REFERENCES document_access_tokens (company_id, id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE domain_events
  ADD CONSTRAINT domain_events_actor_company_fk
  FOREIGN KEY (company_id, actor_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (actor_member_id)
  NOT VALID;

CREATE INDEX IF NOT EXISTS work_orders_company_recent_idx
  ON work_orders (company_id, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS work_orders_company_status_recent_idx
  ON work_orders (company_id, status, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS work_orders_company_due_idx
  ON work_orders (company_id, due_date, id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS work_orders_company_product_name_idx
  ON work_orders (company_id, product_name, id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS work_orders_company_trash_idx
  ON work_orders (company_id, deleted_at DESC, id)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS work_orders_purge_candidates_idx
  ON work_orders (purge_after_at, id)
  WHERE deleted_at IS NOT NULL AND purge_after_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS work_order_revisions_work_order_recent_idx
  ON work_order_revisions (work_order_id, revision_no DESC, id);

CREATE INDEX IF NOT EXISTS work_order_command_receipts_expiry_idx
  ON work_order_command_receipts (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS work_order_material_lines_revision_type_order_idx
  ON work_order_material_lines (revision_id, material_type, display_order, id);

CREATE INDEX IF NOT EXISTS work_order_material_lines_company_status_idx
  ON work_order_material_lines (company_id, status, updated_at, id);

CREATE INDEX IF NOT EXISTS work_order_colors_revision_order_idx
  ON work_order_colors (revision_id, display_order, id);

CREATE INDEX IF NOT EXISTS work_order_sizes_revision_order_idx
  ON work_order_sizes (revision_id, display_order, id);

CREATE INDEX IF NOT EXISTS color_size_quantities_size_lookup_idx
  ON color_size_quantities (revision_id, size_id, color_id);

CREATE INDEX IF NOT EXISTS work_order_size_spec_sizes_order_idx
  ON work_order_size_spec_sizes (size_spec_id, display_order, id);

CREATE INDEX IF NOT EXISTS work_order_size_spec_poms_order_idx
  ON work_order_size_spec_poms (size_spec_id, display_order, id);

CREATE INDEX IF NOT EXISTS work_order_processes_revision_order_idx
  ON work_order_processes (revision_id, display_order, id);

CREATE INDEX IF NOT EXISTS work_order_images_work_order_order_idx
  ON work_order_images (work_order_id, display_order, id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS work_order_images_single_representative_idx
  ON work_order_images (work_order_id)
  WHERE is_current_representative = true AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS work_order_revision_images_single_representative_idx
  ON work_order_revision_images (revision_id)
  WHERE is_representative = true;

CREATE INDEX IF NOT EXISTS work_order_attachments_work_order_recent_idx
  ON work_order_attachments (work_order_id, created_at DESC, id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS generated_documents_revision_type_recent_idx
  ON generated_documents (work_order_revision_id, document_type, created_at DESC, id);

CREATE INDEX IF NOT EXISTS generated_documents_company_status_idx
  ON generated_documents (company_id, status, created_at DESC, id);

CREATE INDEX IF NOT EXISTS document_access_tokens_active_expiry_idx
  ON document_access_tokens (expires_at, id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS domain_events_entity_history_idx
  ON domain_events (company_id, entity_type, entity_id, occurred_at DESC, id);

GRANT USAGE ON SCHEMA public TO wafl_v2_tenant_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  document_number_sequences,
  work_orders,
  work_order_revisions,
  work_order_command_receipts,
  work_order_material_lines,
  work_order_colors,
  work_order_sizes,
  color_size_quantities,
  work_order_size_specs,
  work_order_size_spec_sizes,
  work_order_size_spec_poms,
  work_order_size_spec_values,
  work_order_processes,
  work_order_images,
  work_order_attachments,
  work_order_revision_images,
  work_order_revision_attachments,
  generated_documents,
  document_access_tokens,
  domain_events
TO wafl_v2_tenant_runtime;

GRANT EXECUTE ON FUNCTION
  wafl_v2_request_company_id(),
  wafl_v2_privileged_context_ready(text),
  wafl_v2_privileged_scope_ready(text),
  allocate_work_order_document_sequence(text, date)
TO wafl_v2_tenant_runtime;

-- Alpha.22 validation order after approved dev/test apply and read-only reconciliation:
-- 1. Validate parent company/work-order/revision constraints.
-- 2. Validate revision child and asset linkage constraints.
-- 3. Validate generated document/token constraints.
-- 4. Run tenant isolation, cursor, concurrency, and immutable revision tests.
-- No constraint validation, backfill, cleanup, seed, or benchmark is executed in alpha.21.

COMMIT;
