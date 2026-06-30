import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("app/api/system/companies/onboarding/files/[fileId]/view/route.ts", "utf8");
const signupViewerRoute = fs.readFileSync("app/api/system/signup/applications/[applicationId]/certificate/[fileId]/view/route.ts", "utf8");
const attachmentRoute = fs.readFileSync("lib/workorder/attachments/attachmentFileRoute.ts", "utf8");

assert.match(route, /requireSystemAdminScope/, "certificate viewer must remain system-admin scoped");
assert.match(route, /COMPANY_ONBOARDING_FILE_DOWNLOAD_BLOCKED/, "download requests need a stable deny code");
assert.match(route, /searchParams\.get\("download"\)\s*===\s*"1"/, "download query must be detected server-side");
assert.match(route, /download:\s*false/, "Worker redirect must not receive download mode");
assert.doesNotMatch(route, /download:\s*true/, "certificate viewer must not force Worker download mode");
assert.doesNotMatch(route, /content-disposition/i, "certificate viewer route must not emit attachment disposition");
const errorLogStart = route.indexOf("console.error");
assert.notEqual(errorLogStart, -1, "viewer route should keep a sanitized error log");
const errorLogBlock = route.slice(errorLogStart, route.indexOf("});", errorLogStart));
assert.doesNotMatch(errorLogBlock, /signedUrl\.url|storageKey:\s*file\.storageKey|bucket|endpoint/i, "logs must not expose signed URLs or raw storage details");

assert.match(signupViewerRoute, /requireSystemAdminScope/, "signup certificate viewer must remain system-admin scoped");
assert.match(signupViewerRoute, /searchParams\.get\("download"\)\s*===\s*"1"/, "signup viewer must deny download query server-side");
assert.match(signupViewerRoute, /SIGNUP_CERTIFICATE_DOWNLOAD_BLOCKED/, "signup viewer needs a stable download deny code");
assert.match(signupViewerRoute, /getR2Object/, "signup viewer must proxy through the server instead of exposing a signed URL");
assert.match(signupViewerRoute, /Content-Disposition/, "signup viewer must control browser disposition");
assert.match(signupViewerRoute, /inline;/, "signup viewer must force inline disposition");
assert.doesNotMatch(signupViewerRoute, /attachment|createR2WorkerFileUrl|NextResponse\.redirect|signedUrl|downloadUrl/i, "signup viewer must not expose download/signed URL paths");

assert.match(attachmentRoute, /handleWorkOrderAttachmentFileGet/, "customer workorder attachment route must remain separate");
assert.match(attachmentRoute, /MEMBER_PERMISSION_CODE\.storageRead/, "customer workorder attachment access must keep workspace permission checks");

console.log("certificate approval viewer no-download contract: OK");
