# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.53`
Status: `ALPHA53_MOBILE_ARCHITECTURE_FOUNDATION_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.53 entry HEAD/origin | `509998e13dfb40fbfa99b201de7031074b5203a4` |
| Entry commit | `fix: WAFL v2 모바일 숫자 입력과 인라인·납기 UX 완성` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.53` |
| Mobile package version | `2.0.0-alpha.53` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.53 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-commit alpha.53 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.53.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.53-<actual timestamp>.txt`.
- `4. Newest` must contain only that matching pair after Finish.
- The previous accepted handoff is the matching alpha.51 ZIP/repo-state pair recorded in its repo-state.

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

Alpha.53 preserves the accepted alpha.52 mobile behavior while establishing bounded extension points:

- `MobileWorkOrderApp.tsx` is a composition shell; list, overview, and material views live in feature boundaries;
- session, navigation/app lifecycle, work-order query, explicit mutation gating, and API gateways have application owners;
- mobile-safe DTO/error contracts, business validation, editability policy, number/money/quantity/date formatting, material cache, and WAFL theme tokens have pure bounded owners;
- known API errors use an explicit union; unknown server codes remain distinct raw diagnostics and are not treated as known codes;
- domain/contract modules import no React Native, Next, DB, filesystem, environment, R2, or PDF implementation;
- behavior tests cover numeric/date formatting, validation, editability, navigation/session/query state, explicit-save request count, duplicate submit, and dependency direction instead of relying only on source location;
- default DeveloperAutoConnect Runtime remained read-only; physical-iPhone regression passed with Check/save `0`, business/schema/R2/PDF/token/production/native/EAS delta `0`, and canonical stop PASS;
- Permanent Rules now require measured PC-resource and remote-operation audits at durable checkpoints without service restart, cleanup, kill, reboot, or monitoring-tool installation.

The retained user behavior remains:

- customer copy and list density use the WorkOrder (`작업지시서`) grammar with search/status filtering and no default long document/revision metadata;
- overview product name, total quantity, and due date plus supported active-draft material values use same-position inline editing with explicit X/Check, dirty guard, expectedVersion, canonical refresh, and automatic-save `0`;
- archived, ordered/locked, non-draft, revision/status, order quantity, amount, and other calculated values remain read-only;
- narrow numeric rows expand within the card, exact-field focus uses measured keyboard-safe scroll, and the due-date picker is a compact single-source bottom sheet with date-only preservation and reopen `0`;
- canonical order quantity/amount calculations, decimal/currency formatting, and numeric leading-zero correction are shared and bounded; canonical zero becomes an empty edit draft so first input `5` renders `5`, not `05`;
- user exploratory saves were fully attributed with unique event/request identity. Final retained dev/test versions are WorkOrder/revision/material `34/34/14`, event/receipt `67/26`, migration ledger `13/13`;
- the final read-only preflight had successful business mutation `0`; production, R2/PDF/token, schema, native, and EAS effects remained `0`;
- physical-iPhone list/inline/calendar/narrow-field/numeric acceptance and canonical runner stop passed within the recorded evidence scope.

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
- Alpha.52 mobile core inline UX, calculation, list, and date: `docs/project/app-v2/51-mobile-core-inline-ux-calculation-list-date-evidence.md`.
- Alpha.53 mobile architecture foundation: `docs/project/app-v2/52-mobile-architecture-foundation-evidence.md`.

Older facts remain in their numbered evidence. They are not recopied here.

## Next candidate boundary

Candidate: `2.0.0-alpha.54` — mobile Reel Picker production implementation on the alpha.53 feature/controller/formatter boundaries.

Potential Delta scope:

- use the alpha.53 number/unit/formatter and application-controller boundaries rather than adding picker logic to the composition shell;
- define exact field, value/step/unit model, fallback input, accessibility, visual, device-QA, dependency, and native/EAS boundaries in a separate owner-approved Delta;
- preserve existing API and explicit-save semantics unless that Delta explicitly changes them;
- keep material order request/cancel/complete as a separately approved alpha.55 candidate.

The alpha.54 owner work order should be a short Version Delta that references the Permanent Rules instead of repeating them.
