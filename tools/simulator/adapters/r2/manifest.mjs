export const SIMULATOR_R2_MANIFEST = {
  schemaVersion: "1.0",
  allowedPrefixes: ["wafl-functions/", "wafl-fn/", "companies/wafl-fn-company-"],
  fixtureDirectory: ".tmp/simulator/r2/files",
  manifestDirectory: ".tmp/simulator/r2/manifests",
  canonicalAttachmentManifest: "tools/simulator/fixtures/attachments/canonical-lifecycle-manifest.json",
  metadataTable: "attachments",
  requiredMetadataFields: ["company_id", "order_id", "storage_key", "original_name", "size_bytes"],
  requiredCanonicalAttachmentFields: [
    "fixture_id",
    "company_id",
    "workorder_id",
    "attachment_id",
    "attachment_kind",
    "original_filename",
    "mime_type",
    "exact_size_bytes",
    "canonical_r2_key",
    "preview_mode",
    "is_representative_design",
    "lifecycle_status",
    "trashed_at",
    "expected_company_active_bytes",
    "expected_company_trash_bytes",
    "expected_company_total_bytes"
  ],
  mutationPolicy: {
    uploadEnabled: false,
    deleteEnabled: false,
    testPrefixOnly: true,
    productionBucketAllowed: false,
    orphanReconciliationRequired: true
  }
};
