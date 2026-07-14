# WAFL v2 Alpha.39 Controlled Viewer Security Evidence

Status: `ALPHA39_CONTROLLED_VIEWER_SECURITY_PASS`

## Baseline and boundary

- Baseline APP_VERSION: `2.0.0-alpha.38`
- Baseline HEAD: `0551807aed3a8d23fb9bb85ddcfe9b0b3379bc7a`
- Result version: `2.0.0-alpha.39`
- Approved dev/test fingerprint: `01e5dcc7fea3`
- Current migration ledger: `11/11`
- Retained source: alpha.38 generated immutable PDF, 130,332 bytes, SHA-256 `9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2`
- Migration 011 was applied once under its prior approval. The separately approved token runtime was invoked exactly once after the runtime-ready checkpoint; no migration replay, generated-document mutation, R2 mutation, cleanup, or production access occurred.

## Migration 011

- File: `db/v2/migrations/011_v2_document_access_viewer_functions.sql`
- SHA-256: `8cb34bcb819531043bcda26f89fa7f70ad02e1c4b134a30407c83ff7e871f251`
- Adds only `wafl_v2_redeem_document_access_token(char(64), text)` and `wafl_v2_read_document_access_session(uuid, uuid)` plus bounded function ACLs.
- Both functions are SECURITY DEFINER with `search_path = pg_catalog, public`; PUBLIC EXECUTE is revoked and only `wafl_v2_tenant_runtime` receives EXECUTE.
- The redeem function performs exact hash lookup, active/generated checks, atomic access increment, and the first `pdf.share_viewed` event in one transaction. Invalid states return no row.
- The session-read function revalidates token/document state without incrementing access count.
- No table, column, index, policy, backfill, destructive SQL, dynamic SQL, or production operation is present.

## Token, viewer, and cookie contract

- Raw links use HMAC-SHA-256 under namespace `document-share-token:v1`; the 32-byte output is 43-character base64url and contains no UUID, tenant ID, JSON, or signed R2 URL.
- DB persistence is SHA-256 lowercase hash only. Token row IDs continue to use PostgreSQL `DEFAULT gen_random_uuid()`.
- Viewer URL is `/v#t={opaque-token}`. The fragment is read in the browser, exchanged by bounded POST, and removed after success.
- The viewer cookie is HttpOnly, SameSite=Lax, HTTPS Secure, path-bounded, signed under a viewer-only namespace, and limited to 15 minutes or remaining token lifetime.
- Public errors are one generic `NOT_FOUND`; response payloads omit UUIDs, token IDs/hashes, company IDs, object keys, signed URLs, renderer details, and snapshots.
- PDF inline/download revalidates the active token for every request and performs a server-side R2 GET with expected size/SHA/header validation. PUT, DELETE, redirect, and public bucket access are absent.

## Internal sharing and lifecycle

- Internal list uses `workorder.read`; create/revoke/rotate use `workorder.update`. Company scope comes from the authenticated membership and no client company ID is accepted.
- Create reserves an idempotency receipt, verifies request SHA, loads a generated document under tenant RLS, inserts one DB-UUID token row, appends `pdf.shared`, and links the existing generated document result.
- Revoke is idempotent and appends `pdf.share_revoked` only on the first update.
- Rotate locks the old token, revokes it, inserts one DB-UUID replacement with `rotated_from_token_id`, and appends revoke/shared events in one transaction. The HMAC-derived replacement supports safe replay without persisting raw token material.
- History returns metadata/status/access count/last access only. A raw link and its QR remain client memory only after create/rotate.

## QR contract

- Repository-owned TypeScript implements QR Code Model 2 byte mode, ECC M, versions 1-10, Reed-Solomon blocks, all eight masks, deterministic selection, and a four-module quiet zone.
- The SVG contains only the encoded viewer URL modules; it has no text copy of the token, external image, font, API, or package dependency.
- Deterministic matrix/SVG generation passes static execution. Physical phone-camera decoding remains user QA and is not reported as complete.

## Runtime budgets and approval gates

Migration approval budget:

- ledger `10/10 -> 11/11`
- functions `+2`
- function ACL changes only
- table/column/index/data/R2/production delta `0`

Separate token runtime budget after post-apply audit:

- token rows `+2`
- token updates `3` (token A access, token A revoke, token B access)
- domain events `+5`
- generated document mutation `0`
- R2 GET `3`, PUT `0`, DELETE `0`
- production mutation `0`

Migration and token runtime are single-attempt operations. Failure requires bounded read-only audit and Failure Handoff; automatic retry, cleanup, rollback, new PDF generation, or object mutation is forbidden.

## Approved runtime and completion result

