# Alpha.67 Picker / Action / List / Reorder UX Evidence

- Checkpoint: `ALPHA67_PICKER_ACTION_LIST_REORDER_UX_IPHONE_REQA_REQUIRED`
- APP_VERSION: `2.0.0-alpha.66`
- Migration ledger: `20/20`; migration `021`: absent
- Production / owner fixture mutation: `0 / 0`
- Prior physical boundary: owner explicitly accepted every pending physical check through `ALPHA67_VIEWER_CLOSE_PDF_PROCESS_PICKER_CLEANUP_IPHONE_REQA_REQUIRED` as PASS.
- New-change physical result: `PHYSICAL_RESULT_NOT_INFERRED`

## Bounded remediation

1. Season and Detail Item retain the canonical `WaflInputSheet` and staged X/V semantics but now render bounded recommendations through shared `WaflOptionGrid` selected cells. Each WorkOrder-local direct route is a separate `+ 직접입력` action. No nested virtualized body was introduced.
2. Requested Basic Process reuses `WaflCompactCardAction` with the RotateCcw icon, visible `발주취소`, warning outline, accessibility label, and unchanged command/pending semantics.
3. ISSUE awaits the authoritative detail refresh. `reconcileWorkOrderListItemFromDetail` patches workflow status, document status/number, totals, amount, identity, image, and timestamp in the canonical list model. A workflow transition marks the current list query stale exactly once; list return immediately consumes the patched status and starts one background reconcile for server filter/sort truth.
4. Reorder authoring no longer asks for quantity or due date before creation. The confirmation shows the best current series-round preview and `아니오 / 예`; No invokes no mutation, Yes sends `totalQuantity: 0` and `dueDate: null` through the existing idempotent/concurrency-safe command. The server result round and WorkOrder ID remain authoritative, and the returned Overview hydration path is unchanged.

## Verification

- Canonical Verify: `174/174 PASS`, FAIL `0`, SKIP `0`; fingerprint `fd16233f0c4570df54fe4fe83b3c27feab40614023cb05c9ee8ee9bb372c04ce`.
- Official verification log: `verify-safe-automation-infrastructure-20260821-205820.txt`.
- Reorder eligibility, global round allocation, copy/reset, zero allocation, Work History, source immutability, post-create hydration, and first-document independence remain regression gates.
- Final Runtime, snapshot, mutation, and completion identities are recorded in the official Result/QA pair.
