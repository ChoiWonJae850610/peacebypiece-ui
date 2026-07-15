# 2.0.0-alpha.42 Realistic Issued Embedded QR PDF Evidence

Status: `PARTIAL_MUTATION_CONFIRMED_PENDING_PDF_RENDER_READINESS`

## Baseline and current boundary

- Baseline version: `2.0.0-alpha.41`
- Baseline HEAD: `15d2c014aaf671120f1ad6724adfd83c104711f9`
- Target version after all approved runtime stages pass: `2.0.0-alpha.42`
- Approved dev/test fingerprint: `01e5dcc7fea3`
- Current migration ledger: `12/12`
- APP_VERSION remains `2.0.0-alpha.41` while the retained pending document is completed through separately approved continuation stages.
- Migration 012 was applied exactly once on approved dev/test fingerprint `01e5dcc7fea3`; post-apply read-only audit passed with existing tokens `2`, `manual_share` `2`, and `embedded_qr` `0`.
- The corrected runtime read-only preflight passed exactly once. It used the approved process-only viewer origin and sanitized R2 fingerprint matches `3/3`; DB write, R2 request, Worker execution, and production access were all `0`.
- The approved runtime retained one issued/finalized WorkOrder and revision at version `2/2`, one representative PNG object, one pending generated document, and one unused embedded-QR token. Receipt/event counts are `3/2`; incomplete receipt count is `0`.
- Generated-document storage key, PDF size, PDF SHA-256, and generated timestamp remain null. The planned PDF object is absent. R2 DELETE, Worker execution, and production access remain `0`.

## Token-purpose migration result

`012_v2_document_access_token_purpose.sql` adds only:

- `document_access_tokens.token_purpose text NOT NULL DEFAULT 'manual_share'`
- one named CHECK allowing `manual_share` and `embedded_qr`
- one partial unique index on `(company_id, generated_document_id)` where purpose is `embedded_qr`

The index makes the one-embedded-token-per-generation rule permanent even after expiry or revoke. Existing alpha.39 tokens remain `manual_share`; no row update, backfill, delete, privilege change, or production apply occurred. The migration SHA-256 is `400d644c7151d9b5282a2d7487367a5acda5f96e896ad2c6f37432de883a52e5`.

## Manual share and embedded QR contracts

- Manual share retains default 7 days, maximum 30 days, list/create/revoke/rotate behavior, and manual-only action lists.
- Embedded QR uses 365 days and the internal command `work_order.document.embedded_qr.create`.
- The raw token is an HMAC-SHA-256 base64url opaque value derived only after PostgreSQL returns the generated-document UUID.
- DB storage is SHA-256 hash only. Raw token, token hash, full viewer URL, and QR SVG are forbidden from generated-document snapshot, logs, manifests, repo-state, handoff ZIP, and domain-event metadata.
- Embedded-token insert shares the generation prepare transaction with pending generated-document insert and receipt linkage.
- Existing public viewer redemption remains purpose-neutral, while internal manual-share list/rotate/revoke repositories explicitly scope to `manual_share`.

## Realistic issued fixture plan

The deterministic identity is `legacy_source_id = wafl-v2-alpha42-realistic-issued-v1`; it is internal and not displayed. All entity IDs use PostgreSQL `DEFAULT gen_random_uuid()` and `INSERT ... RETURNING id`.

- Product: `리넨 라운드 셔츠 원피스`, women one-piece, season `26FW`, item `O-LNDRS`, due `2026-08-15`
- Factory delivery: `성수 어패럴` plus six production instructions
- Colors/sizes: IVORY, NAVY, BLACK by S/M/L; 9 cells and total 144
- Materials: 2 fabrics and 4 accessories
- Size specification: 1 spec, 3 size rows, 5 POMs, 15 values
- Processes: cutting, sewing, washing, inspection/packing; 4 rows
- Representative image: repository-owned `public/dev-samples/linen-round-dress-sketch.svg`

