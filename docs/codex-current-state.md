# WAFL Current Baseline

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.62`
Status: `ALPHA62_FINALIZATION_COMPLETE`

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.62 entry HEAD/origin | `0681652b7c349bd4b73885e7bd3b3b7bb8a41cb3` |
| Entry commit | `feat: WAFL v2 alpha.61 mobile WorkOrder create` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.62` |
| Mobile package version | `2.0.0-alpha.62` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.62 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-push alpha.62 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.62.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.62-<actual timestamp>.txt`.
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

Alpha.62 completes finished-size specification standards, Maker authoring UX, and the
shared mobile input/projection architecture on the alpha.61 baseline:

- additive dev/test migrations `014` and `015` provide system/company versioned size-spec
  templates, independent WorkOrder revision snapshots, persisted cm/inch units and exact
  1/8-inch values, plus same-company reusable size/color options; the applied ledger is
  `15/15`, with no production migration or mutation;
- WorkOrder Size is the only finished-spec size source of truth. System and user-saved
  templates fill only matching sizes, snapshot edits remain independent, and template
  save/update does not reload the WorkOrder matrix/spec projection;
- Maker mobile authoring uses shared typed owners for reels, V/X sheets, semantic choices,
  option grids, nullable normalization, focus transition, serialized mutations,
  command-scoped pending, size/color staged batch selection, projection promotion, and
  paired fabric/accessory copy;
- alpha.60 conditional hard delete and history protection remain intact while size/color
  batch removal, linked quantity cleanup, finished-spec synchronization, and surviving
  matrix totals execute in one tenant-scoped transaction;
- repeated always-mounted vendor/inch reel reopen, set-cell/unit projection reconciliation,
  bounded template apply/save/update refresh, Unicode attachments, material lifecycle, and
  DeveloperAutoConnect passed targeted, isolated Runtime, and owner physical-iPhone QA;
- owner final approval is recorded without modifying or deleting the owner QA fixture.

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
- Alpha.62 size measurement standards, saved specs, Maker authoring, and shared mobile architecture: `docs/project/app-v2/62-size-measurement-standards-templates-evidence.md`.

Older facts remain in their numbered evidence. They are not recopied here.

## Current completion boundary

Current completed result: `2.0.0-alpha.62` — size measurement standards/templates,
Maker authoring and shared input/projection architecture, automated Runtime, owner
physical-iPhone QA, version synchronization, and finalization are complete.

The detailed paragraphs below preserve the accepted alpha.62 implementation checkpoints
that led to finalization. Their interim `NOT_EXECUTED` device labels describe those earlier
checkpoints only; the owner subsequently completed and approved the final physical-iPhone QA.

The owner-approved alpha.62 implementation now provides system/company size-spec
templates, independent WorkOrder revision snapshots, persisted cm/inch units, exact
1/8-inch input, mobile apply/save/edit workflows, and bounded dev/test Runtime support.
The measurement UX/structure remediation keeps the finished-spec card open across
unit saves, uses validated decimal cm input and the canonical two-reel integer/eighth-inch
picker, normalizes the canonical POM labels to `총장` / `가슴단면` / `어깨너비`, and exposes
exact source-template `수정됨` state. WorkOrder Size is the only finished-spec size source of
truth: reads project that exact ordered set, template apply fills only the normalized size
intersection, and WorkOrder size create/rename/reorder/delete synchronizes stored spec rows
inside the same command transaction. Spec-only size add/exclude is removed. Current
size/color user wording is `삭제`; hard-delete domain semantics remain unchanged.

The integrated UX/performance remediation replaces the persistent template list with the
compact `스펙 불러오기` flow grouped as `WAFL 추천` and `회사 스펙`, adds explicit
new-template versus immutable new-version save choices plus same-company rename/disable,
and uses the shared outer V/X confirmation grammar. Representative command responses now
carry route/guard/product/DB/statement timing in the approved dev/test Runtime. Mobile
reconciliation reuses authoritative command results and limits blocking follow-up reads to
the projection actually replaced. The measured structure/measurement scenarios dropped
from roughly 2.4–3.0 seconds to roughly 1.0–2.0 seconds while retaining conflict fallback.

The latest bounded remediation replaces both binary template-source and company-save-mode
reels with explicit semantic buttons. Actual system/company templates remain readable
metadata cards. The common iPhone size/color delete `not_found` was traced to two transport
boundaries: the alpha.62 external-QA allowlist omitted item DELETE, and the route still used
the alpha.60-only generic draft-child guard. A dedicated canonical size/color hard-delete
guard now accepts alpha.60 or alpha.62. The same narrow composition is applied to eligible
material hard delete, while archive/restore remains excluded from alpha.62.
The existing alpha.60 physical-delete, linked-quantity cleanup, total synchronization, and
historical-protection repository behavior is unchanged.

Product-equivalent automated Runtime passes template intersection apply/replay, immediate
local cm/inch display with persisted unit, cell/structure modified state, WorkOrder-size SOT
create/delete synchronization, exact reapply reset, fabric/accessory create/patch/order and
eligible hard delete, Korean POM projection, Event/Receipt accounting, and exact
cleanup, including immutable company-template v1 preservation and active v2 selection. A first verification fixture exposed a `text = uuid` source-template read join;
the join now uses the schema-accurate explicit text boundary, and that failed isolated
fixture has zero mutable residual with Event/Receipt evidence preserved. Canonical Verify
passes on the final changed fingerprint. The owner fixture was not changed by this remediation and is currently a draft at version 53
with one cm snapshot, matrix XS/S/M/L/XL/2XL/FREE/테스트사이느, two measurement values, zero
generated documents, and zero public tokens. Owner physical iPhone UX/structure re-QA is
`NOT_EXECUTED`.

The Maker-authoring remediation also verifies the complete mobile mutation
composition for basic fields, size/color/quantity, fabrics/accessories and order lifecycle,
images, attachments, and alpha.62 spec commands. Direct-created size/color values are
same-company reusable catalog options with exact unused deletion or historical-use
deactivation. Mobile material authoring now exposes the canonical same-company partner
picker and maps missing partner and positive-price readiness failures to actionable user
messages. The current shared-input remediation moves nullable text and numeric changed-value
comparison into one typed pure commit-decision owner used by overview, factory memo, and the
paired fabric/accessory editor. Omitted fields remain unchanged, explicit empty text persists
as the canonical clear state, changed blur issues one logical mutation, and unchanged blur
issues none. Unit and inch input share the flat WAFL reel; the rich same-company partner list
uses the shared WAFL InputSheet and V/X grammar. Draft material creation requires a positive
needed quantity and a unit while partner and price stay optional until external-order
readiness. Attachment acquisition normalizes iOS percent-encoded names to NFC and proves an
exact Korean filename JSON/upload/read round trip.

Isolated Runtime proved image/attachment create-read-delete with exact dev/test file cleanup,
nullable fabric/accessory clear persistence, positive-quantity create rejection, actionable
order readiness, 45 requests, 23 detached append-only receipts, 30 preserved events, and zero
mutable business residual. The preserved owner fixture was read only and is draft/draft at
version 82/82 with one snapshot, zero generated documents, and zero public tokens. Owner
physical iPhone shared-input/material UX re-QA remains `NOT_EXECUTED`.

The current batch-selection remediation stages size and color option taps locally. Sheet X
discards the staged set with zero request; sheet V computes one typed set diff and sends one
idempotent batch command. Add-only changes apply directly. A mixed diff asks once about only
the removed product labels and, when applicable, the summed entered quantity removed with
them. The repository validates the complete diff and applies size/color additions, eligible
hard deletes, linked quantity deletion, finished-spec size synchronization, and surviving
matrix totals in one tenant-scoped transaction. Normal user copy contains no cell or
hard-delete implementation language. The same checkpoint standardizes unset overview values
on the shared muted `미지정` display owner, keeps the rich vendor selector in the shared flat
WAFL picker, removes the app-owned numeric submit key, reconciles a successful measurement
unit command without an unrelated projection GET, and uses `사용자 저장 스펙` without exposing
internal template-version labels or policy panels.

The isolated batch Runtime passed local tap/cancel request counts of zero, five batch applies,
one replay, one transaction per changed command, 30-unit size consequence cleanup, 70-unit
color consequence cleanup, finished-spec synchronization, total recalculation, exact fixture
cleanup, and append-only Event/Receipt preservation. Canonical Verify passes under Node
24.14.0 on the final changed set.
The preserved owner fixture remains uniquely owned, draft/draft at version 113/113, with one
snapshot, zero generated documents, and zero public tokens. Owner physical iPhone batch and
saved-spec re-QA is `NOT_EXECUTED`.

The latest bounded iPhone remediation makes the existing target selector and the
metadata-bearing vendor selector share the canonical WAFL scroll/reel option owner. Option
presentation is flat and non-circular, keeps long names readable, and preserves staged X/V
semantics. Equivalent overview and material inline fields use one typed focus-transition
policy and one serialized mutation queue: tapping the next field focuses it immediately,
while a changed or explicitly cleared prior field saves once in entity-version order and an
unchanged prior field performs no mutation. Measurement-unit persistence now owns only its
command-scoped pending state; Size/Color staging remains available and a following command
queues behind the authoritative returned version without a blocking follow-up GET. Size and
Color share one accessible compact option-grid primitive, with four- and three-column default
layouts respectively and separate registered-option sections. User-created template source
copy is now `사용자 저장 스펙` and internal template versioning remains hidden and intact.
The exact owner fixture remains preserved and read-only audited at draft/draft version 127/127,
with zero generated documents and zero public tokens; physical iPhone focus/pending/grid
re-QA is `NOT_EXECUTED`.

The final architecture-cleanup checkpoint routes target and vendor selection through the
same canonical `single-choice-reel` render policy and actual reel column; the rejected
flat-card/list option branch and its adapter are absent. Successful cm/inch persistence now
promotes the current valid matrix/spec bundle to the authoritative next-version cache key
before reconciling the WorkOrder entity version. This prevents the controller effect from
treating that version as not loaded: size-color GET `0`, size-spec GET `0`, unrelated reload
`0`, and unrelated controls remain enabled. Sheet V/X, two-way semantic choices, exact
pending scope, inline transition/queue, and low-level mobile transport each have one typed
owner. Broader domain API-client splitting and wholesale top-level experience decomposition
remain bounded debt because their current cross-feature composition is not equivalent
lifecycle code and a speculative rewrite would increase final-QA risk. Isolated size-spec,
batch-selection, and Maker-authoring Runtime suites passed with exact cleanup. The preserved
owner fixture was read-only audited at draft/draft version 140/140, one snapshot, zero
generated documents, and zero public tokens. Owner physical iPhone final QA is
`NOT_EXECUTED`.

The display version is `2.0.0-alpha.62`. Alpha.62 is finalized at
`ALPHA62_FINALIZATION_COMPLETE`; final Git and artifact identities are owned by the matching
post-push repo-state. The owner QA fixture remains preserved and finalization mutated it `0`
times. Factory, production, and alpha.63 scope are not started by this completion.

Next candidate: `2.0.0-alpha.63`.

Candidate: `2.0.0-alpha.63`

Status: `NOT_STARTED`. No alpha.63 product scope, mutation, migration, Runtime, or delivery
authority exists until a separate owner-approved Version Delta defines it.
