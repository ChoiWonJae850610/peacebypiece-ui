#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const audit = fs.readFileSync("docs/audits/0.24.31-canonical-policy-conformance-audit.md", "utf8");

for (const token of [
  "docs/codex-current-state.md",
  "docs/project/26-final-policy-decisions-and-master-todo.md",
  "docs/project/31-pre-codex-integrated-master-plan.md",
  "docs/project/20-customer-signup-consent-approval-trial-spec.md",
  "docs/project/21-public-website-commercial-onboarding-spec.md",
  "docs/project/30-pre-codex-policy-reconciliation.md",
  "MATCH",
  "PARTIAL",
  "MISSING",
  "MISMATCH",
  "DEFERRED",
  "LEGAL_REVIEW",
  "Candidate A",
  "Candidate B",
  "Candidate C",
  "Candidate D",
  "Candidate E",
  "Candidate F",
  "Company-wide Export missing: confirmed PARTIAL",
  "termination/recovery/deletion missing: confirmed PARTIAL",
  "storage 100% block only upload/PDF: confirmed PARTIAL",
]) {
  assert.ok(audit.includes(token), `audit missing ${token}`);
}

assert.doesNotMatch(audit, /ask the user again/i);
assert.match(audit, /No confirmed product policy was re-asked/);

console.log("canonical policy conformance audit contract passed");