Canonical WorkOrder create and revision issue APIs remain responsible for receipt/event/version behavior. The absent Command surfaces for colors, matrix, specifications, processes, and revision-image linkage use one separately approved bounded dev/test fixture transaction while the revision is draft. That transaction creates no receipt/event and does not increment parent versions.

## Immutable snapshot and QR rendering

The PDF source remains `WorkOrderIssuedPreviewReadModel` plus `IssuedWorkOrderDocument`. Snapshot stores only:

- purpose `embedded_qr`
- expiry timestamp
- QR policy version `wafl-embedded-qr/1`
- controlled-fragment viewer-origin policy
- placement version `cover-top-right/1`

Chromium receives the raw viewer URL only in the ephemeral `x-wafl-pdf-embedded-qr` request header. The local-only render route decodes it in server memory, uses the source-owned QR encoder, and passes only SVG/expiry/label to the document component. One 19mm QR appears on the first landscape page; continuation portrait pages retain the alpha.41 page footer and contain no repeated QR.

## Exact post-migration runtime budget

Canonical create:

- WorkOrder +1, draft revision +1, current-revision pointer update +1
- receipt +1, event +1, WorkOrder/revision version `1/1`

Atomic content fixture:

- internal `legacy_source_id` update +1
- materials +6, colors +3, sizes +3, matrix +9
- size spec/spec sizes/POMs/values `+1/+3/+5/+15`
- processes +4, image row +1, revision-image link +1
- receipt/event/parent-version delta 0

Canonical issue:

- receipt +1, event +1
- WorkOrder/revision version `1 -> 2`
- document number +1; new revision and next draft 0

Generation/viewer:

- generation receipt +1, pending generated document +1, embedded token +1
- generated-document finalize update +1
- `pdf.generated` +1, `pdf.embedded_qr_created` +1
- first viewer exchange token update +1 and `pdf.share_viewed` +1
- total receipt +3, total event +5
- R2 PUT: representative image +1 and PDF +1; total PUT 2; R2 DELETE 0
- bounded R2 GET: image absence/verify/render fetch `3`, PDF absence/verify/viewer file delivery `3`, total GET `6`

Generation replay reads the existing receipt/document/token and performs no insert, render, PUT, finalize, or event.

## Runtime plan assertion correction

The first runtime approval was stopped before the child process started because the checkpoint runner declared the correct mutation budget but did not execute five required completion assertions. No DB/R2 request or mutation occurred, and the pre-start Failure Handoff preserves that decision. The corrected runner now fixes the verification plan without changing domain, API, repository, schema, or mutation semantics:

- Generation request-SHA conflict: the same scoped generation idempotency key is replayed with a changed immutable QR policy input. The existing receipt boundary must throw `IDEMPOTENCY_CONFLICT`; a target ledger snapshot must remain identical.
- API conflict mapping: the canonical issue endpoint replays the accepted request and then receives the same Idempotency-Key with a changed issue note. Expected/actual static contract is HTTP `409` with typed code `CONFLICT`, with no receipt/event/version delta.
- Invalid token: a same-length tampered opaque token is exchanged only in memory. Expected/actual static contract is HTTP `404 NOT_FOUND`; the response is checked for token, UUID, company, storage-key, signed-URL, and hash leakage.
- Tenant isolation: Company B/H receive `404 NOT_FOUND`, Company C receives canonical `403 FORBIDDEN`, and direct tenant-role read-only visibility for the target WorkOrder/revision/generated document/token is `0/0/0/0` for B/H/C.
- A30FACT immutability: WorkOrder/revision versions, generated-document identity/status, storage key, size, SHA-256, and two manual-share token status snapshots are compared before and after. The new image/PDF PUT keys must differ from the retained A30FACT key.
- Actual R2 call ledger: helper entry points count every image/PDF GET and PUT. Runtime PASS requires image `GET 3/PUT 1`, PDF `GET 3/PUT 1`, total `GET 6/PUT 2`, and DELETE `0`; no-op/conflict/isolation checks must not change those counters.

