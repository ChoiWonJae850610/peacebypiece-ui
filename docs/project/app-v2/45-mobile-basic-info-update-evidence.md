# Mobile ProductionCard Basic Info Update Evidence

Version: `2.0.0-alpha.46`

Status: `ALPHA46_MOBILE_BASIC_INFO_UPDATE_COMPLETE`

## Baseline and delivered scope

- Baseline is pushed alpha.45 commit `9267ff203132c5c1cc9d5a9c9ee8442531cfd58a`, with the accepted ProductionCard overview and installed ATS-corrected iOS Development Build number 1.
- Alpha.46 delivers the first bounded mobile business-data write: product name, due date, and total quantity on a current draft WorkOrder and draft current revision.
- Save is explicit and changed-fields-only. The client sends `expectedVersion` plus a bounded `clientRequestId`; the server remains authoritative for tenant/RLS scope, `workorder.update`, draft locks, concurrency, version transitions, and the domain event.
- Product type, season, item code, materials, processes, revision issue, PDF/token, R2, migration/schema, production, native dependencies, EAS Build, and EAS Update remain outside scope.

## Exact Command and external boundary

- The default external QA runner remains read-only. The exact alpha.46 basic-info approval is excluded from the generic approval set and is injected into the Next child only when the explicit bounded switch is used.
- Metro receives no Command environment. No tracked env file or persistent process/user/machine environment is written.
- External PATCH is admitted only for the exact non-production Quick Tunnel host, method `PATCH`, and one canonical PostgreSQL UUID core-detail pathname. Collection POST/PATCH, arbitrary `/api/v2/*`, materials, processes, revisions, lazy paths, and OPTIONS remain blocked.
- Create retained its historical alpha.25 approval and was used only by a separate owner-approved bounded synthetic-draft runner. The alpha.46 mobile approval does not enable create, material, process, or revision commands.

## Mobile editor and recovery UX

- Edit is visible only when WorkOrder and current revision are both `draft` and the current session has `workorder.update`; issued/finalized cards remain read-only.
- Validation covers product name 1-200 characters, optional real `YYYY-MM-DD` calendar date, and integer quantity 0-100,000,000.
- Success performs one PATCH, one detail GET, verifies `nextVersion`, replaces detail state, and synchronizes the loaded list item locally without a list GET.
- Saving, saved, validation, conflict, locked, and generic error states are explicit. Duplicate save taps are blocked.
- Back, card switch, list refresh, disconnect, and cancel share the dirty confirmation. `계속 편집` retains input; `변경사항 버리기` restores the saved model.
- Autosave, automatic retry, polling, silent overwrite, and automatic full-list refetch are absent.

## Synthetic `QA_DRAFT_A` approval and creation

The first `BEGIN READ ONLY` candidate audit found no safe existing Company A draft: all 503 cards were issued/finalized. The owner separately approved one retained synthetic draft with exact initial values:

- product name: `QA 기본정보 저장 검증 A - 저장 전`
- due date: `2026-09-29`
- total quantity: `136`
- WorkOrder/revision status: `draft/draft`
- WorkOrder/revision entity version: `1/1`

The bounded create executed exactly once. Its response-header assertion was corrected statically before the approved execution; no second create was used.

- WorkOrder row: `+1`
- revision row: `+1`
- receipt: `+1`
- event: `+1`
- generated document/token/R2/PDF/production: `0`
- cleanup/rollback/delete: `0`

## Approved mobile save

The owner separately approved one save to these retained values:

- product name: `QA 기본정보 저장 검증 A`
- due date: `2026-09-30`
- total quantity: `137`

The iPhone Save button was pressed exactly once. The PATCH contained all three changed fields.

- successful PATCH: `1`
- additional successful PATCH: `0`
- changed fields: `productName`, `dueDate`, `totalQuantity`
- WorkOrder/revision entity version: `1→2 / 1→2`
- `work_order.patch_basic_info` event: `+1`
- save receipt: `+0`
- row-count delta: WorkOrder `0`, revision `0`
- cleanup/rollback/delete: `0`

