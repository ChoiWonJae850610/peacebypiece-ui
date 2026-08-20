# Alpha.66 Header Identity Compact Control Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA66_HEADER_IDENTITY_COMPACT_CONTROL_IPHONE_REQA_REQUIRED`

## Scope

- The live mobile WorkOrder detail header no longer renders the passive `원본 · ... / N차 계보` subtitle or its reserved spacing.
- Source WorkOrder, source revision, root lineage, derivation kind, and reorder round remain unchanged in persistence, API, and read-model contracts. Source navigation is not introduced.
- Detail moves the shared `본생산 / 샘플` character choice into the status/lineage identity row through an explicit compact presentation variant. It has two equal semantic widths, bounded badge-family visual height, grouped-button geometry distinct from pill badges, and a canonical enlarged touch boundary.
- The compact pair is one non-splitting unit. The surrounding identity row may wrap the unit below the badge cluster on a narrow phone without returning to a full-width control or colliding with the representative image and editable title.
- The create sheet preserves the labeled form-sized `작업 구분` control and the fresh-session `샘플` default. Sample mutation and all alpha.66 list/filter semantics are unchanged.

## Architecture

- `WorkOrderCharacterChoice`: extended with explicit `form` and `compact` presentation semantics; business mapping remains shared.
- `WaflChoiceButtons`: extended with a bounded compact presentation that retains radio accessibility and shared selection behavior.
- `WAFL_THEME.segmentedControl`: owns compact visual height, equal segment width, grouped radius, and touch inset.
- `WorkOrderDetailOverview`: owns only the responsive header placement. No second header or local WorkOrder-character business owner is introduced.

## Boundary

Migration ledger remains `19/19`; migration `020` is absent. Source data deletion, Reorder/Rework creation E2E, source navigation, PDF/document projection changes, production mutation, and owner-fixture mutation are outside this correction.

## Verification boundary

The focused permanent contract extends `158` retained checks to `159`. It verifies compact shared ownership, equal bounded geometry, interactive-vs-badge distinction, hidden passive subtitle, preserved source read model, create default/control, existing list semantics, and the migration boundary. Canonical TypeScript, ESLint, Next/Expo gates, mutation audit, full Verify, and strict Runtime remain required by the official Result/QA.

`PHYSICAL_RESULT_NOT_INFERRED`
