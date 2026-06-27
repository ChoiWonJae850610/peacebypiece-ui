#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const dbAttachmentRepository = fs.readFileSync("lib/workorder/persistence/dbAttachmentRepository.ts", "utf8");
const workOrderService = fs.readFileSync("lib/workorder/service/workOrderService.ts", "utf8");
const attachmentPermissions = fs.readFileSync("lib/permissions/attachments.ts", "utf8");
const refreshEvents = fs.readFileSync("lib/workorder/attachments/attachmentRefreshEvents.ts", "utf8");
const coreState = fs.readFileSync("lib/hooks/workorder/useWorkOrderCoreState.ts", "utf8");
const adminFilesClient = fs.readFileSync("components/admin/files/AdminFilesWorkspaceClient.tsx", "utf8");
const adminFilesServerActions = fs.readFileSync("lib/admin/adminFiles.serverActions.ts", "utf8");
const adminFilesTypes = fs.readFileSync("lib/admin/adminFiles.types.ts", "utf8");
const trashRows = fs.readFileSync("components/admin/files/fileTrashSectionRows.ts", "utf8");
const trashModals = fs.readFileSync("components/admin/files/fileTrashSectionModals.tsx", "utf8");
const restoreRoute = fs.readFileSync("app/api/admin/files/trash/restore/route.ts", "utf8");

assert.match(workOrderService, /hydrateWorkOrdersWithAttachmentSnapshots/);
assert.match(workOrderService, /repository\.listSnapshotsByWorkOrderIds/);
assert.match(dbAttachmentRepository, /WHERE order_id = ANY\(\$1::text\[\]\)/);
assert.doesNotMatch(dbAttachmentRepository, /ANY\(\$1::uuid\[\]\)/);
assert.doesNotMatch(dbAttachmentRepository, /order_id = \$1::uuid/);

assert.match(dbAttachmentRepository, /normalizeAttachmentScope\(row\.type\)/);
assert.match(attachmentPermissions, /getAttachmentScope\(attachment[\s\S]*ATTACHMENT_SCOPE\.attachment/);
assert.match(attachmentPermissions, /isOfficialAttachment[\s\S]*ATTACHMENT_SCOPE\.attachment/);
assert.match(attachmentPermissions, /mimeType\.includes\("pdf"\)/);
assert.match(attachmentPermissions, /fileName\.endsWith\("\.pdf"\)/);

assert.match(restoreRoute, /restoreAttachmentTrashItems/);
assert.doesNotMatch(restoreRoute, /R2_WORKER_UPLOAD|createR2WorkerUploadUrl|PUT|DELETE/);

assert.match(refreshEvents, /WORKORDER_ATTACHMENT_REFRESH_EVENT/);
assert.match(refreshEvents, /localStorage\.setItem/);
assert.match(coreState, /WORKORDER_ATTACHMENT_REFRESH_EVENT/);
assert.match(coreState, /window\.addEventListener\("storage"/);
assert.match(coreState, /loadWorkOrderDetailAsync\(targetId\)/);
assert.match(adminFilesClient, /notifyWorkOrderAttachmentRefresh/);
assert.match(adminFilesClient, /source: "storage-trash-restore"/);

assert.match(adminFilesTypes, /downloadUrl: string \| null/);
assert.match(adminFilesServerActions, /createAttachmentFileDownloadUrl/);
assert.match(adminFilesServerActions, /download: "1"/);
assert.match(trashRows, /downloadUrl: item\.downloadUrl/);
assert.match(trashModals, /filesList\.detail\.downloadFile/);
assert.match(trashModals, /filesList\.detail\.pdfPreviewNotice/);

console.log("workorder attachment restore contract passed: text ids, file/pdf mapping, refresh event, PDF actions");