The A30FACT R2 object is protected by unchanged DB metadata plus an assertion that no PUT targets its key. It is not fetched again, which keeps the approved total PDF GET budget at exactly three: new-key absence, post-PUT integrity, and viewer delivery.

## Viewer-only continuation readiness correction

The PDF upload/finalize continuation successfully retained the verified PDF object, finalized the existing generated-document row, and appended the two generation events before the public embedded-token exchange returned the external generic `NOT_FOUND`. Static comparison with the proven alpha.39 viewer runtime identified the single startup mismatch: the local Next child inherited the read and mutation approvals but omitted `WAFL_V2_DOCUMENT_VIEWER_ENABLED=1`. The document-access runtime guard therefore returned `document-viewer-disabled`, which the public boundary correctly collapsed to generic `NOT_FOUND`. The failure is classified as `VIEWER_ENVIRONMENT_MISSING`; it was not a port, origin, route-manifest, token, DB, R2, or PDF-integrity failure.

The minimum correction adds a runner-only local viewer server helper. It allocates an ephemeral `127.0.0.1` port, uses the same actual origin for `WAFL_DOCUMENT_VIEWER_ORIGIN` and the one-shot `/v` readiness probe, keeps the canonical repository root as `cwd`, verifies the built `/v` route manifest, passes the existing viewer enable flag explicitly, and preserves typed startup failures and sanitized stdout/stderr tails. It does not change the viewer API, token service, repository, R2 transport, PDF renderer, tenant policy, or production host guard.

The approved viewer-only child is bounded to the retained generated document and embedded token. Its remaining budget is exactly two PDF GETs, one token access update, and one `pdf.share_viewed` event. PDF PUT, generated-document finalize, receipt/document/token insert, image request, R2 DELETE, rerender, issue, and all prior generation events are fixed at zero.

The one approved viewer-only child then consumed that budget exactly. Local Next readiness passed on an ephemeral `127.0.0.1` port, the existing embedded token exchanged once, inline and download each returned the retained `252994`-byte PDF with SHA-256 `0334727646ebc43ab19a88ccb64cf1b5d3b1e91d3ca5438d3ec61a9a9665af37`, and the database retained access count `1` plus one `pdf.share_viewed` event. Cumulative alpha.42 PDF PUT/GET/DELETE is `1/3/0`, finalize update is `1`, generation/view events are `+3`, receipts remain `3`, and incomplete receipts remain `0`.

The child stopped after those effects at the first cross-tenant response-shape assertion. Company B returned the expected HTTP `404`, but the authenticated workspace guard uses the canonical top-level shape `code: WAFL_NOT_FOUND`; the runner incorrectly expected the public viewer shape `error.code: NOT_FOUND`. Company H and Company C requests were after that assertion and were not executed. No retry, extra GET, cleanup, rollback, or delete ran. A bounded `BEGIN READ ONLY` audit confirmed the generated document and token counts at `1/1`, access count `1`, document/token event counts `2/1`, A30FACT unchanged, and production mutation false. The resulting state is `RUNTIME_EFFECTS_COMPLETE_VALIDATION_ASSERTION_FAILED`, not a data or R2 partial-write mismatch. APP_VERSION remains alpha.41 pending a separately approved zero-mutation completion decision.

## Zero-call static completion

The owner accepted the completed runtime effects and fixed every remaining API, DB, R2, token, event, access, render, and migration budget at zero. The response assertion is now endpoint-specific rather than permissive: the public viewer requires HTTP `404` with nested `error.code = NOT_FOUND`; authenticated workspace resource hiding requires HTTP `404` with top-level `code = WAFL_NOT_FOUND`; and the approval-pending company guard requires HTTP `403` with `code/error = COMPANY_APPROVAL_PENDING`, reason `approval_pending`, and `accessBlocked = true`.

