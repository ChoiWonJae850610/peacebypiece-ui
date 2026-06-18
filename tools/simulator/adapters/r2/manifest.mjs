export const SIMULATOR_R2_MANIFEST = {
  schemaVersion: "1.0",
  allowedPrefixes: ["wafl-functions/", "wafl-fn/"],
  fixtureDirectory: ".tmp/simulator/r2/files",
  manifestDirectory: ".tmp/simulator/r2/manifests",
  metadataTable: "attachments",
  requiredMetadataFields: ["company_id", "order_id", "storage_key", "original_name", "size_bytes"],
  mutationPolicy: {
    uploadEnabled: false,
    deleteEnabled: false,
    testPrefixOnly: true,
    productionBucketAllowed: false,
    orphanReconciliationRequired: true
  }
};
