# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.57`
Status: `ALPHA57_MOBILE_OVERVIEW_CATEGORY_INLINE_INPUT_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.57 entry HEAD/origin | `592bf8d054bd13956616eb780a1dec5e812a8204` |
| Entry commit | `feat: WAFL v2 부자재 lifecycle parity 완성` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.57` |
| Mobile package version | `2.0.0-alpha.57` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.57 product and documentation-sync HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-push alpha.57 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.57.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.57-<actual timestamp>.txt`.
- `4. Newest` must contain only that matching pair after Finish.
- The accepted handoff is the matching alpha.57 ZIP/repo-state pair generated from the final synchronized pushed HEAD.

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

Alpha.57 extends the completed alpha.56 Maker mobile WorkOrder baseline without a schema migration or production mutation:

- WorkOrder images and attachments use the existing attachment/primary-image model and controlled Worker/proxy transport for real reads, bounded upload completion, camera or file acquisition, representative-image selection, preview, and delete lifecycle;
- image and attachment commands preserve tenant, permission, expected-version, storage-key, and object-lifecycle boundaries; AI image generation and Factory image features remain excluded;
- the common detail header is simplified, the tab row is placed before overview information, and the overview tab owns total quantity, due date, Category, and amount summaries;
- the saved Category fields are 대상, 대분류, 세부 품목, and 시즌; 대상 and 대분류 use the shared option Reel Picker while 세부 품목 and 시즌 use button-free inline save;
- 공장 전달 메모 and fabric/accessory usage-location and memo fields use the same bounded button-free inline save lifecycle with canonical refresh and duplicate-save prevention;
- numeric drafts replace canonical zero on the first input and normalize leading zeroes without changing canonical calculation or formatting rules;
- normal Maker mobile presentation no longer exposes archive recovery sections, while server-side soft-delete/history, lifecycle locks, and hard-delete prohibition remain intact;
- fabric defaults to `yd` and accessory defaults to `개`; the established request/cancel/re-request/complete, stock-covered zero-order, memo IME, unit/status badge, and calculation behavior remains preserved;
- automated contracts and Runtime evidence plus later owner physical-iPhone smoke confirmation cover the accepted alpha.57 scope. The earlier V10 checklist was `NOT_RUN` when generated and is not rewritten as individual formal PASS results;
- alpha.57 finalization introduced no Runtime, DB, R2, production, schema/migration, or additional native/EAS mutation. The approved picker dependencies are the only mobile dependency additions in the product result.

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

Older facts remain in their numbered evidence. They are not recopied here.

## Next candidate boundary

Candidate: `2.0.0-alpha.58` — mobile size/color read-only foundation.

Potential Delta scope:

- reuse the existing `/size-color`, `/size-spec`, and v2 read model before adding a new model;
- show Maker mobile loading, error, empty, and read states for sizes, colors, the quantity matrix, and finished measurements;
- keep create/update/delete, quantity or measurement mutation, template save, migration, automatic total-quantity changes, and Factory scope excluded.

Alpha.58 does not start until a separately owner-approved concise self-executing Delta defines its exact scope, effect budget, Runtime, and acceptance.
