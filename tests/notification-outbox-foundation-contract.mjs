#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("lib/billing/notificationOutboxPolicy.ts", "utf8");

for (const token of [
  "signup_submitted",
  "signup_changes_requested",
  "signup_correction_deadline_soon",
  "signup_approved",
  "trial_billing_notice_now",
  "trial_billing_notice_3_days",
  "trial_billing_notice_1_day",
  "payment_success",
  "payment_failed",
  "payment_restriction_started",
  "termination_scheduled",
  "deletion_warning_1_day",
  "deletion_completed",
  "company_export_ready",
  "company_export_expiring",
  "dedupeKey",
  "actualEmailDelivery: false",
]) {
  assert.ok(source.includes(token), `notification outbox policy missing ${token}`);
}

assert.doesNotMatch(source, /\b(sendgrid|ses|mailgun|smtp|nodemailer)\b/i, "actual email provider must not be connected");

console.log("notification outbox foundation contract passed");
