# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.61`
Status: `ALPHA61_FINALIZATION_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.61 entry HEAD/origin | `67f4f49884666429ca29c7b0571f907c168b5f8b` |
| Entry commit | `feat: WAFL v2 alpha.59 작업지시 입력과 수량 UX 완성` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.61` |
| Mobile package version | `2.0.0-alpha.61` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.61 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-push alpha.61 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.61.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.61-<actual timestamp>.txt`.
- `4. Newest` must contain only that matching pair after Finish.
- The accepted handoff is the matching alpha.61 ZIP/repo-state pair generated from the final synchronized pushed HEAD.

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

Alpha.61 completes mobile WorkOrder creation and DeveloperAutoConnect finalization without dependency, schema/migration, native/EAS, R2, PDF/token, or production changes:

- mobile users can create a tenant-scoped editable draft through the canonical WorkOrder command boundary, then add a size, a color, and a quantity cell while preserving expected-version, idempotency, Receipt/Event, and draft-only guards;
- create validation and UI policy share typed canonical owners rather than duplicating API, list, and form behavior;
- the alpha.47 DeveloperAutoConnect path dynamically resolves the current Tailscale IPv4 for Metro advertisement, manifest launch, and development-client launch selection; Windows LAN IPv4 advertisement is a READY failure;
- physical iPhone product QA and a close/reopen automatic DeveloperAutoConnect check passed without manual URL entry or a `192.168.*:8081` selection;
- the exact isolated owner QA WorkOrder was removed in one bounded transaction with mutable residual zero; its Event/Receipt evidence was preserved and all Receipt references were detached by `company_id + command_code + idempotency_key`.

Alpha.60 completes conditional hard delete for eligible WorkOrder-local draft children without dependency, schema/migration, native/EAS, R2, or production changes:

- eligible WorkOrder-local size, color, fabric, and accessory rows in an editable unissued draft use conditional hard delete; normal mobile deletion no longer creates a new archive tombstone;
- size/color deletion physically removes dependent quantity cells and synchronizes the WorkOrder and Revision total from the surviving matrix sum in the same transaction;
- requested, cancelled-after-request, completed, issued-revision, and legacy archived rows remain protected through Revision/Event and order-history rules;
- system/company/master library lifecycle remains separate from WorkOrder-local draft deletion and is not mutated by this flow;
- the legacy material archive schema and routes remain bounded compatibility debt and are neither purged nor dropped;
- the shared-architecture working rule has one canonical Permanent Rules owner in `09a`, with its canonical contract; alpha.51 and alpha.56 evidence remains immutable historical evidence.

The single automated Runtime, owner-approved equivalent isolation gate, Node 24 Canonical Verify, and physical-iPhone QA all passed. The exact owner QA fixture was captured in its accepted final state and removed by one exact isolated cleanup transaction with mutable residual zero while append-only Event/Receipt evidence was preserved.

Alpha.59 extends the completed alpha.58 size/color read-only baseline without a schema migration, dependency/native change, or production mutation:

- draft WorkOrders support tenant- and permission-guarded size, color, and quantity commands with expected-version conflict handling, idempotency, stable IDs, deterministic automatic sorting, and matrix-derived integer total-quantity projection;
- size and color editing uses compact paired actions, sequential immutable multi-add queues, direct color palette selection, stable row selection, and parent/child editor lifecycle that keeps the parent session open after row or palette work;
- production quantity cells update the matrix, WorkOrder total, and revision snapshot transactionally while unchanged saves remain no-ops and finished measurements remain read-only;
- shared circular option reels preserve finite canonical identities, recenter without duplicate callbacks, and support target, category, size, color, and material/accessory unit choices;
- material and accessory names, color/options, usage areas, memos, and unit prices use same-position inline sessions with exact owner identity, stale-blur rejection, submit/blur dedupe, and server-value recovery;
- material required quantity and allowance use quarter-decimal composition while order quantity and amount formulas remain unchanged;
- mobile overview input, cost/image/memo presentation, caret behavior, compact size/color actions, and exact `색상×사이즈` and `완성 치수표` labels are aligned with the shared WAFL interaction grammar;
- read-only WorkOrders retain the accepted `3/3/9/5/15` projection and receive no add, drag, reorder, command, or allowlist action;
- Runtime evidence verified 63 requests, 37 accounting steps, matrix totals `0→3→8→15→16`, Metro manifest/bundle `200/200`, zero fatal aggregation, exact isolated-fixture cleanup, and zero user/migration/R2/production mutation;
- owner physical-iPhone QA accepted the final inline-session, nested editor, caret, circular-reel, matrix-total, and read-only behavior with the result `잘 된다.`;
- alpha.59 adds no size/color archive/restore, fractional total quantity, finished-measurement editing, company color library, Factory scope, schema/migration, dependency/native/EAS change, R2 mutation, or production access.

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
- Alpha.59 mobile WorkOrder input expansion, quantity matrix, and editor lifecycle: `docs/project/app-v2/59-mobile-work-order-input-expansion-evidence.md`.
- Alpha.60 draft-child hard delete and shared-architecture completion: `docs/project/app-v2/60-draft-child-hard-delete-and-shared-architecture-evidence.md`.
- Alpha.61 mobile WorkOrder create and DeveloperAutoConnect finalization: `docs/project/app-v2/61-mobile-work-order-create-and-runtime-autoconnect-evidence.md`.

Older facts remain in their numbered evidence. They are not recopied here.

## Current completion boundary

Current completed result: `2.0.0-alpha.61` — mobile WorkOrder creation, physical-iPhone product QA, verified DeveloperAutoConnect, exact fixture cleanup, version synchronization, and finalization are complete.

Candidate: `2.0.0-alpha.62`

This candidate value is routing metadata only. Alpha.62 design and implementation are not started, and the candidate field grants no product authority.

Potential future packages remain separate owner decisions:

- finished-measurement editing with explicit cm/inch persistence and a system size/POM snapshot connection.

Alpha.61 does not include that adjacent candidate. No next-version design or implementation has started; every later package requires its own owner-approved Delta.
