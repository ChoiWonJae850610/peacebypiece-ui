# Alpha.66 Header Status Layout and Readiness Refresh Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA66_HEADER_STATUS_LAYOUT_READINESS_REFRESH_IPHONE_REQA_REQUIRED`

## Scope

- Detail places the strong workflow-status pill directly below the representative image, removes only the redundant detail Sample informational pill, and retains applicable Reorder/Rework lineage pills.
- The compact `본생산 / 샘플` grouped control remains one top-right unit for eligible round-zero rows and remains absent in forced-본생산 reorder context. List status and identity badges are unchanged.
- Canonical readiness exposes its evaluated WorkOrder version to mobile. A shared query-controller policy detects a stale readiness projection whenever `basedOnVersion` trails the current entity version.
- Successful readiness-relevant mutation projections reconcile one canonical detail read. Overview count and Sheet membership continue to consume only the refreshed `readiness.issues` collection; no parallel mobile counter is introduced.
- Production publishes successful process mutations through that same parent refresh boundary because its local process-card cache does not own WorkOrder readiness.

## Boundary

DEV/TEST migration ledger remains `20/20`; migration `021`, schema expansion, actual Reorder/Rework creation E2E, production mutation, and owner-fixture mutation remain zero. APP_VERSION remains `2.0.0-alpha.65`; commit, push, and release remain outside this checkpoint.

## Verification boundary

The focused permanent contract extends the retained `160` checks to `161`. It verifies image-zone status placement, duplicate detail Sample-pill removal, retained lineage/list badges, non-wrapping top-right character control, version-aware canonical readiness refresh, Production refresh publication, and absence of a local readiness counter. Canonical TypeScript, ESLint, Next/Expo build, migration/mutation audit, full Verify, and strict external Runtime remain required. Automation does not establish physical-iPhone acceptance.

`PHYSICAL_RESULT_NOT_INFERRED`
