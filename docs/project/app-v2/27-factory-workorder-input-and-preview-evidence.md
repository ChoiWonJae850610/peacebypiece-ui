# WAFL v2 Factory Workorder Input and Preview Evidence

Status: `ALPHA30_COMMAND_RUNTIME_AND_COMPLETION_PASS`

## Confirmed field policy

- Material adds nullable free-text `usage_area` (`usageArea`, maximum 1,000 characters).
- Process adds nullable free-text `application_area` and `application_color_target` (maximum 1,000 characters each).
- Revision adds nullable `factory_delivery_memo` (`factoryDeliveryMemo`, maximum 5,000 characters). Existing `memo` remains the general work instruction.
- No send-time, next-process, outbound/return date, factory delivery quantity, or separate remark field is added.

## Migration and Command preparation

Migration 009 is additive-only: four nullable text columns, matching `NOT VALID` length checks, and comments. It has no backfill, index, rename, drop, or production authorization. Migrations 001-008 remain unchanged. The dedicated runner requires fingerprint `01e5dcc7fea3`, ledger 8/8, exact confirmation, dev/test runtime, and explicit migration approval.

Material create/PATCH accepts `usageArea` while preserving expectedVersion, tenant scope, idempotency, audit summary, and issued lock. No process write existed, so alpha.30 prepares only existing-row `PATCH /api/v2/work-orders/:workOrderId/processes/:processId`; it does not create, delete, reorder, complete, or change process status. WorkOrder basic create/PATCH stores `factoryDeliveryMemo` on the revision.

## Mobile and factory Preview

Mobile uses multiline 16px free-text controls and displays summaries only when values exist. The Preview becomes a multi-page A4 factory document: document/product identity, sketch area, factory delivery memo, work instructions, fabric/accessory tables, color-size totals, size specification, and process table. It uses `개정차수` and `YYYY.MM.DD` and omits material inventory/order quantity/cost/internal status and process cost/internal status.

## Approved migration result

Migration 009 was applied exactly once to approved dev/test fingerprint `01e5dcc7fea3`. The ledger moved from 8/8 to 9/9. All four columns are nullable `text`; all four named length checks remain `NOT VALID`. Existing row counts and values, RLS, FORCE RLS, runtime-role ACL, table/index/function/policy counts, and business/R2/Worker/PDF/production state were unchanged. Existing values in all four new columns remain null.

## Exact bounded runtime plan

The runtime target uses a new Company A synthetic WorkOrder identified by `itemCode=A30FACT` and `clientRequestId=alpha30-factory-instruction-create-v1`. A read-only preflight must prove that this target, its document number, and its command receipts do not exist before any valid Command is sent.

| Step | Operation | Transaction and approval boundary | Expected retained mutation |
|---|---|---|---|
| 1 | Create synthetic WorkOrder and R0 draft | one WorkOrder Command transaction; alpha.30 approval phase only | WorkOrder +1, revision +1, receipt +1, event +1, versions 1/1 |
| 2 | Create one material line | one material Command transaction; alpha.26 material approval phase only | material +1, receipt +1, event +1, parent versions 1 to 2, material version 1 |
| 3 | Insert one process fixture | one dedicated parameterized tenant-role fixture transaction | process +1 at version 1; no receipt/event/parent version change |
| 4 | Patch `usage_area` | one material Command transaction; alpha.26 material approval phase only | event +1, parent versions 2 to 3, material version 1 to 2 |
| 5 | Patch process application fields | one process Command transaction; alpha.30 approval phase only | event +1, parent versions 3 to 4, process version 1 to 2 |
| 6 | Patch `factory_delivery_memo` | one WorkOrder Command transaction; alpha.30 approval phase only | event +1, parent versions 4 to 5 |
| 7 | Verify Read Models | GET/read-only transactions only | none |
| 8 | Issue current revision once | one issue Command transaction; alpha.27 issue approval phase only | document number +1, receipt +1, event +1, parent versions 5 to 6 |
| 9 | Verify issued Preview | GET/read-only transactions only | none |
| 10 | Verify immutable locks | one call per approved Command guard phase; every call must return `LOCKED` | none |
| 11 | Bounded completion audit | `BEGIN READ ONLY` | none |
| 12 | GET-only Preview verification | GET only | none |
| 13 | Finalize alpha.30 after PASS | Verify, Plan, Finish and delivery only | no DB mutation |

Only one exact Command approval is active in each server phase. Alpha.26 material, alpha.30 process/general WorkOrder, and alpha.27 issue approvals are never enabled together.

The process fixture is not a Command API. It inserts exactly one `work_order_processes` row for the new Company A R0 draft using parameterized SQL, the fixed tenant runtime role and claims, canonical required fields, `status=ready`, `display_order=0`, and `entity_version=1`. It runs in its own bounded transaction. It creates no receipt or event and does not advance WorkOrder/revision versions. Failure rolls back only that fixture transaction; no cleanup, retry, or compensating mutation is authorized.

The fixed retained budget is WorkOrder +1, draft revision +1, material +1, process fixture +1, receipts +3, events +6, document number +1, WorkOrder/revision versions 1 to 6, material/process versions 1 to 2, generated documents 0, next draft 0, and cleanup/reset/rollback execution 0.

## Pending gates

The approved runtime retained one Company A synthetic WorkOrder/R0, one fabric, one direct process fixture, and one accessory. The first runner stopped after the six draft-write steps because it passed an unsupported `limit` query to the processes GET; a bounded audit proved a consistent `5/5/2/2`, receipt/event `2/5` state. A first issue-only attempt then returned `DOCUMENT_NOT_READY` because the issue contract requires both fabric and accessory counts. It retained no mutation.

The approved accessory continuation created exactly one accessory with `usageArea`, advanced the draft to 6/6, and then issued R0 exactly once. Final state is issued/finalized at WorkOrder/revision 7/7, fabric/accessory/process versions 2/1/2, receipts/events 4/7, incomplete receipt 0, one document number, one revision, no next draft, and no generated document. Preview repeated GET was deterministic; Company B/H returned `NOT_FOUND`, Company C returned `FORBIDDEN`, and factory memo, both material usage areas, and process application fields were revision-scoped. WorkOrder memo, fabric/accessory usage area, and process application fields all returned `LOCKED` after issue without changing the final ledger.

Migration ledger remains 9/9. This version performed approved dev/test synthetic test-data mutation and one direct process fixture mutation. It performed no production/business/R2/Worker/PDF mutation, no cleanup/reset, and no actual PDF or QR generation. Alpha.31 owns PDF/QR/R2 lifecycle.
