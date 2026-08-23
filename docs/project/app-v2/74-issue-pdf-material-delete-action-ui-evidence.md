# Alpha.67 issue/PDF/material/action remediation evidence

Document type: **Immutable Evidence**

Status: `ALPHA67_ISSUE_PDF_MATERIAL_DELETE_ACTION_UI_IPHONE_REQA_REQUIRED`

## Scope

This bounded alpha.67 checkpoint reconciles issue readiness with document-number allocation,
removes the alpha.64-labelled PDF runtime guard, preserves issued state across PDF failure,
restores history-aware Fabric/Accessory removal, and aligns Production complete/cancel actions.
It does not reimplement Nth Reorder, add Rework creation, or claim full alpha.67 acceptance.

## Canonical implementation

- `documentNumberSegmentPolicy.mjs` owns both readiness and issue item-segment resolution.
- The existing stable major-category code is the fallback for non-ASCII item text.
- `DOCUMENT_R0` capability plus current runtime approval owns PDF generation.
- Issue success and PDF generation are separate commit boundaries; retry is generation-only.
- `materialRemovalPolicy.ts` classifies hard delete, history-preserving archive, and denial.
- Production complete/cancel actions use one compact icon-only action family.

## Verification boundary

The focused permanent contract and the full canonical inventory must pass under Windows Node
24.14.0. Isolated DEV/TEST Runtime evidence may mutate only owned synthetic fixtures and objects
with exact cleanup. Production and owner fixtures remain read-only. Migration remains `20/20`
with no migration `021`.

Owner physical-iPhone result is not inferred from automated evidence.

## Recorded verification

- Canonical Verify: `164/164 PASS` under Windows Node `24.14.0`.
- The official Result/QA pair records the final changed-source fingerprint.
- Isolated Runtime: Korean detail readiness/issue, ordinary PDF/R2/read, direct-Reorder
  PDF/R2/read, Fabric/Accessory hard-delete and history-preserving archive, and requested/
  completed denial all passed.
- Retained DEV/TEST evidence: one new ordinary physical-QA WorkOrder and two immutable generated
  documents (ordinary plus existing isolated Reorder); temporary residual is zero.
- Migration ledger `20/20`; migration `021` absent; production/owner-fixture mutation `0/0`.
