import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/signup/signupApplicationCertificateRepository.ts", "utf8");
const adapter = fs.readFileSync("scripts/signup-certificate-r2-integration-adapters.mjs", "utf8");
const runner = fs.readFileSync("scripts/run-signup-certificate-r2-integration.mjs", "utf8");

function assertQualifiedJoinSelect(source, label) {
  const joinSelectMatch = source.match(
    /SELECT\s+\$\{(?:QUALIFIED_SIGNUP_APPLICATION_FILE_COLUMNS|QUALIFIED_FILE_COLUMNS)\}[\s\S]*FROM signup_application_files file[\s\S]*JOIN signup_applications app ON app\.id = file\.application_id/,
  );
  assert.ok(joinSelectMatch, `${label} must use qualified file columns in signup_application_files/app join`);

  const qualifiedColumnsMatch = source.match(
    /file\.id AS id[\s\S]*file\.application_id AS application_id[\s\S]*file\.file_type AS file_type[\s\S]*file\.storage_key AS storage_key[\s\S]*file\.deleted_at AS deleted_at/,
  );
  assert.ok(qualifiedColumnsMatch, `${label} must alias joined certificate columns back to mapper row keys`);

  assert.doesNotMatch(
    joinSelectMatch[0],
    /SELECT\s+\$\{(?:SIGNUP_APPLICATION_FILE_COLUMNS|FILE_COLUMNS)\}/,
    `${label} must not expand unqualified certificate columns inside a join`,
  );
}

assertQualifiedJoinSelect(repository, "repository");
assertQualifiedJoinSelect(adapter, "integration adapter");

assert.match(
  runner,
  /stage: "active-certificate-before-revoke", operation: "lookup"[\s\S]*repository\.findActiveOwnedCertificate/,
  "runner must record active certificate lookup before revoke so PostgreSQL 42702 is diagnosable",
);
assert.match(runner, /stage: "revoke", operation: "delete"/, "runner must keep revoke delete stage after lookup");

console.log("signup certificate ambiguous column regression contract: OK");
