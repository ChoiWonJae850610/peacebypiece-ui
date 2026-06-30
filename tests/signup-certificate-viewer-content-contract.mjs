import assert from "node:assert/strict";
import fs from "node:fs";

const viewer = fs.readFileSync("app/api/system/signup/applications/[applicationId]/certificate/[fileId]/view/route.ts", "utf8");
const policy = fs.readFileSync("lib/signup/signupApplicationFilePolicy.ts", "utf8");

for (const token of [
  "requireSystemAdminScope",
  "isSignupApplicationCertificateMimeTypeAllowed",
  "isSignupApplicationCertificateStorageKeyConsistentWithMime",
  "isObjectContentTypeConsistent",
  "SIGNUP_CERTIFICATE_CONTENT_MISMATCH",
  "\"Content-Disposition\"",
  "inline;",
  "\"X-Content-Type-Options\"",
  "nosniff",
  "no-store",
]) {
  assert.ok(`${viewer}\n${policy}`.includes(token), `viewer content boundary missing ${token}`);
}

assert.match(viewer, /searchParams\.get\("download"\)\s*===\s*"1"/);
assert.match(viewer, /getR2Object/);
assert.doesNotMatch(viewer, /NextResponse\.redirect|createR2WorkerFileUrl|signedUrl|downloadUrl|attachment/i);
assert.match(policy, /isSignupApplicationCertificateStorageKeyConsistentWithMime/);

console.log("signup certificate viewer content contract: OK");
