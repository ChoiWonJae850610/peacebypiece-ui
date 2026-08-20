# Alpha.66 Identity Filter and Segmented Work Character UX Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA66_IDENTITY_FILTER_SEGMENTED_UX_IPHONE_REQA_REQUIRED`

## Scope

- Live WorkOrder identity copy uses `본생산 / 샘플`; unrelated uses of `일반` remain unchanged.
- Create and detail share one WAFL segmented `작업 구분` owner. Fresh create defaults to `샘플`, while detail reflects the persisted WorkOrder character.
- The flat list keeps its existing workflow-status rail and adds two independent staged identity-filter axes: one `전체 / 본생산 / 샘플` work-character choice and multi-select `리오더 / 재작업` lineage choices.
- Reorder and Rework selections OR inside the lineage group. Search, workflow status, work character, and the lineage group combine with AND.
- The canonical lineage set order is `reorder,rework` regardless of toggle order and is bound with every other filter dimension into the opaque cursor scope.
- Zero to three active chips remove one work-character or lineage choice independently. Identity badges remain ordered `샘플 → N차 리오더 → 재작업`.

## Boundary

Migration ledger remains `19/19`; migration `020` is absent. Actual Reorder/Rework creation, copy, round allocation, Rework reason authoring, PDF identity projection, list grouping, production mutation, and owner-fixture mutation are outside this correction.

## Verification boundary

The focused permanent contract extends the retained `157` checks to `158`. It verifies the shared segmented owner, canonical terminology, two-axis predicates, lineage OR and cross-axis AND, cursor-set normalization, independent chips, badge consistency, and migration boundary. Canonical TypeScript, ESLint, Next/Expo build, mutation audit, migration audit, full Verify, and strict external Runtime remain required by the official Result/QA.

`PHYSICAL_RESULT_NOT_INFERRED`: automated checks and Runtime readiness do not claim owner physical-iPhone acceptance.
