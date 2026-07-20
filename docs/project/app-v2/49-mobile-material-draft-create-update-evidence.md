# WAFL v2 Mobile Material Draft Create/Update Evidence

## Result and boundary

- Baseline: `2.0.0-alpha.49` at `c375ef12fa03b088ef04b020ebe8f2c0d6653c8d` on synchronized, clean `master`.
- Result: `2.0.0-alpha.50`.
- Status: `ALPHA50_MOBILE_MATERIAL_DRAFT_CREATE_UPDATE_COMPLETE` after every delivery gate passes.
- Scope: draft WorkOrder fabric-line create and update, explicit save, validation, concurrency conflict, dirty guard, canonical refresh, and bounded cache synchronization.
- Saved material deletion and order request/cancel/complete remain excluded. No DELETE route, hard delete, soft-delete schema, or order Command was added.

## Command and security boundary

- The existing exact material collection POST and material-line PATCH contracts are reused. Create accepts every supported fabric field in one POST; update sends only changed supported fields in one explicit PATCH.
- The alpha.50 approval is a separate dev/test-only material-draft guard. It enables only exact material POST/PATCH on the Tailscale Serve host and does not join the generic Command approval set.
- Draft WorkOrder/revision, `workorder.update`, exact Company A effective context, tenant scope, entity version, material editing status, approved dev/test fingerprint, and production block all remain mandatory.
- Material DELETE and order transition routes remain blocked by the external allowlist and existing alpha.26 lifecycle contract.

## Mobile editor behavior

- Draft cards expose add and edit entry points while non-draft cards stay read-only. Saved delete and order actions remain visibly disabled and have no handler.
- Supported fields are material name, color/option, usage area, required quantity, allowance, inventory usage, order quantity, unit, unit price, and memo. Unsupported supplier, material catalog, and application-color fields are not invented.
- The editor uses explicit save only. There is no effect-driven save, interval, focus save, polling, or automatic retry.
- `materialSaveRequestInFlight`, committed-version state, editor token, WorkOrder identity, and session generation block concurrent duplicate submit and cross-card response application.
- Successful create/update is followed by canonical WorkOrder detail GET plus materials GET. The response WorkOrder and entity versions must agree before the bounded per-WorkOrder cache and list/detail state are synchronized.
- Dirty navigation offers `계속 편집` and `변경사항 버리기`. An unsaved new editor can be cancelled without DB mutation.

## Bounded Runtime effects

The retained QA target remains a draft with final WorkOrder/revision version `5/5`, one fabric line, and material-line version `3`.

Final accepted mutation baseline:

| Effect | Actual |
| --- | ---: |
| material POST create | 1 |
| material PATCH | 2 |
| WorkOrder version delta | +3 |
| revision version delta | +3 |
| material row delta | +1 |
| material version-sum delta | +3 |
| command receipt delta | +1 |
| domain event delta | +3 |
| validation failure | 1, HTTP 400, mutation 0 |
| material DELETE | 0 |
| order request/cancel/complete | 0 |

The POST stored the full create payload. Both PATCH events were separate edit-mode explicit-save paths with distinct request identities and separated timestamps. Source audit found automatic save `0`, duplicate handler wiring `0`, and immediate duplicate submit `0`. The exact physical QA step owning each PATCH could not be reconstructed without an interaction ledger. The owner classified the additional PATCH as an extra explicit save during QA with its exact interaction step unresolved, not as an automatic mutation or proven product defect. No rollback, cleanup, delete, or value restoration was performed.

Interaction-ledger instrumentation is not added in alpha.50. If this ambiguity recurs, it is a separate dev/test observability Delta.

## Conflict and non-mutation proof

- A single stale PATCH used old expected version `4` while the current version was `5`.
- Result: HTTP `409` / `CONFLICT` exactly once.
- Successful mutation, retry, WorkOrder/revision/material version delta, event/receipt delta, and stored-value delta were all `0`.
- One invalid create request returned HTTP `400` / `VALIDATION_ERROR` and changed no business state.
- Migration ledger remained `12`; schema/migration, R2, PDF, token, production, native dependency, EAS Build, and EAS Update effects were `0`.

## Physical iPhone QA

The first informal statement was not expanded into a complete checklist or exact request count. Verified user evidence is recorded only at the granularity actually confirmed:

- external cellular, Tailscale, and automatic connection were usable without a connection code;
- material create and material update behavior were observed, with no reported crash, red screen, or infinite loading;
- later no-save QA explicitly passed dirty-guard continue editing, discard changes, retained stored values, unsaved-new-editor cancellation, saved-delete disabled, order action disabled, non-draft read-only, and background/re-entry;
- the no-save QA used the save button `0` times and produced POST/PATCH/DELETE/order Command `0`.

The Runtime event audit, not the informal owner summary, owns the final POST/PATCH counts above.

## Runtime teardown

- The final canonical runner start used DeveloperAutoConnect with the exact alpha.50 material-draft mutation mode.
- Canonical stop ran once after the final user QA and ended the four exact runner-owned processes.
- Final state is stopped; Serve ownership is released; Serve and Funnel configs are empty; explicit `AllowFunnel: true` count is `0`; ports 3000/3100/8081 have listeners `0/0/0`; Tailscale remains Running.
- Ownership skip and unrelated process termination are `0`.

## Validation and delivery

- The alpha.50 contract verifies full create POST, explicit changed-field PATCH, draft/non-draft boundaries, validation, conflict state, dirty guard, duplicate-submit protection, canonical GET/cache sync, DELETE/order exclusion, and unchanged native/EAS identity.
- Historical alpha.44-alpha.49 feature and infrastructure contracts remain regression gates.
- Targeted ESLint, root/mobile TypeScript, Next production build, Expo config/install/Doctor, Unicode and secret scans, mutation audit, and canonical `automation-infrastructure` Verify run on the final source/document fingerprint.
- Final Verify fingerprint, contract total, commit, push, Source ZIP, and matching repo-state identities are owned by the final workflow output and repo-state.

## Deferred boundary

- Alpha.51 candidate: an explicitly approved material soft-delete lifecycle covering schema, visibility, restore, snapshot, event, and receipt semantics.
- Alpha.52 candidate: material order request/cancel/complete Commands.
- The earlier canonical-document refactoring analysis remains a future infrastructure reference; alpha.50 does not restructure canonical document ownership.
