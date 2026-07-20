# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.50`
Status: `ALPHA50_MOBILE_MATERIAL_DRAFT_CREATE_UPDATE_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.50 entry HEAD/origin | `c375ef12fa03b088ef04b020ebe8f2c0d6653c8d` |
| Entry commit | `docs: WAFL v2 Codex canonical 작업지시 체계 정리` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.50` |
| Mobile package version | `2.0.0-alpha.50` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.50 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-commit alpha.50 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.50.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.50-<actual timestamp>.txt`.
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

Alpha.50 adds draft fabric-line create/update only:

- full supported-field material POST create and changed-field PATCH editing with explicit save;
- validation, saving/error/conflict, stale 409, dirty guard, unsaved-new-editor cancellation, canonical refresh, and WorkOrder-keyed cache synchronization;
- draft/tenant/permission/version guards and non-draft read-only behavior;
- saved material DELETE remains blocked; order request/cancel/complete remains blocked;
- actual retained QA effects: POST `1`, PATCH `2`, WorkOrder/revision/material-version deltas `+3/+3/+3`, material row `+1`, receipt `+1`, event `+3`;
- one validation HTTP 400 and one stale HTTP 409 had mutation delta zero;
- schema/migration, R2/PDF/token, production, native dependency, and EAS Build/Update effects were zero;
- no-save physical-iPhone guard/read-only QA and canonical runner stop passed.

The exact interaction step owning each of the two explicit PATCH operations was not recoverable without an interaction ledger. This is recorded transparently in the alpha.50 evidence and is not classified as automatic save or a proven product defect.

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

Older facts remain in their numbered evidence. They are not recopied here.

## Next candidate boundary

Candidate: `2.0.0-alpha.51` — material-line soft-delete lifecycle policy and schema.

Potential Delta scope:

- lifecycle policy, schema, visibility, restore, snapshot, event, receipt, and concurrency semantics;
- an exact dev/test mutation budget and migration approval;
- existing hard DELETE prohibition remains until that Delta is approved and verified;
- material order request/cancel/complete remains the separate alpha.52 candidate;
- production, native/EAS, broad cleanup, and unrelated feature expansion remain excluded unless explicitly named.

The alpha.51 owner work order should be a short Version Delta that references the Permanent Rules instead of repeating them.
