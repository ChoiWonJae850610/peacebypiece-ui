import assert from "node:assert/strict";
import fs from "node:fs";

const policy = fs.readFileSync("lib/signup/signupApplicationFilePolicy.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationCertificateService.ts", "utf8");
const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");

for (const token of [
  "UNSAFE_ORIGINAL_NAME_PATTERN",
  "SIGNUP_CERTIFICATE_EXTENSION_UNSUPPORTED",
  "MIME_TYPE_BY_EXTENSION",
  "normalizedExtension === \"jpeg\" ? \"jpg\"",
  "validateSignupApplicationCertificateBytes",
  "bytes[0] === 0x89",
  "bytes[0] === 0xff",
  "bytes[0] === 0x25",
]) {
  assert.ok(`${policy}\n${service}`.includes(token), `strict file validation missing ${token}`);
}

assert.match(policy, /if \(!extensionMimeType \|\| extensionMimeType !== input\.mimeType\)/, "MIME/extension mismatch must fail");
assert.match(policy, /throw new Error\(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES\.extensionUnsupported\)/, "extension fallback must not silently rewrite invalid names");
assert.match(service, /getSignupApplicationCertificateExtension\(\{ originalName: rawOriginalName, mimeType \}\)/, "extension validation must use raw original name");
assert.match(service, /sanitizeSignupApplicationCertificateOriginalName\(rawOriginalName\)/, "display name must be sanitized separately");
assert.match(service, /validateSignupApplicationCertificateBytes\(\{ bytes, mimeType \}\)/, "header validation must remain in service");
assert.match(dashboard, /SIGNUP_CERTIFICATE_EXTENSION_UNSUPPORTED/);
assert.match(dashboard, /SIGNUP_CERTIFICATE_SIGNATURE_UNSUPPORTED/);
assert.match(dashboard, /SIGNUP_CERTIFICATE_SIZE_UNSUPPORTED/);

console.log("signup certificate strict file validation contract: OK");
