# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.58`
Status: `ALPHA58_MOBILE_SIZE_COLOR_READONLY_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.58 entry HEAD/origin | `51f4f9370b8472af749e6bb3a10b37514bfb5367` |
| Entry commit | `docs: WAFL v2 alpha.57 canonical 상태 동기화` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.58` |
| Mobile package version | `2.0.0-alpha.58` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.58 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-push alpha.58 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.58.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.58-<actual timestamp>.txt`.
- `4. Newest` must contain only that matching pair after Finish.
- The accepted handoff is the matching alpha.58 ZIP/repo-state pair generated from the final synchronized pushed HEAD.

## Current product and transport baseline

- Customer product direction: Expo React Native mobile/tablet first.
- Metro transport for approved external development QA: private Tailscale LAN HTTP under the Development-only ATS boundary.
- Developer authentication and WorkOrder API transport: tailnet-only Tailscale Serve HTTPS.
- Preview/Viewer transport: process-owned Cloudflare Quick Tunnel HTTPS.
- Next backend for DeveloperAutoConnect: localhost-only.
- Tailscale Funnel: disabled; only structural `AllowFunnel: true` means enabled.
- Default external runner mode: read-only `DeveloperAutoConnect`; separately approved mutation Deltas may enable only their exact process-local route set.
- The manual one-time connection-code fallback remains available.
- Normal flow dependency on localhost:3000: none.
- Production access and mutation: blocked by default.

Do not record live PID, port ownership, temporary origin, connection code, session/cookie, full identity hash, credentials, or full WorkOrder UUID in this tracked snapshot.

## Latest feature and architecture baseline

Alpha.58 extends the completed alpha.57 Maker mobile WorkOrder baseline without a schema migration, dependency/native change, or production mutation:

- the Maker mobile `사이즈·색상` tab reuses the existing strict GET-only `/size-color` and `/size-spec` v2 read models rather than introducing another API or data model;
- response normalization verifies WorkOrder, revision, entityVersion, size, color, quantity, POM, measurement cell, decimal, and total semantics before committing data to the screen;
- a feature-owned, entityVersion-aware read controller provides bounded cache entries, in-flight dedupe, stale-response rejection, WorkOrder isolation, session reset, retry, and canonical version-transition refresh;
- the read-only screen presents the color-by-size quantity matrix, totals consistency, finished measurements, empty/error/retry states, and local-only `cm | inch` display without adding size, color, quantity, or measurement persistence;
- cm-to-inch display rounds to the nearest one-eighth inch, inch-to-cm display uses one decimal without a trailing zero, and same-unit cm display removes only insignificant trailing zeroes while preserving stored source values;
- the final UX uses the established content gutter and typography, a single policy-driven `읽기 전용` badge, shared active/inactive/locked tab styling, and one shared 400ms delayed-loading policy with stale-timer cleanup;
- the bounded source-quality refactor keeps query/cache lifecycle out of the Experience/Overview composition boundary and separates deterministic Runtime snapshots, compiled marker normalization, and observed/`NOT_OBSERVED` evidence serialization;
- Runtime evidence verified the accepted rich fixture with three sizes, three colors, nine quantity cells, five POM columns, fifteen measurement cells, stored unit cm, tenant isolation, and zero observed WorkOrder/revision/event/receipt/migration/size-table delta;
- owner physical-iPhone function, visual alignment, display formatting, refactor regression, and final cleanup acceptance establish the product checkpoint;
- alpha.58 adds no CRUD/edit path, automatic total-quantity update, Factory scope, schema/migration, fixture mutation, dependency/native/EAS change, R2 mutation, or production access.

Final TypeScript, ESLint, Next, Expo, contracts, mutation audit, Canonical Verify, Git, and artifact identities are recorded by the final workflow and matching repo-state.

## Canonical owner structure

- Repository routing: `AGENTS.md`.
- Canonical index and task routing: `docs/project/app-v2/00-start-here.md`.
- Permanent Rules entry point: `docs/project/app-v2/09-codex-working-rules.md`.
- Permanent Rules responsibility owners: `09a` execution lifecycle, `09b` Runtime/data/PC safety, `09c` testing/contracts/handoff, and `09d` Version Delta/finalization.
- Self-executing concise Delta template: `docs/project/app-v2/09e-codex-version-delta-template.md`.
- Current Baseline: this file.
- Current/next roadmap and Version Delta: `docs/project/app-v2/08-roadmap-2.0.md`.
- Device acceptance: `docs/project/app-v2/05-device-test-plan.md`.
- Expo/native environment: `docs/project/app-v2/06-expo-environment-setup.md`.
- External runtime operations: `docs/project/app-v2/41-external-mobile-qa-runbook.md`.
- Normative WorkOrder API contract: `docs/project/app-v2/16-workorder-api-command-read-model-contracts.md`.
- Verification contract: `docs/project/app-v2/17-v2-api-contract-test-plan.md`.
- Historical results: numbered immutable evidence.

## Current evidence

- Alpha.47 developer auto-connect: `docs/project/app-v2/46-mobile-tailscale-serve-developer-auto-connect-evidence.md`.
- Alpha.48 material Read: `docs/project/app-v2/47-mobile-materials-real-read-evidence.md`.
- Alpha.49 canonical instruction architecture: `docs/project/app-v2/48-canonical-codex-instruction-architecture-evidence.md`.
- Alpha.50 material draft create/update: `docs/project/app-v2/49-mobile-material-draft-create-update-evidence.md`.
- Alpha.51 material soft-delete/restore lifecycle: `docs/project/app-v2/50-mobile-material-soft-delete-restore-lifecycle-evidence.md`.
- Alpha.52 mobile core inline UX, calculation, list, and date: `docs/project/app-v2/51-mobile-core-inline-ux-calculation-list-date-evidence.md`.
- Alpha.53 mobile architecture foundation: `docs/project/app-v2/52-mobile-architecture-foundation-evidence.md`.
- Alpha.54 mobile Reel Picker input UX: `docs/project/app-v2/53-mobile-reel-picker-input-ux-evidence.md`.
- Canonical Codex rules documentation maintenance: `docs/project/app-v2/54-canonical-codex-working-rules-normalization-evidence.md`.
- Alpha.55 material order cancellation, zero-order, memo IME, and Runtime QA: `docs/project/app-v2/55-mobile-material-order-lifecycle-evidence.md`.
- Alpha.56 accessory lifecycle parity and physical-iPhone acceptance: `docs/project/app-v2/56-mobile-accessory-lifecycle-parity-evidence.md`.
- Alpha.57 mobile overview, Category, image, and inline input: `docs/project/app-v2/57-mobile-overview-category-inline-input-evidence.md`.
- Alpha.58 mobile size/color read-only foundation and final UX: `docs/project/app-v2/58-mobile-size-color-readonly-evidence.md`.

Older facts remain in their numbered evidence. They are not recopied here.

## Next candidate boundary

Candidate: `2.0.0-alpha.59` — mobile size/color structure editing.

Potential Delta scope:

- add, rename, archive, restore, and order size/color structure only through an owner-approved draft editing contract;
- preserve expectedVersion, conflict recovery, failed-save restore, tenant/permission checks, and the completed read/edit sibling boundary;
- keep quantity-matrix editing, finished-measurement editing, templates, Factory scope, migration, and production effects excluded unless separately approved.

Alpha.59 does not start until a separately owner-approved concise self-executing Delta defines its exact scope, effect budget, Runtime, and acceptance.