The stored Company B HTTP `404 / WAFL_NOT_FOUND` response passes that exact workspace fixture. Company H uses the same access-token route, workspace read guard, tenant-scoped read-only repository, and resource-hiding fixture. Company C is proven through the shared workspace guard and canonical approval-pending company-access mapper. The static negative-path graph contains no token redemption, PDF fetch, access update, event write, or R2 operation. Live Company H/C requests were not executed and are not claimed.

Final classification: `ALPHA42_RUNTIME_EFFECTS_COMPLETE_STATIC_VALIDATION_PASS`.

- Runtime effects: PASS.
- Company B stored-response validation: PASS.
- Company H/C static isolation contracts: PASS.
- Additional live H/C validation: not executed by approved zero-call policy.
- Generated document: one retained `generated` row with complete metadata.
- PDF: `252994` bytes; SHA-256 `0334727646ebc43ab19a88ccb64cf1b5d3b1e91d3ca5438d3ec61a9a9665af37`; three pages; landscape/portrait/portrait.
- Worker-mediated PDF PUT/GET/DELETE: `1/3/0`; direct R2/S3 access `0`.
- Finalize update `1`; cumulative event delta `+3`; receipt/incomplete `3/0`; token access count `1`.
- A30FACT unchanged; cleanup/rollback/delete `0`; production mutation false; remaining runtime budget `0`.
- The ephemeral port and exact viewer ready timestamp were not preserved and remain `not preserved / unavailable`; no replay was performed to reconstruct them.

## Approved already-applied migration Plan guard

The canonical Plan keeps its global migration rejection and recognizes migration 012 only as `approved-already-applied-pending-commit`. The exception requires the exact migration path and SHA-256, the approved dev/test fingerprint, ledger `12/12`, exactly one apply PASS marker, matching apply and post-audit evidence file hashes, and the exact immutable 001-012 migration filename/SHA manifest. An explicit production runtime, a missing or modified evidence file, ledger/apply-count mismatch, any changed 001-011 migration, or any migration 013 addition remains a hard Plan failure. The guard performs no DB or R2 request and cannot be enabled by a single environment variable.

The guard contract exercises the approved PASS state and rejects a one-character SHA change, changed migration content, ledger `11/11`, apply count `0` or `2`, another fingerprint, production runtime, migration 011 change, migration 013 addition, and missing approval evidence. Migration 012 itself remains unchanged and is not reapplied.

## Partial-mutation handling

## PDF render-route failure and readiness boundary

After the retained draft continuation completed content creation, canonical issue, generation prepare, and embedded-token prepare, local Chromium stopped before PDF creation with `PDF_RENDER_ROUTE_RESPONSE_INVALID`. No PDF R2 PUT, generated-document finalize, token access update, or completion event ran.

The bounded route diagnosis used the existing local render input and one read-only GET against the local Next render route. The normalized requested and final path matched, the response did not redirect, and the route returned HTTP `500` with `text/html`. Sanitized Next stderr identified `PDF_LOCAL_RENDER_INPUT_INVALID`. The JSON input parsed and contained the Preview snapshot and representative-image data URL, but omitted all three fields required by the canonical reader: `canonicalSnapshotJson`, `snapshotSha256`, and `objectKeyPlan`. This proves a writer/reader DTO mismatch rather than a URL, route-token, image, or PDF-layout failure.

The minimum correction introduces one shared local-render-input writer beside the existing reader. Both now derive the same ignored `.tmp` path and validate the same complete DTO. Missing input maps to `PDF_RENDER_INPUT_NOT_FOUND`; invalid JSON or fields map to `PDF_RENDER_INPUT_INVALID`. The Chromium adapter records only sanitized status, content type, redirect state, normalized route paths, typed route code, and a bounded body prefix. It never records the run token, raw URL, opaque viewer token, signed URL, UUID, or storage key.

