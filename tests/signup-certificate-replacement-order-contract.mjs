import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/signup/signupApplicationCertificateRepository.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationCertificateService.ts", "utf8");

const lockIndex = repository.indexOf("FOR UPDATE");
const updateIndex = repository.indexOf("UPDATE signup_application_files");
const insertIndex = repository.indexOf("INSERT INTO signup_application_files");

assert.ok(lockIndex >= 0, "application row must be locked before certificate replacement");
assert.ok(updateIndex > lockIndex, "old active certificate must be inactivated after ownership/status lock");
assert.ok(insertIndex > updateIndex, "new active certificate must be inserted after old active row is inactive");
assert.match(repository, /status IN \('draft', 'changes_requested'\)/, "only editable application states may replace certificate");
assert.match(repository, /google_sub = \$2/);
assert.match(repository, /email_normalized = \$3/);
assert.match(repository, /RETURNING \$\{SIGNUP_APPLICATION_FILE_COLUMNS\}/, "replaced rows must be returned for cleanup");
assert.match(service, /cleanupInactiveCertificateObjects/, "post-commit old object cleanup must be explicit");
assert.match(service, /seenKeys/, "old object cleanup must de-duplicate exact keys");

console.log("signup certificate replacement order contract: OK");
