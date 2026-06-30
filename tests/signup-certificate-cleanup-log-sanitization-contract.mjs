import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync("lib/signup/signupApplicationCertificateService.ts", "utf8");
const worker = fs.readFileSync("lib/storage/r2/r2WorkerUpload.ts", "utf8");
const r2Client = fs.readFileSync("lib/storage/r2/r2Client.ts", "utf8");
const viewer = fs.readFileSync("app/api/system/signup/applications/[applicationId]/certificate/[fileId]/view/route.ts", "utf8");

assert.match(worker, /class R2WorkerRequestError/, "Worker helper must throw a safe typed error");
assert.match(worker, /R2_WORKER_DELETE_FAILED_\$\{input\.status\}/, "Worker delete failures must expose safe status code only");
assert.match(worker, /retryable/, "Worker failures must classify retryable status");
assert.doesNotMatch(worker, /throw new Error\((?:deleteError|fallbackError|body|message)/, "Worker helper must not throw raw Worker body/message");

assert.match(service, /\[SIGNUP_CERTIFICATE_R2_CLEANUP_FAILED\]/, "certificate cleanup failure log must exist");
assert.match(service, /operation: "delete"/, "cleanup logs must include operation");
assert.match(service, /status: r2Error\?\.status/, "cleanup logs must include safe status only");
assert.match(service, /retryable: r2Error\?\.retryable/, "cleanup logs must include retryable boolean");
assert.match(service, /cleanupBacklog: "0\.24\.28"/, "cleanup logs must record cleanup backlog");
assert.doesNotMatch(service, /message:\s*error instanceof Error \? error\.message/, "cleanup logs must not include raw error.message");
assert.doesNotMatch(service, /parsed\.message|parsed\.error|return body/, "upload failure mapping must not return Worker response body");

assert.doesNotMatch(r2Client, /message:\s*typeof record\.message/, "R2 client logs must not include provider message");
assert.doesNotMatch(r2Client, /message,\s*\n/, "presigned delete log must not include raw response body message");
assert.match(r2Client, /reason: "presigned-delete-failed"/, "presigned delete log must use safe reason");

assert.match(viewer, /operation: "view"/, "viewer failure log must include operation");
assert.match(viewer, /reason: "r2-get-failed"/, "viewer failure log must use a safe reason code");
assert.doesNotMatch(viewer, /message:\s*error instanceof Error \? error\.message/, "viewer log must not include raw error.message");

console.log("signup certificate cleanup log sanitization contract: OK");
