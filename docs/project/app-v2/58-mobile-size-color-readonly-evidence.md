# 2.0.0-alpha.58 Mobile Size/Color Read-Only Evidence

Status: `ALPHA58_MOBILE_SIZE_COLOR_READONLY_COMPLETE`

## 1. Result and boundary

- Result version: `2.0.0-alpha.58`.
- Product checkpoint: `ALPHA58_MOBILE_SIZE_COLOR_READONLY_COMPLETE`.
- Completed scope: Maker mobile size/color and finished-measurement real-data read, local-only unit display, cache/lifecycle hardening, bounded source-quality refactor, visual alignment, display formatting, and final user-facing UX cleanup.
- Owner acceptance: physical-iPhone QA passed the final size/color read-only behavior, visual alignment, display formatting, bounded-refactor regression, and final cleanup.
- Explicit exclusions: size/color/quantity/measurement write behavior, automatic total-quantity mutation, templates, Factory, schema/migration, fixture mutation, dependency/native/EAS work, R2 mutation, and production access.

## 2. Baseline and model reuse

- Alpha.58 entered from synchronized alpha.57 documentation HEAD/origin `51f4f9370b8472af749e6bb3a10b37514bfb5367`.
- The implementation reuses the existing v2 `/api/v2/work-orders/:workOrderId/size-color` and `/size-spec` GET routes and read models.
- No parallel endpoint, schema, migration, seed, backfill, fixture, or production model was introduced.
- Existing WorkOrder, revision, tenant, permission, anonymous, foreign-workspace, unsupported-query, and read-only transaction boundaries remain authoritative.

## 3. Mobile read architecture

- Mobile domain contracts describe size rows, color rows, quantity cells, matrix totals, POM columns, measurement cells, stored unit, and entity versions.
- API response normalization rejects mismatched WorkOrder identity, revision/entityVersion drift, duplicate cells, unknown size/color/POM references, invalid decimal or color values, malformed totals, and unsupported units.
- The WorkOrder query controller exposes only the two read operations for this feature.
- A feature-owned read controller uses a WorkOrder-and-entityVersion cache key, bounded cache size, in-flight dedupe, stale-response commit rejection, WorkOrder isolation, session generation reset, retry, and version-transition refresh.
- The Experience and Overview receive a narrow public read boundary rather than owning feature cache and request lifecycle details.

## 4. Read-only product behavior

- The `사이즈·색상` tab displays the color-by-size production quantity matrix, row/column/grand totals, expected total, mismatch warning, finished-measurement table, and existing fallback memo where applicable.
- Loading, retry, error, fully empty, size-only, color-only, missing-cell, and missing-measurement states are explicit.
- The component has no edit, add, delete, save, persistence, command-controller, or direct network action.
- The established `제작` and `문서` tabs remain locked.
- No read action changes the overview total quantity.

## 5. Measurement and display policy

- The stored `displayValue`, `decimalValue`, and `measurementUnit` are not mutated.
- The `cm | inch` control is component-local display state and is not persisted.
- cm-to-inch display uses the nearest one-eighth inch.
- inch-to-cm display uses one decimal and removes a trailing `.0`.
- Same-unit cm display removes only insignificant trailing zeroes and preserves all meaningful decimal digits.
- Non-numeric stored display strings remain unchanged, and empty values render `-`.

## 6. Final visual and loading cleanup

- The screen reuses the accepted WAFL content gutter, typography hierarchy, navy/muted palette, quantity matrix, and finished-measurement table.
- Wide table bodies retain bounded horizontal scrolling while headings, summaries, warnings, and empty states remain in the common content grid.
- One policy-driven `읽기 전용` pill appears in the top WorkOrder navigation row only when canonical edit policy denies editing.
- Active, inactive, and locked tab presentation is centralized without per-tab style duplication or width-changing font-size behavior.
- Development/progress explanations and duplicate top headings were removed; actionable empty, error, retry, save-failure, and lock reasons remain.
- One shared delayed-loading controller shows the exact initial/tab copy only after 400ms, hides immediately on completion, cancels stale identity and unmount timers, and prevents duplicate timers.