The dedicated pending-document readiness runner is constrained to the retained pending identity. It uses `BEGIN READ ONLY`, re-derives the embedded token only in process memory and compares its SHA-256 with the stored hash, fetches the retained representative PNG at most once, and renders locally exactly once. It cannot execute SQL writes, R2 PUT/DELETE, generated-document finalize, token redemption, issue, fixture creation, or the full continuation runtime. PASS requires HTTP `200 text/html` without redirect, a non-empty valid PDF, mixed page orientation, representative image and embedded QR visibility, and zero blank, clipping, row-split, console-error, or failed-request findings.

The first and only approved readiness child stopped during module linking before its guard, DB connection, R2 fetch, Next server, or Chromium renderer could start. Standalone Node could not resolve the Next-only `server-only` sentinel imported by the shared TypeScript input module and returned `ERR_MODULE_NOT_FOUND`. Consequently DB query, R2 request, local PDF render, PDF R2 PUT, finalize, and token access counts were all `0`. The one-shot marker remains retained, and no source correction or second readiness render was attempted under that approval. A bounded `BEGIN READ ONLY` audit reconfirmed the issued/finalized `2/2` target, receipt/event `3/2`, incomplete receipt `0`, pending metadata null, embedded token access `0`, no generated-document event, and unchanged A30FACT.

The separately approved module-boundary correction moves path calculation, token/schema validation, canonical snapshot SHA verification, and JSON read/write into the native Node ESM implementation `localRenderInputCore.mjs`, with `localRenderInputCore.d.mts` supplying its TypeScript contract. The core imports only Node APIs. `localRenderInput.ts` retains `import "server-only"` and only re-exports the core contract for the Next route. The local route continues through that wrapper and its production host guard, while standalone alpha.42 runners import the core directly. A standalone Node ESM smoke test and synthetic boundary failures cover wrapper imports from a runner, sentinel removal, Next imports from core, path divergence, client import, and production guard removal. No mock sentinel, loader, `NODE_PATH`, package, dependency, DB, R2, snapshot, or renderer behavior change is involved.

The one separately approved post-correction readiness child proved the module boundary and advanced through retained-state read, stored snapshot SHA validation, embedded-token hash re-derivation, one representative PNG GET, local Next readiness, canonical input loading, render-route response, and Chromium PDF generation. It then stopped at the renderer's mixed-page check with `PDF_PAGE_ORIENTATION_INVALID`. Because the renderer throws before returning the inspected result, PDF size, SHA-256, page count, and actual orientation array were not available and are not claimed. No temporary PDF artifact, PDF R2 PUT, finalize, token access, receipt/event write, or continuation stage ran. The bounded post-failure `BEGIN READ ONLY` audit reconfirmed issued/finalized `2/2`, receipt/event `3/2`, incomplete receipt `0`, pending metadata null, embedded token access `0`, no generated-document event, and unchanged A30FACT. Actual readiness counts were DB read-only child `1`, representative-image R2 GET `1`, local render `1`, R2 PUT/DELETE `0/0`, and DB mutation `0`. No second readiness attempt or further source correction was made.

The approved orientation diagnosis did not create another PDF. A print-media DOM probe against the retained render input found exactly three page roots assigned `cover/content/content`, declared `landscape/portrait/portrait`, with zero root overflow. The renderer already used `preferCSSPageSize: true`, `printBackground: true`, no global `format`, and no global `landscape` option. Repository-retained alpha.38 and alpha.40 PDFs independently showed direct Chromium page boxes of approximately `841.92 x 594.96`, followed by `594.96 x 841.92`, with rotation `0`. This ruled out a justified CSS, layout, or Chromium-option change before inspecting the failed binary.