- Result: `ALPHA39_CONTROLLED_VIEWER_SECURITY_PASS`; completion: `ALPHA39_DOCUMENT_VIEWER_READ_ONLY_AUDIT_PASS`.
- Baseline token/share-receipt/share-event was `0/0/0`. Final retained delta is document access tokens `+2`, share receipt `+1`, receipt result link update `1`, token updates `3`, and domain events `+5`.
- Token A exchanged successfully, served inline and download PDF responses, then was revoked by rotation. Token B was linked by `rotated_from_token_id`, exchanged successfully, served the PDF, and remains active. Final access counts are `1/1`.
- Same-key replay returned the existing token with row/update/event/R2 delta zero. A changed request SHA was rejected, invalid and revoked tokens returned generic NOT_FOUND, and Company B/H/C could not access Company A's document/token boundary.
- R2 GET count was exactly `3`; PDF size `130,332` and SHA-256 `9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2` matched. R2 PUT/DELETE, generated-document mutation, and Worker mutation were zero.
- The cookie runtime contract verified HttpOnly, SameSite=Lax, bounded path, and Max-Age. Secure is enforced by the production/HTTPS policy and static contract; the approved runtime used local HTTP and did not access production.
- Raw tokens stayed in process memory and bounded HTTP bodies only. DB schema has hash-only persistence, runtime logs contain no raw token/viewer URL, and external payload checks found no generated-document UUID, R2 key, signed URL, company ID, or token hash.
- Completion audit confirms incomplete receipt `0`, partial mutation `false`, and production mutation `false`. Receipt, Token A/B, events, and the retained alpha.38 PDF remain in approved dev/test for follow-up evidence.
- Runtime log: `runtime-alpha39-document-viewer-bounded-20260714-184759.txt`.
- Completion audit log: `runtime-alpha39-document-viewer-readonly-completion-20260714-184950.txt`.
- The first completion-audit wrapper attempt used a noncanonical confirmation string and stopped before DB connection. Only the `.tmp` wrapper was corrected; the mutation runtime was not rerun.

## Static evidence

- Root TypeScript: PASS
- Mobile TypeScript and Expo config: PASS
- Targeted ESLint for alpha.39 source: PASS
- Next build: PASS
- Migration schema contract: PASS
- Alpha.39 viewer security contract: PASS
- PowerShell parser: PASS
- `git diff --check`: PASS
- Migration read-only preflight: PASS on fingerprint `01e5dcc7fea3`; ledger `10/10`, migration 011 unapplied, and both proposed functions absent before apply
- Approved workflow Verify (`automation-infrastructure`): PASS after runtime evidence/version synchronization, changed fingerprint `51362b5628b3ce97f769a717c9ca6e6aa2cf344b3cafe331e25f891b7050f20c`
- Mutation audit: 202 findings, high-risk 0
- Verification log: `verify-safe-automation-infrastructure-20260714-185546.txt`
- Read-only runtime preflight: PASS, fingerprint `01e5dcc7fea3`, ledger `11/11`, token/share-receipt/share-event baseline `0/0/0`, R2 GET `0` with accepted prior integrity evidence
- Preflight log: `runtime-alpha39-document-viewer-readonly-preflight-20260714-184741.txt`
- Runtime-ready Approval Handoff: `peacebypiece-checkpoint-2.0.0-alpha.39-runtime-ready-20260714-175331.zip`, SHA-256 `d3912da559df89f667307475f84638faf7b35ae71327982ec1d14e8eb0555ac0`

## Route alignment and server readiness

- The first bounded token runtime invocation reached no mutation route. Next reported the server process ready but returned HTTP 500 for `/v` because sibling routes used different dynamic slug names, `[documentNumber]` and `[generatedDocumentId]`, under `/api/v2/work-orders/documents/`.
- The filesystem routes now share `[documentRef]`: `/api/v2/work-orders/documents/[documentRef]/preview-target` and `/api/v2/work-orders/documents/[documentRef]/access-tokens`. The external URLs are unchanged.
- Preview aliases `params.documentRef` to the existing display document number resolver. Access-token routes alias it to `generatedDocumentId`; the existing native UUID validation and generic error mapping remain unchanged.
- Next build reports all four Preview/access-token handlers under the single `[documentRef]` route segment, with dynamic slug conflicts `0`.
- Readiness used the bundled Node runtime with `next start -H 127.0.0.1 -p 2371`. `GET http://127.0.0.1:2371/v` returned HTTP `200` on both observed probes; probe-level readiness was `1,040 ms`, Next reported `Ready in 127ms`, child exit before ready was false, and stderr was empty.
- Runner readiness remains bounded at 30 seconds with 250 ms polling, drains child stdout/stderr, records first/last HTTP status, and fails on non-zero child exit or terminal route-manifest conflict. Before diagnosis it used 60 seconds without the same bounded process/status evidence.

## Alpha.38 historical correction

The alpha.38 final repo-state's dedicated alpha.38 section was accurate, but common summary fields incorrectly implied no migration/schema/R2 mutation. Alpha.39 generator logic now records the factual history: approved dev/test migration 010 applied once, ledger 10/10, additive UUID/FK schema mutation true, R2 PUT exactly one, retained R2 object one, and production mutation false. Existing alpha.38 final artifacts are preserved.

## Next boundary

Alpha.39 is complete at `ALPHA39_CONTROLLED_VIEWER_SECURITY_PASS`. Alpha.40 owns QR inclusion in a new immutable PDF generation and broader document lifecycle work. The retained alpha.38 PDF and alpha.39 token evidence must not be overwritten, replayed, cleaned up, or promoted to production without a new exact approval.
