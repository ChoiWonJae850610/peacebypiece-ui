# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.56`
Status: `ALPHA56_ACCESSORY_LIFECYCLE_PARITY_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.56 entry HEAD/origin | `e36436293c3217f09555135149d9468e3fecf23a` |
| Entry commit | `feat: WAFL v2 원단 발주취소와 메모 IME lifecycle 완성` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.56` |
| Mobile package version | `2.0.0-alpha.56` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.56 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-commit alpha.56 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.56.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.56-<actual timestamp>.txt`.
- `4. Newest` must contain only that matching pair after Finish.
- The previous accepted handoff is the matching alpha.55 ZIP/repo-state pair recorded in its repo-state.

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

Alpha.56 reuses the completed alpha.55 material-order policy, controller, shared table, and input boundaries for accessory lifecycle parity without a dependency, schema, native, or EAS change:

- mobile material contracts, normalizers, queries, cache keys, tabs, labels, draft/edit flows, archive/restore, and request/cancel/complete actions now preserve the selected `fabric | accessory` type end to end;
- accessory and fabric continue to share `work_order_material_lines`, calculation, readiness, permission, expectedVersion, receipt/event, current cancellation, zero-order, terminal completion, and hard-delete prohibition;
- the exact accessory Runtime sequence verified normal and stock-covered-zero request/cancel/re-request/complete, archive/restore, Korean IME finalization, compact/full memo disclosure, fixed unit/status badge order, and quantity/unit one-line layout;
- physical-iPhone acceptance verified three explicit PATCH actions and request/cancel/re-request/complete with exact effects, terminal `completed / 9`, retained memo/display state, and background/re-entry;
- authoritative V5 memo evidence confirms expected/actual exact equality `true` with character, Unicode, whitespace, and newline difference `0`; finalization neither requeried nor corrected the memo;
- final retained canonical entity-version values are WorkOrder/revision/material `132/132/110`, material rows `11`, event/receipt `165/71`, migration ledger `13/13`, and legacy cancelled rows `2`;
- schema/migration, R2/PDF/token, production, dependency, native, and EAS effects remain zero.

The retained alpha.54 input behavior remains:

- total quantity uses an integer Reel Picker with direct-input fallback;
- editable material quantities use quantity plus step reels, while unit uses a dedicated unit reel;
- picker X/Check is icon-only and owns one complete edit session; X sends no PATCH and Check sends at most one explicit PATCH before returning to display state;
- material drafts are normalized as full canonical shapes, optional text is safe, valid API responses share one alias-free pure normalizer, and save failures cannot escape as unhandled promise rejections;
- search is immediate and fixed-height, Korean initial-consonant matching is client-side, and search-specific empty state is distinct from a company with no WorkOrders;
- list filters and the single representative card badge use one canonical workflow-status presentation policy; document state such as `발행됨` does not replace the workflow badge;
- due-date bottom-sheet density and date-cell centering retain date-only and explicit-save behavior;
- the installed Development Build was reused with dependency, native, and EAS delta `0`.

The retained user behavior remains:

- customer copy and list density use the WorkOrder (`작업지시서`) grammar with completed-text/English/number/document-number/Korean-initial search and canonical workflow-status filtering;
- overview product name, total quantity, and due date plus supported active-draft material values use same-position inline editing with explicit X/Check, dirty guard, expectedVersion, canonical refresh, and automatic-save `0`;
- archived, ordered/locked, non-draft, revision/status, order quantity, amount, and other calculated values remain read-only;
- narrow numeric rows expand within the card, exact-field focus uses measured keyboard-safe scroll, and the due-date picker is a compact single-source bottom sheet with date-only preservation and reopen `0`;
- canonical order quantity/amount calculations, decimal/currency formatting, and numeric leading-zero correction are shared and bounded; canonical zero becomes an empty edit draft so first input `5` renders `5`, not `05`;
- alpha.54 automated save QA performed exactly four approved dev/test PATCH actions, followed by exactly four owner-attributed physical-iPhone Check saves. Final retained dev/test versions are WorkOrder/revision/material `42/42/20`, event/receipt `75/26`, migration ledger `13/13`;
- final search/status/UI-polish Runtime and physical-iPhone QA performed Check/save `0` and retained that baseline with automatic, duplicate, unknown, order, archive, and delete mutation `0`;
- physical-iPhone Reel Picker, total/material/unit/memo save, search, calendar, workflow badge, background/re-entry, and canonical runner-stop acceptance passed within the recorded evidence scope.

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

Older facts remain in their numbered evidence. They are not recopied here.

## Next candidate boundary

Candidate: `2.0.0-alpha.57` — Maker WorkOrder image and representative-image foundation.

Potential Delta scope:

- reuse the existing attachment and primary-image structures before adding a new model;
- define bounded upload, camera, drawing entry, representative selection, tenant, permission, object lifecycle, and device evidence;
- keep AI image generation and Factory scope excluded;
- require separate approval for any schema, R2, native permission/plugin, EAS, or production effect.

Alpha.57 does not start until a separately owner-approved concise self-executing Delta defines its exact scope, storage/native effect budget, Runtime, and device acceptance.