Final read-only DB audit confirms the saved product name, `2026-09-30`, quantity `137`, status `draft/draft`, and versions `2/2`. Target event counts are create `1` and save `1`; the target has create receipt `1` and no save receipt, generated document, token, image, or attachment tie.

## PostgreSQL DATE defect and correction

The database and PATCH were correct, but the first iPhone post-save display showed `2026-09-29`. PostgreSQL `DATE` had been materialized as a JavaScript Date at KST midnight and then serialized with `toISOString().slice(0, 10)`, shifting the calendar value to the preceding UTC date.

The correction keeps PostgreSQL calendar dates as text at SQL/repository boundaries and validates them with one strict date-only helper:

- API contract: exact `YYYY-MM-DD`
- timezone-independent calendar validation
- no JavaScript Date/UTC ISO round-trip
- no global pg parser change
- timestamp/timestamptz ISO datetime mapping unchanged

Final evidence is DB `2026-09-30`, list API `2026-09-30`, detail API `2026-09-30`, and iPhone `2026-09-30`. The user confirmed list/detail equality and that the one-day shift is resolved without another save.

## Stale expectedVersion evidence

The first local audit invocation stopped before HTTP because PowerShell 5.1 misread the UTF-8 preflight JSON; runtime guards rejected execution and all deltas were zero. No stale request was sent.

After separate approval, Node read the UTF-8 checkpoint directly and produced the sole stale HTTP request with the already retained values and old `expectedVersion=1` while current version was `2`.

- stale request: `1`
- HTTP/code: `409 / CONFLICT`
- correlation ID: present, not disclosed
- WorkOrder/revision version delta: `0/0`
- DB/event/receipt delta: `0/0/0`
- generated document/token/R2/PDF/production delta: `0`
- automatic retry/overwrite: `0/0`

## Physical iPhone acceptance

The owner reported the entire instructed QA as PASS:

- connection and `QA_DRAFT_A` open: PASS
- saved product name, due date `2026-09-30`, and quantity `137`: PASS
- list/detail date equality and re-entry persistence: PASS
- dirty input retained across background/re-entry: PASS
- unsaved-change warning: PASS
- `계속 편집` retained the temporary input: PASS
- `변경사항 버리기` restored the saved product name: PASS
- existing issued/finalized card read-only: PASS
- disconnect: PASS
- additional save, crash, red screen, infinite loading, and anomaly: `0`

## Final effects and delivery gates

- retained alpha.46 business effects: one synthetic draft create plus one successful three-field PATCH
- total create/save event delta: `+2`
- total create/save receipt delta: `+1`
- stale conflict mutation: `0`
- R2 PUT/GET/DELETE: `0/0/0`
- PDF/token: `0`
- production access/mutation: `0/0`
- migration/schema: `0/0`
- native dependency/EAS Build/EAS Update: `0/0/0`
- cleanup/rollback/delete: `0/0/0`

Canonical stop ended the three marker-owned cloudflared/Next/Metro processes with ownership skip `0` and released ports 3100/8081. The separately owned localhost:3000 login server and Tailscale service remained running.

Alpha.46 closed at `ALPHA46_MOBILE_BASIC_INFO_UPDATE_COMPLETE` on 2026-07-19 00:54 KST. Final canonical Verify passed with 51 contracts and zero failures. Commit and push completed at `d70b7902623e4a4aeeb7a108b5df9790bd41cbf9`. The final Source ZIP is `peacebypiece-ui-2.0.0-alpha.46.zip`, and its matching state record is `repo-state-2.0.0-alpha.46-20260719-005306.txt`. The repo-state generator did not support every manual-QA field, so the owner-confirmed physical-device results in this document remain authoritative. No temporary origin, internal UUID, credential, session, cookie, raw form payload, or full DB fingerprint is tracked.
