# Alpha.66 WorkOrder Lineage, Sample, Filter, and Pre-Issue Evidence

Document type: **Immutable Evidence**

Finalization status: `ALPHA66_FINALIZATION_COMPLETE`

Accepted product checkpoint: `ALPHA66_WORKORDER_LINEAGE_SAMPLE_FILTER_PREISSUE_COMPLETE`

Owner decision: `OWNER_ACCEPTED_ALPHA66_SCOPE_FOR_FINALIZATION`

## Accepted boundary

- Sample character, derivation lineage, workflow status, and document revision remain independent axes.
- DEV/TEST-only additive migration `019` owns WorkOrder Sample and tenant-safe lineage identity; additive migration `020` enforces that Sample cannot be Reorder or inherit reorder-round context. Sample Rework at round zero remains valid.
- WorkOrder creation and detail use the canonical `본생산 / 샘플` semantics. The detail control is compact and contextual, passive lineage prose is hidden, workflow status remains visually distinct, and applicable Reorder/Rework badges remain visible.
- The WorkOrder list stays flat and exposes truthful identity badges plus independent WorkOrder-character and multi-select lineage filters.
- Overview uses the complete canonical issue-readiness array for `발행 전 확인 N건`, its WAFL Sheet rows, stable issue-code navigation, and the `발행 준비 완료` zero state.
- Readiness-relevant mutations reconcile the same canonical detail projection. No parallel mobile readiness counter exists.

## Explicit exclusions

- Actual Reorder creation/copy E2E: `0`.
- Actual Rework creation/reason E2E: `0`.
- Production migration and mutation: `0`.
- Owner-fixture mutation: `0`.
- Migration `021`: `0`.
- Alpha.67 `N차 리오더 E2E`: `NOT STARTED`.

## Verification boundary

The pre-version Canonical Verify passed `161/161` with FAIL/SKIP `0/0` and changed-files fingerprint
`b1533f4ff0fbb83675b0b10d94fdd47cac4777538e4e7f42db7bea08bdb4064d`. The approved DEV/TEST
migration ledger is `20/20`. Post-version verification, the final commit and origin synchronization,
Git cleanliness, artifact digest, and exact completion time are intentionally owned by the matching
post-push alpha.66 repo-state because a source file cannot contain the identity of the commit that
contains itself.

Owner physical-iPhone outcome is not inferred from automation.

`PHYSICAL_RESULT_NOT_INFERRED`
