# WAFL v2 WorkOrder Material and Order Command Evidence

## 1. Purpose and checkpoint

Alpha.26 extends the alpha.25 current-draft Command boundary to fabric/accessory lines and their order state. The approved dev/test mutation, bounded read-only audit, and final GET-only completion are complete. APP_VERSION is `2.0.0-alpha.26`.

## 2. Scope and routes

Fabric and accessory share `work_order_material_lines` and one route family:

- `POST /api/v2/work-orders/:workOrderId/materials`
- `PATCH /api/v2/work-orders/:workOrderId/materials/:materialLineId`
- `POST .../:materialLineId/order-request`
- `POST .../:materialLineId/order-cancel`
- `POST .../:materialLineId/order-complete`

The existing materials GET remains mounted. No DELETE route is exposed.

## 3. DTO and validation

- Create selects `fabric|accessory` and accepts only existing relational/scalar fields.
- Quantity uses scale 3, price/amount use scale 2, and negative, malformed, non-finite, or overflowing values are rejected.
- Amount is derived server-side from final order quantity and unit price; the client cannot submit amount/status/company/member/revision scope.
- PATCH is non-empty and scalar-only. A partial quantity/price PATCH is checked against the stored counterpart before the DB numeric write.
- Unknown fields and oversized JSON use the canonical typed error envelope.

## 4. Tenant, supplier, and permission boundary

- Company/member scope comes only from authenticated workspace membership.
- Create/PATCH require `workorder.update`.
- Request/cancel require `material.order.request`; complete requires `material.order.place`.
- Fixed `wafl_v2_tenant_runtime` write transactions and RLS claims are reused.
- Company C is denied before mutation. Cross-company WorkOrder/material/material-master/supplier references are generic `NOT_FOUND`.

## 5. Revision, state, and concurrency

- Only the WorkOrder current draft revision is mutable.
- Allowed transitions are `editing -> requested` and `requested -> cancelled|completed`.
- Direct status PATCH, requested/completed scalar PATCH, complete without request, completed cancel/reopen, and non-current/finalized revision mutation are rejected.
- WorkOrder `expectedVersion` is the client token. WorkOrder, revision, and line versions advance in the same transaction with one winner under contention.

## 6. Idempotency and audit

- Create/request/cancel/complete use actor-scoped hashes in the existing command receipt table; raw keys are never stored or logged.
- Same key and payload replay one effect. Different payload reuse returns typed conflict.
- Each successful effect appends one WorkOrder-scoped event containing safe material type/line/command/status/version summaries.
- Main mutation, receipt, version changes, and event are atomic. Failed requests leave none of them behind.

## 7. Delete decision

The applied schema has no `deleted_at`, active flag, or canonical material-line trash lifecycle. Hard delete would break history and issued-revision expectations. Alpha.26 therefore implements neither DELETE nor invented deactivation. A future additive lifecycle policy must define visibility, restore, snapshot, and purge behavior first.

## 8. Read model reflection

Successful commands must be visible through the existing alpha.24 core, typed materials, and history endpoints without new read DTOs. Alpha.23 list and all alpha.24 lazy reads remain regression gates.

## 9. Read-only preflight gate

The preflight may verify only runtime/fingerprint/ledger, unauthenticated and malformed requests, missing key/version, invalid fields, Company C pre-mutation denial, finalized/cross-company opaque behavior where no valid write can occur, and alpha.23~25 read regressions. It must prove before/after schema and row-count equality and must not set the valid alpha.26 mutation approval.

Preflight result: `PASS`.

- Approved dev/test fingerprint: `01e5dcc7fea3`.
- Migration ledger: `7/7`, unchanged.
- Target: retained Company A alpha.25 synthetic WorkOrder/R0 current draft; tenant-scoped supplier fixture available.
- Valid material create/PATCH/order transition sent: false.
- Company C pre-mutation `FORBIDDEN`, finalized-revision fixture precondition, and alpha.23/24/25 read/invalid-command regression: PASS.
- DB migration/schema/index, dev/test test-data, business/R2/Worker/PDF, and production mutation: false.
- Log: `OK_Wafl_V2_Alpha26_Material_Command_Preflight_2.0.0-alpha.25-20260712-101213.txt`.

## 10. Separately approved runtime budget

The retained Company A alpha.25 draft/R0 is reused; no new WorkOrder/revision is planned. The bounded synthetic matrix is:

- fabric lines `+2`, accessory lines `+1`;
- successful scalar PATCH `2`;
- order request `3`, base cancel `1`, base complete `1`;
- cancel-versus-complete race: exactly one winner;
- receipts `+9`, events/version transitions `+11`;
- material-line delete/deactivate `0`.

Runtime must also prove replay/conflict, PATCH/request races, B/H cross-company denial, C `FORBIDDEN`, supplier isolation, finalized lock, read reflection, performance evidence, and exact final ledger. The runner may execute only after a separate exact owner approval.

## 11. Approved runtime and read-only audit result

- Migration/schema/index: false.
- Seed/cleanup/reset/rollback: false.
- Business data, R2/Worker/PDF, production: false.
- The approved synthetic runtime committed exactly fabric `2`, accessory `1`, completed receipts `9`, audit events `11`, and WorkOrder/revision version transitions `3 -> 14` (`+11`). Incomplete receipts and supplier tenant mismatches are both `0`.
- The runner stopped after those commits because the finalized fixture assertion expected `REVISION_MISMATCH`; the canonical issued WorkOrder/finalized revision result is `LOCKED`, matching the alpha.25 runner and repository check order.
- The bounded read-only audit verdict is `NO_PARTIAL_MUTATION`. Cleanup is neither needed nor authorized.
- The first temporary completion attempt failed before evidence collection because it queried `migration_name` instead of canonical ledger column `filename`. The second completed all bounded DB reads but failed before API startup because its source assertion expected a switch case while the service uses `if (error.reason === "locked")`. Both failures are preserved; neither performed mutation.
- Final GET-only completion result is `READ_ONLY_COMPLETION_PASS`: GET success/failure `14/0`, direct DB client/query/SQL `0`, mutation route/method `0`, Company B/H `NOT_FOUND`, Company C `FORBIDDEN`, and alpha.23 list plus alpha.24 detail/material/history/lazy and alpha.25 list/detail regressions PASS.
- Read reflection is exact: fabric `2` cancelled `2`, accessory `1` completed `1`, and parent entity version `14`. The prior audit supplies revision version `14`, material version sum `11`, receipt `9` with incomplete `0`, event `11`, supplier mismatch `0`, ledger `7/7`, and transition sequence `3 -> 14`.
- Finalized `LOCKED` is `PASS_BY_EXISTING_RUNTIME_AND_SOURCE_EVIDENCE`: the alpha.25 accepted runtime, issued/finalized fixture audit, repository lock-first order, and service `LOCKED` mapping agree. The mutation PATCH was not replayed.
- Completion log: `readonly-completion-alpha26-material-command-20260712-152459.txt`; matching repo-state: `readonly-completion-repo-state-alpha26-material-command-20260712-152459.txt`.
- Do not rerun the full alpha.26 mutation runner. Cleanup and mutation replay remain prohibited.
- Residual decisions: material-line soft-delete lifecycle, cancelled-line reopen, and later revision issue/snapshot behavior.

## 12. Alpha.27 handoff

Alpha.27 is revision and work-order issuance Command work. It begins only after alpha.26 final Verify/Plan/Finish delivery is complete.
