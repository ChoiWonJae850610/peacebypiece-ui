# Alpha.66 WorkOrder Lineage, Sample, List Badge and Filter Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA66_WORKORDER_LINEAGE_SAMPLE_LIST_FILTER_IPHONE_QA_REQUIRED`

## Scope

- Migration `019` adds independent WorkOrder Sample and derivation-lineage identity on the approved DEV/TEST target only.
- Sample, derivation, workflow status, and document revision remain separate axes.
- Normal mobile creation defaults Sample ON; omitted API input explicitly defaults false.
- WorkOrder Sample identity may change later without revision, document, or lifecycle rewrite.
- List/detail read models expose identity and source context.
- The flat list retains one workflow rail and adds one separate staged identity filter with a removable active chip.
- Secondary badge order is `샘플 → N차 리오더 → 재작업`.

## Migration and fixture boundary

Existing rows are preserved as non-Sample original round zero. Tenant-safe source WorkOrder, source revision, and stable root references use restrictive foreign keys. Reorder round uniqueness applies only to reorder rows in the same series. The runtime QA family is synthetic DEV/TEST data; no production or owner fixture is mutated. Actual Reorder creation/copy E2E and Rework creation/reason E2E remain deferred.

## Verification boundary

The permanent alpha.66 contract extends the previous 156-check inventory to 157 and covers schema shape, create defaults, WorkOrder-only Sample mutation, list filter overlap, cursor binding, detail source joining, flat list UI, badge ordering, and absence of Reorder/Rework create routes. Canonical TypeScript, ESLint, build, iOS bundle, mutation audit, migration audit, and strict external runtime remain required by the official Result/QA.

`PHYSICAL_RESULT_NOT_INFERRED`: automated checks and runtime readiness do not claim owner physical-iPhone acceptance.
