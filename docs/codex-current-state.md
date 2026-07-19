# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.49`
Status: `ALPHA49_CANONICAL_CODEX_INSTRUCTION_ARCHITECTURE_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.49 entry HEAD/origin | `800b5e6052b67134706d0a94a7743ca8ed608aff` |
| Entry commit | `feat: WAFL v2 모바일 원단 실데이터 조회 연결` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.49` |
| Mobile package version | `2.0.0-alpha.49` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.49 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and the exact generated repo-state filename are therefore owned by the matching alpha.49 repo-state created after the one version commit.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.49.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.49-<actual timestamp>.txt`.
- `4. Newest` must contain only that matching pair after Finish.
- The previous accepted handoff was alpha.48 ZIP SHA-256 `9bd97b5ac24f773dd2c1fe9a030ae10f7ae0809e597ce224a832643d78f1b876`, size `6,600,361` bytes, entries `2,606`, exclude violations `0`, with `repo-state-2.0.0-alpha.48-20260720-000147.txt`.

## Current product and transport baseline

- Customer product direction: Expo React Native mobile/tablet first.
- Metro transport for approved external development QA: private Tailscale LAN HTTP under the Development-only ATS boundary.
- Developer authentication and WorkOrder API transport: tailnet-only Tailscale Serve HTTPS.
- Preview/Viewer transport: process-owned Cloudflare Quick Tunnel HTTPS.
- Next backend for DeveloperAutoConnect: localhost-only.
- Tailscale Funnel: disabled; only structural `AllowFunnel: true` means enabled.
- Default external runner mode: read-only `DeveloperAutoConnect`.
- The manual one-time connection-code fallback remains available.
- Normal flow dependency on localhost:3000: none.
- Production access and mutation: blocked by default.

Do not record live PID, port ownership, temporary origin, connection code, session/cookie, full identity hash, credentials, or full WorkOrder UUID in this tracked snapshot.

## Latest verification baseline

Alpha.48 delivery completed with:

- Canonical Verify: PASS.
- Contract summary: `53 passed / 0 failed`.
- Mutation audit: `203 findings / high-risk 0`.
- TypeScript, targeted ESLint, Next build, and Expo Doctor `19/19`: PASS.
- External cellular iPhone material Read and UI conformity: PASS.
- Business/DB/material/revision/event/receipt/R2/PDF/token/production/native/EAS delta: zero.

Alpha.49 is documentation and development-infrastructure only. It requires no mobile runner or physical-device QA. Its final Verify, contract summary, mutation audit, Git identity, and handoff metadata are recorded in the alpha.49 evidence and matching repo-state.

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

Older facts remain in their numbered evidence. They are not recopied here.

## Next candidate boundary

Candidate: `2.0.0-alpha.50` — draft material basic editing.

Potential Delta scope:

- material-line add/edit/delete only after actual API and policy audit;
- explicit save, entity/expected version, conflict, and dirty-state guard;
- order request/cancel/complete remains a separate later Version Delta;
- production, native/EAS, broad cleanup, and unrelated feature expansion remain excluded unless explicitly named.

The alpha.50 owner work order should be a short Version Delta that references the Permanent Rules instead of repeating them.