The minimum correction therefore replaces the viewport-only orientation assertion with a pure PDF page-tree inspector. It records MediaBox, optional CropBox and TrimBox, Rotate, effective dimensions, classified and expected orientation, and match state for every page. A valid CropBox takes precedence over MediaBox; rotation `90/270` swaps effective dimensions; dimensions within two points are `square-or-unknown`. Validation evidence is assembled before any throw and includes the PDF SHA-256, byte size, page count, actual/expected arrays, first mismatch index, and mismatch reason. On an orientation failure the one-shot readiness runner retains the local PDF and a sanitized numeric/hash-only manifest, without token, viewer URL, UUID, R2 key, or snapshot content. Contracts cover landscape/portrait MediaBox, rotation, CropBox precedence, decimal Chromium dimensions, zero dimensions, invalid rotation, empty page trees, wrong first page, and wrong continuation pages. Preview data, document content, PDF layout, font/image/QR design, snapshot, R2 transport, and DB/token behavior remain unchanged.

The first orientation-inspector readiness approval stopped before its guard because Node 24 strip-only parsing does not support TypeScript constructor parameter properties. The failure was `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`; DB query, R2 request, Next start, Chromium start, and local render were all zero. The bounded read-only audit reconfirmed the retained pending state, and no automatic retry or source correction ran under that approval. The separately approved syntax correction replaces only the error carrier's parameter properties with explicit typed fields and constructor assignments. A dedicated Node `24.14.0` standalone smoke imports the exact renderer, orientation inspector, error class, and local-render-input core used by readiness, checks evidence retention and stack/name behavior, and exits with DB query, R2 request, Next start, Chromium start, and mutation all zero. No mock package, custom loader, path alias, CSS, Chromium option, layout, DB/R2, or business behavior changes are involved.

The post-parser readiness produced a retained `253836`-byte PDF with SHA-256 `d272b12f12af3307f7e40056c2c39b7f1e04ba16f53099214e04f46c448214d9`. Its physical orientation was `landscape, landscape, portrait, portrait`, while the three logical pages require `landscape, portrait, portrait`. Page index `1` contained only footer text `1 / 3`; MediaBox, effective CropBox/TrimBox, and Rotate proved it was a real extra landscape page rather than an inspector classification error. The child performed one read-only DB run, one representative PNG GET, and one local render, with no DB mutation, R2 PUT/DELETE, finalize, or token access update.

The bounded print-box diagnosis found the direct fragmentation cause. The cover grid used `box-sizing: border-box`, but its tallest child required `730.656px`; base vertical padding was `45.3543px` on each side, so the cover grew to `821.344px`. The named landscape CSS page height was `793.701px`, leaving measured overflow `27.643px` (`7.314mm`). The absolute footer did not create flow height, but it followed the expanded cover bottom and was therefore fragmented alone onto the extra landscape page. The minimum print-only correction changes only `.coverPage` vertical padding from the base `12mm` to `8mm`. It recovers `30.236px`, just `0.686mm` beyond the measured overflow, while preserving horizontal padding, text size, image, QR, memo content, footer positioning, page rules, and Chromium options. A static calculation contract requires the corrected cover to resolve to the canonical `210mm` minimum height and forbids clipping, scaling, blank-page skipping, or relaxed orientation validation.

## Representative image transport failure and continuation boundary

The first approved bounded runtime entered the canonical create transaction once and retained exactly one Company A WorkOrder/R0 draft at version `1/1`, with one completed create receipt and one create event. The first representative-image PUT then returned HTTP `400`; no fixture-content transaction, issue, generation, token, PDF request, or later mutation ran. The bounded audit confirmed the failed object absent, the retained draft content/link/document/token counts at zero, and A30FACT unchanged.

Static transport comparison identified the exact cause as Worker code `WORKER_FILE_POLICY_REJECTED`. The request used the repository-owned `.svg` bytes with `image/svg+xml`, while the immutable design-image Worker policy accepts only `image/jpeg`, `image/png`, and `image/webp`. The signed URL grammar, PUT method, canonical signature, raw request body, and `Content-Length` match the successful alpha.38 PDF transport. The Worker allowlist and deployed Worker remain unchanged.

