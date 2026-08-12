# 2.0.0-alpha.62 Size Measurement Standards and Templates Evidence

Status: `ALPHA62_FINALIZATION_COMPLETE`

## Result and boundary

- Result version: `2.0.0-alpha.62`.
- Alpha.62 entered from synchronized alpha.61 HEAD/origin
  `0681652b7c349bd4b73885e7bd3b3b7bb8a41cb3`.
- Completed scope: system/company finished-size specification templates, independent
  WorkOrder revision snapshots, cm/inch and exact 1/8-inch editing, Maker authoring and
  catalog UX, shared mobile input/projection architecture, and bounded dev/test Runtime.
- Exclusions: Factory scope, production DB/R2/PDF/token mutation, dependency/native/EAS
  changes, speculative application rewrite, and alpha.63 work.

## Schema, templates, and authorization

- Additive dev/test migrations `014_v2_size_spec_templates.sql` and
  `015_v2_company_work_order_structure_options.sql` are applied in the approved dev/test
  database. The final read-only ledger audit is `15/15`; finalization adds or applies no
  migration or schema change.
- System templates are application-authorized for system administrators. Company/admin/member
  callers cannot mutate them, anonymous callers are blocked, and customer template reads and
  mutations remain same-company scoped.
- Company template updates create immutable new versions. Existing WorkOrder snapshots do not
  change when a system or company template changes.
- WorkOrder Size is the only finished-spec size source of truth. Template application fills
  only normalized size intersections and never creates a parallel spec-only size lifecycle.

## Product and shared architecture

- Mobile users can load `WAFL 추천` or `사용자 저장 스펙`, review replacement effects,
  apply with canonical V, cancel with X and zero mutation, save a new user spec, create a new
  immutable version, rename/disable same-company specs, and reapply saved values.
- Finished specs persist cm/inch units and exact integer/eighth-inch values across leave,
  re-entry, background, and Development Client reload.
- Size/color selection stages locally. X discards with zero request; V sends one logical batch
  command and one transaction. Removals preserve alpha.60 physical-delete, linked-quantity
  cleanup, surviving-matrix totals, replay, and historical-protection semantics.
- Maker overview, factory memo, paired fabric/accessory editing, partner selection, numeric
  blur save, nullable clear, Unicode attachments, images/files, material order lifecycle, and
  reusable company size/color options use the canonical command and tenant boundaries.
- Shared typed owners cover reel rendering/lifecycle, Sheet V/X, semantic choices, option
  grids, nullable commit decisions, immediate focus transition, serialized mutation queue,
  command-scoped pending, staged set diff, projection impact, next-version promotion, and
  paired material semantic copy.
- The vendor and target pickers use the same canonical `single-choice-reel` render path.
  Always-mounted vendor and inch reels pass at least three X/reopen and V/reopen cycles without
  caller key/remount workarounds.

## Projection and performance evidence

- `set-cell`: command `1`, sizeColor GET `0`, sizeSpec GET `0`, whole-tab reload `0`.
- `set-unit`: command `1`, sizeColor GET `0`, sizeSpec GET `0`, whole-tab reload `0`.
- `apply-template`: command `1`, targeted sizeSpec GET at most `1`, matrix GET `0`, whole-tab
  reload `0`.
- company-template save/update: command `1`, WorkOrder sizeColor/spec GET `0/0`, whole-tab
  reload `0`; only the separate saved-template projection refreshes.
- Representative blocking mutation paths improved from roughly `2.4–3.0s` to roughly
  `1.0–2.0s` while retaining expectedVersion, idempotency, Event/Receipt, tenant, and conflict
  fallback behavior.

## Verification and Runtime

- Alpha.62 targeted and applicable historical contracts, root/mobile TypeScript, changed-file
  ESLint, JavaScript/helper parse, Next production build, Expo public config/bundle, migration
  schema/RLS/auth, document links, Unicode, PowerShell encoding, and `git diff --check` pass.
- Canonical Verify uses bundled Node `24.14.0` with profile `automation-infrastructure` and
  mutation-audit high-risk findings `0`.
- Isolated size measurement/template, company-template version, size/color delete, selection
  batch, and Maker authoring Runtime suites passed with exact mutable-business residual `0`.
  Append-only Event/Receipt evidence remains preserved.
- DeveloperAutoConnect used the dynamically resolved Tailscale host for Metro advertisement,
  iOS manifest launch, and the WAFL-owned Development Client path. Port `3000`, Quick Tunnel,
  cloudflared, and Funnel were absent for the internal alpha.62 Runtime.

## Owner physical iPhone acceptance

- The owner completed the final physical-iPhone QA and explicitly approved finalization with
  `다 잘 되는거같다 이걸로 이번 버전은 마무리하자`.
- This approval closes the final repeated reel lifecycle, bounded projection refresh, material
  copy, saved-spec, staged size/color, focus/pending/grid, Maker authoring, and
  DeveloperAutoConnect checks. Product and auto-connect QA were not repeated during metadata
  finalization.
- Finalization read-only audit preserved exactly one owner WorkOrder and one system template:
  WorkOrder/Revision `draft/draft` at `179/179`, one cm snapshot, two WorkOrder sizes, three
  colors, one measurement value, generated documents/public tokens `0/0`; system template
  active/version `1`, sizes/POM/values `3/3/0`.
- Owner fixture create, edit, apply, cleanup, delete, or recreation during finalization: `0`.

## Delivery

- `APP_VERSION`, mobile diagnostic version, mobile package metadata, and Expo diagnostic extra
  are synchronized to `2.0.0-alpha.62`; Expo public version remains `2.0.0` and the accepted
  Development Build remains reusable.
- Root package metadata is unchanged. Production mutation, force/history rewrite, and
  finalization-time migration/schema changes are `0`.
- This immutable evidence intentionally excludes its containing commit hash and final artifact
  hashes. The matching post-push alpha.62 repo-state owns final HEAD/origin, Git cleanliness,
  Canonical Verify fingerprint, and release ZIP identity.

## Later boundary

Alpha.63 is `NOT_STARTED`. Alpha.62 completion does not authorize Factory, production,
dependency/native/EAS, new migration/schema, or unrelated product scope.
