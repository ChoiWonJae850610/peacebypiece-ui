#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const subscriptionRepository = read("lib/billing/companySubscriptionRepository.ts");
const usageRepository = read("lib/billing/storageUsageRepository.ts");

for (const source of [subscriptionRepository, usageRepository]) {
  for (const token of [
    "FROM attachments",
    "deleted_at IS NULL",
    "COALESCE(is_active, true) = true",
    "FROM attachment_trash_items",
    "restored_at IS NULL",
    "purged_at IS NULL",
    "FROM company_files",
    "FROM company_onboarding_files",
    "FROM signup_application_files file",
    "JOIN signup_applications app ON app.id = file.application_id",
    "app.created_company_id",
    "app.status = 'approved'",
    "file.file_type = 'business_registration'",
    "file.approved_company_file_id IS NULL",
  ]) {
    assert.ok(source.includes(token), `storage usage source must include ${token}`);
  }
}

assert.ok(
  usageRepository.includes("approved signup certificates not already linked to company_files"),
  "usage note must document approved signup certificate inclusion and no-double-count rule",
);

assert.ok(!subscriptionRepository.includes("storage_usage_snapshots"), "live quota should not rely on stale storage snapshots");
assert.ok(!usageRepository.includes("FROM storage_usage_snapshots"), "system usage read path should not rely on stale storage snapshots");

console.log("storage usage inclusion contract passed");