The runner-only correction rasterizes the repository-owned SVG through local Chromium at a fixed `920 x 920`, device scale factor `1`, and emits deterministic PNG bytes. The final transport contract is filename `linen-round-dress-sketch.png`, extension `.png`, MIME `image/png`, and key grammar `companies/{companyId}/workorders/{workOrderId}/design/{contentSha256Prefix}.png`. Source SHA, PNG SHA, byte size, renderer version, and repeatability are verified without network mutation. Database image metadata and immutable revision snapshots use the PNG filename/MIME/SHA rather than claiming that SVG bytes were uploaded.

The continuation path resolves the retained draft only through the completed scoped create receipt. It cannot create a second WorkOrder, revision, create receipt, or create event. Its remaining budget is content rows plus metadata update, issue/generation receipts `+2`, events `+4`, generated document `+1`, embedded token `+1`, image/PDF PUT `1/1`, image/PDF GET `3/3`, and DELETE `0`. A separate `continuation-preflight` performs only bounded read-only DB checks and one planned-PNG-key absence GET. A30FACT integrity reuses its accepted R2 evidence and compares current DB metadata, avoiding a second object-body GET.

- Image PUT followed by fixture failure: keep the image as an orphan candidate; no DELETE or automatic fixture retry.
- Fixture success followed by issue failure: retain the draft; no automatic issue retry.
- Prepare success followed by render failure: retain pending document/token; no token delete/reissue.
- PDF PUT followed by finalize failure: retain object and pending row; no automatic finalize or DELETE.
- Every mismatch stops further mutation, runs only bounded read-only audit, creates Failure Handoff, and requests the exact continuation approval.

## Static verification status

The alpha.42 contract verifies migration grammar, manual/embedded purpose separation, DB-native UUID policy, stable realistic counts, first-page-only QR wiring, ephemeral render transport, no raw-token persistence, non-overwriting R2 checks, duplicate-generation no-op, and exact mutation budget. Migration apply and post-apply audit passed. Earlier runtime preflight attempts first stopped at process-only environment guards and then exposed a runner-only schema assumption: `document_code` is returned by `public.wafl_v2_document_number_settings()`, not stored on `public.company_settings`. The corrected runner follows the alpha.27 issue boundary: it establishes the fixed tenant runtime role and Company A claims inside `BEGIN READ ONLY`, calls the SECURITY DEFINER function, requires exactly one valid result row, and statically preserves function-only EXECUTE access with no PUBLIC function access or direct runtime table SELECT grant.

The final runtime-ready checkpoint is gated on the full `automation-infrastructure` verification for this exact working tree. Its matching repo-state records the verification log and changed fingerprint. Required checks are Next build, root/mobile TypeScript, Expo config, targeted ESLint, alpha.20 through alpha.42 contracts, Unicode, PowerShell, docs/Mermaid, route guards, pipeline contracts, mutation audit high-risk `0`, and `git diff --check`.

The one approved corrected preflight then passed with fingerprint `01e5dcc7fea3`, ledger `12/12`, settings function result rows `1`, sanitized document code `WAFN`, business timezone `Asia/Seoul`, runtime function EXECUTE `true`, PUBLIC EXECUTE `false`, and direct runtime `company_settings` SELECT `false`. The realistic target baseline remained absent (`0`, partial `false`). The retained A30FACT baseline remained issued/finalized at WorkOrder/revision version `7/7` with one generated document. No fixture, issue, token, generated-document, event, receipt, R2, Worker, or production mutation occurred.

## Approval sequence

1. Source/static verification and migration 012 read-only preflight: PASS.
2. `alpha42-pending-migration-012` checkpoint and explicit migration approval: PASS.
3. Migration 012 apply exactly once and post-apply read-only audit: PASS.
4. Runtime read-only preflight: PASS exactly once after the canonical settings-function correction; DB/R2 mutation and R2 request `0`.
5. Separately approved one-shot fixture/image/issue/generation/PDF/viewer runtime.
6. Completion audit, APP_VERSION alpha.42, Verify/Plan/Finish, commit/push, and final artifacts only after all PASS.

Next version: `2.0.0-alpha.43`, document revoke, regeneration, trash/restore, and missing/orphan reconciliation.