## 7. Runtime and physical-device evidence

- Read-only Runtime QA used the exact owner-approved rich target and captured the DB snapshot before the target size GETs.
- The fixture contained three sizes, three colors, nine quantity cells, five POM columns, fifteen measurement cells, and stored unit cm; matrix and expected totals matched.
- Developer auto-connect, WorkOrder list/detail, size-color, and size-spec reads succeeded; unsupported query returned 400, anonymous returned 401, foreign workspace returned the canonical 404, and cross-WorkOrder isolation passed.
- Metro iOS manifest and bundle succeeded, compiled semantic markers were present, and fatal/red-screen/uncaught/unhandled markers were zero.
- Before/after WorkOrder, revision, event, receipt, migration-ledger, and size/color/spec table deltas were zero.
- R2 and production mutation were recorded as `NOT_OBSERVED` where no approved observer existed; no mutation authority or operation was introduced.
- The owner subsequently accepted the final behavior and visuals on the installed WAFL iPhone Development Build.

## 8. Source-quality audit and bounded refactor

- The source-quality audit concluded `BOUNDED_REFACTOR_RECOMMENDED` before alpha.59.
- The bounded refactor separated version-aware query/cache lifecycle, public read boundary, deterministic snapshot ordering, compiled-bundle normalization, and Runtime result/evidence serialization.
- Characterization contracts preserve entityVersion refresh, total semantics, in-flight dedupe, stale-response rejection, WorkOrder/session isolation, retry, read-only action count zero, before-snapshot ordering, and observed/`NOT_OBSERVED` evidence meaning.
- The refactor did not change customer layout/copy at that checkpoint, API response shape, DB schema, fixture data, or Runtime mutation budget.

## 9. Historical contract corrections

- Approved corrections were limited to stale historical assertions inside `tests`.
- Alpha.44/45 contracts now preserve real-read and locked-tab behavior without globally banning the later approved size routes or requiring private JSX/source shape.
- Alpha.46, alpha.48, and alpha.57 contracts preserve read-only safety, material loading, representative-image lifecycle, and user behavior without requiring removed body/help copy.
- No test was deleted, skipped, made unconditional, or changed to conceal a product, security, tenant, permission, data, or lifecycle regression.

## 10. Verification and delivery boundary

- Final verification covers alpha.58 targeted and characterization contracts, alpha.44/45 behavior-first contracts, alpha.52–57 regressions, the full alpha contract set, root/mobile TypeScript, changed-file ESLint, Expo public config, Next production build, document links, Unicode, version consistency, dependency/migration/native/EAS/secret guards, mutation audit, and Canonical Verify.
- Finalization changes only the canonical internal version surfaces, current-state, roadmap, and this new evidence in addition to the owner-approved alpha.58 continuation.
- Root package metadata and Expo public/native version retain their separate values and ownership.
- Finalization performs no Runtime restart, DB/schema/migration, fixture, R2, production, dependency, native, or EAS mutation.
- Candidate commit: `feat: WAFL v2 alpha.58 사이즈·색상 읽기 UX 완성`.
- This tracked evidence intentionally does not contain the hash of the commit that contains it or the final artifact hashes. Post-push Git and artifact identities belong to the matching repo-state and final Result.

## 11. Next candidate boundary

- Candidate: `2.0.0-alpha.59` Maker mobile size/color structure editing.
- Potential scope is limited to draft WorkOrder size/color add, rename, archive/restore, and ordering with expectedVersion, conflict recovery, failed-save restore, tenant/permission enforcement, and a clear read/edit sibling boundary.
- Quantity-matrix editing, finished-measurement editing, templates, Factory, schema/migration, automatic total-quantity mutation, production effects, dependency/native/EAS changes, and unrelated features remain excluded unless separately approved.
- Alpha.59 is not started by this evidence. It requires a separate owner-approved self-executing Version Delta.
