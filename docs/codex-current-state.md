# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.51`
Status: `ALPHA51_MOBILE_MATERIAL_SOFT_DELETE_RESTORE_LIFECYCLE_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.51 entry HEAD/origin | `20590dd8ff38df0d90981a3278b0e5edc87a7fc8` |
| Entry commit | `feat: WAFL v2 모바일 원단 draft 추가와 수정 완성` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.51` |
| Mobile package version | `2.0.0-alpha.51` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.51 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-commit alpha.51 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.51.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.51-<actual timestamp>.txt`.
- `4. Newest` must contain only that matching pair after Finish.
- The previous accepted handoff is the matching alpha.49 ZIP/repo-state pair recorded in its repo-state.

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

## Latest feature baseline

Alpha.51 adds the draft fabric-line recoverable archive/restore lifecycle:

- migration 013 adds lifecycle timestamp/actor metadata and active/archived partial indexes; exact dev/test apply and post-audit passed at ledger `13/13`;
- explicit POST archive/restore Commands preserve physical row identity, values, and sort order while incrementing material/WorkOrder/revision versions and emitting canonical receipt/event evidence;
- default material Read returns active rows only; explicit archived Read is separate; current draft count, totals, readiness, and preview exclude archived rows;
- requested/completed/cancelled order states and all non-draft WorkOrders block archive/restore; HTTP DELETE and material order Commands remain blocked;
- the deleted-material collapsed mobile section supports restore only and synchronizes canonical detail, active, and archived GET results;
- bounded preflight plus physical-iPhone QA performed archive/restore `2/2`, producing WorkOrder/revision/material-version and event/receipt deltas `+4/+4/+4` and `+4/+4`, with material row delta `0` and final lifecycle active;
- stale and non-draft lifecycle requests returned HTTP 409 with delta zero, and one hard DELETE request was blocked with delta zero;
- generated-document, token, R2/PDF, production, native dependency, and EAS Build/Update effects were zero;
- physical-iPhone archive/restore, dirty guard, persistence, non-draft blocking, background/re-entry, and canonical runner stop passed.

Final TypeScript, ESLint, Next, Expo, contracts, mutation audit, Canonical Verify, Git, and artifact identities are recorded by the final workflow and matching repo-state.

## Canonical owner structure

- Repository routing: `AGENTS.md`.
- Canonical index and task routing: `docs/project/app-v2/00-start-here.md`.
- Permanent Rules: `docs/project/app-v2/09-codex-working-rules.md`.
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

Older facts remain in their numbered evidence. They are not recopied here.

## Next candidate boundary

Candidate: `2.0.0-alpha.52` — material order request/cancel/complete Commands.

Potential Delta scope:

- exact request/cancel/complete transition states and permissions;
- expectedVersion, stale/repeated conflict, event/receipt, canonical refresh, and bounded device mutation evidence;
- archived rows remain ineligible and hard DELETE/purge remain forbidden;
- production, native/EAS, broad cleanup, and unrelated feature expansion remain excluded unless explicitly named.

The alpha.52 owner work order should be a short Version Delta that references the Permanent Rules instead of repeating them.
