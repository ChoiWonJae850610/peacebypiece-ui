#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("app/api/workorders/[workOrderId]/generated/order-request-pdf/[attachmentId]/view/route.ts", "utf8");

assert.match(route, /getCurrentWaflSession/);
assert.match(route, /createCompanyApiAccessBlockedResponse/);
assert.match(route, /company_id = \$3/);
assert.match(route, /source_type = 'system'/);
assert.match(route, /generated_document_type = 'order_request_pdf'/);
assert.match(route, /isCanonicalWorkOrderPdfStorageKey/);
assert.match(route, /getR2Object/);
assert.match(route, /Content-Disposition/);
assert.match(route, /inline;/);
assert.match(route, /Cache-Control": "no-store"/);
assert.match(route, /X-Content-Type-Options": "nosniff"/);
assert.match(route, /PDF_OBJECT_MISSING/);
assert.doesNotMatch(route, /NextResponse\.redirect|createR2WorkerFileUrl|signedUrl|downloadUrl|storageKey:\s*file\.storage_key|console\.error/);

console.log("workorder PDF viewer contract passed");
