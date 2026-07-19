# 2.0.0-alpha.47 Tailscale Serve Developer Auto-connect

- Internal APP_VERSION, mobile mirror, mobile package/lock trace, and Expo `extra.appVersion` are `2.0.0-alpha.47`; public version remains `2.0.0`, native/EAS/ATS configuration is unchanged, and `dataMode` is descriptive `dev-test-tailscale-auto-connect`.
- The developer path separates origins: tailnet-only Tailscale Serve HTTPS carries authentication and WorkOrder APIs, while the process-owned Cloudflare Quick Tunnel remains the Preview/Viewer web origin. Expo Metro remains on private Tailscale LAN HTTP under the existing Development ATS exception.
- The exact Serve host alone may use `POST /api/dev/mobile-connect/auto`. It trusts only the Serve-supplied `Tailscale-User-Login`, rejects malformed or multiple values, hashes normalized identity in process memory, and compares it in constant time against the runner-approved hash. Cloudflare and other hosts cannot use the route.
- The approved dev/test mapping is an exact process-local hash pair between one user-owned Tailscale identity and the sole active WAFL system administrator. No account or email is changed. The effective workspace target is the exact current simulator Company A (`wafl-fn-company-a`) company administrator; the provisional `test-company-a` value is not used.
- A read-only mapping preflight passed with one active system administrator, one exact Company A target, company-admin `workorder.read` authority, the approved dev/test DB fingerprint, and zero DB/R2/PDF/token/production mutation. Raw login, email, full hashes, DB credentials, and full fingerprint are not tracked or logged.
- Mobile boot checks the existing session once, attempts developer auto-connect at most once after 401, then rechecks auth and loads the list. Manual one-time code exchange remains available only as fallback. Explicit disconnect suppresses same-process immediate auto-connect; a cold restart may auto-connect again.
- The default mode remains read-only. WorkOrder PATCH/POST, material/process/revision commands, R2/PDF/token operations, production access, native dependency changes, EAS Build, and EAS Update remain blocked.
- Serve HTTPS DNS/TCP/TLS/certificate readiness, exact identity/Company A mapping, bounded auto/auth/list/disconnect, Tailscale Metro manifest advertisement, and one non-executed JS bundle transfer all passed. Manifest/bundle request totals were `4/1`; raw manifest, URL, JavaScript, identity, cookie, and full hash persistence remained zero.
- The owner completed external cellular iPhone QA without viewing the home PC or entering a code: app launch, automatic connection, disconnect, explicit reconnect, close/reopen, and code-free cold restart all passed without a reported crash, red screen, or infinite loading. The request-level server ledger is unavailable, so per-route iPhone counts are not reconstructed; the manual-code fallback remains proven by source/contracts and historical alpha.44 runtime rather than a new alpha.47 device action.
- Canonical stop preserved three partial handoffs while strict Serve ownership metadata was intermittently unavailable and while an already-stopped Expo PID was reused. The final bounded implementation allows one exact-PID WMI metadata lookup only after an exact marker-owned Serve CIM miss, requires PID/owner/start/path/command/backend equality, treats a different StartTime as protected PID reuse without termination, and parses Funnel status by explicit `AllowFunnel: true`. Final stop state is `stopped`: Serve config empty, Funnel true count zero and unchanged, ports 3000/3100/8081 listener zero, Tailscale Running, ownership skip zero, and unrelated termination zero.
- Final status is `ALPHA47_TAILSCALE_SERVE_DEVELOPER_AUTO_CONNECT_COMPLETE`. The matching repo-state is authoritative for final Verify, runner stop, commit/push, and Source ZIP identities.
- Evidence: `docs/project/app-v2/46-mobile-tailscale-serve-developer-auto-connect-evidence.md`.

# 2.0.0-alpha.46 Mobile Basic Info Update

- Internal APP_VERSION, mobile mirror, mobile package/lock trace, and Expo `extra.appVersion` are `2.0.0-alpha.46`; public version remains `2.0.0`, and `dataMode` is descriptive `dev-test-basic-info-write`.
- The existing draft basic-info PATCH transaction remains the server source of truth. Alpha.46 mobile sends only changed `productName`, `dueDate`, and `totalQuantity` with `expectedVersion` and a bounded `clientRequestId`; it never sends an Idempotency-Key, company scope, revision identity, or a whole detail object.
- The new alpha.46 approval is not in the generic mutation approval set. Create remains alpha.25-only; material, process, and revision commands retain their own exact approvals. External PATCH is admitted only for one canonical UUID detail pathname when the explicit runner switch enables the non-production alpha.46 mutation mode.
- The default external runner remains read-only. Mutation-mode values are injected only into the Next child; Metro, tracked env files, and persistent process/user/machine environment remain free of Command approvals.
- Mobile edit is draft/current-revision and `workorder.update` gated. It provides explicit save, client validation, saving/saved/validation/conflict/locked/error states, dirty-navigation confirmation, manual latest reload, one post-save detail GET, and local list synchronization without automatic retry, polling, autosave, or list refetch.
- Read-only preflight proved all 503 existing Company A WorkOrders were `issued/finalized`. With separate owner approval, one retained synthetic `QA_DRAFT_A` was created at the exact initial product name, `2026-09-29`, and quantity `136`; creation produced WorkOrder/revision/receipt/event deltas `+1/+1/+1/+1` and no document, token, R2, PDF, or production effect.
- The owner then approved one three-field mobile save. The retained result is product name `QA 기본정보 저장 검증 A`, due date `2026-09-30`, quantity `137`, WorkOrder/revision entity version `2/2`, one `work_order.patch_basic_info` event, and no save receipt. No additional successful PATCH occurred.
- PostgreSQL `DATE` is now treated as a calendar-only `YYYY-MM-DD` string at SQL/repository boundaries. It must never round-trip through JavaScript `Date` plus `toISOString().slice(0, 10)`; `timestamp` and `timestamptz` keep their existing ISO datetime contract. DB, list API, detail API, and iPhone now all report `2026-09-30` independent of timezone.
- One old `expectedVersion=1` request returned typed `409 CONFLICT` while the current version remained `2`; DB, event, receipt, and version deltas were zero. The first local audit invocation had stopped before HTTP because PowerShell 5.1 misread UTF-8 JSON; a separately approved Node UTF-8 direct read produced the sole stale HTTP request.
- Physical iPhone QA is owner-confirmed PASS for persistence, date display, dirty background/re-entry, unsaved warning, continue editing, discard, non-draft read-only behavior, and disconnect. Automatic save/retry/polling remained zero, and R2/PDF/token/production/native/EAS effects remained zero.
- Canonical stop ended the three marker-owned cloudflared/Next/Metro processes with skip `0`; ports 3100/8081 have no listener, while the separately owned localhost:3000 login server and Tailscale service remain running.
- Final status is `ALPHA46_MOBILE_BASIC_INFO_UPDATE_COMPLETE`. Final Verify passed with 51 contracts and zero failures; canonical stop passed; commit/push completed at `d70b7902623e4a4aeeb7a108b5df9790bd41cbf9`; Source ZIP `peacebypiece-ui-2.0.0-alpha.46.zip` and matching repo-state `repo-state-2.0.0-alpha.46-20260719-005306.txt` were completed. The repo-state generator could not encode every manual QA detail, so this canonical evidence remains the authoritative physical-device record.
- Evidence: `docs/project/app-v2/45-mobile-basic-info-update-evidence.md`.

# 2.0.0-alpha.45 Mobile ProductionCard Core Overview

- Internal APP_VERSION, mobile mirror, mobile package/lock trace, and Expo `extra.appVersion` are `2.0.0-alpha.45`. Expo public version remains `2.0.0`; Bundle Identifier and Android package remain `com.wafl.app`.
- Alpha.45 preserves the alpha.44 development connection, actual WorkOrder list/core-detail client, PostgreSQL UUID exact-path correction, session/tenant guards, and detail-error list escape path.
- The live detail now uses the visual grammar of the historical ProductionCard mock but imports no mock component, mock constants, or mock values. `WorkOrderDetailCore` remains the only live detail source.
- The active overview maps actual product identity, status, quantity, due date, Revision, amounts, and readiness. Actual tab counts remain in the disabled future-tab badges; document, history, and component metadata are intentionally absent from the overview body.
- A neutral representative-image placeholder performs no remote image/file request. The future tabs remain visible and disabled with actual count badges; they have no selection handler, lazy API, or mutation path.
- The first physical iPhone run passed development connection, actual list/recent/legacy detail data, disabled-tab behavior, list return, background/re-entry, and disconnect, but the owner rejected its dashboard/card-stack visual treatment as not inheriting the established ProductionCard design.
- The first paper-sheet rework moved the screen closer to the historical mock, but the second owner screenshot review found an overlong system-oriented lower body: repeated basic metadata, document summary, and component-count summary remained visible.
- The final information-architecture rework removes those three sections, leaves actual counts only in their tab badges, and reserves Revision/final-update history for a future history surface and document metadata for `출력·공유`. The four priority metrics now sit below the compact hero so the actual product title has a wider, naturally wrapping column.
- The owner explicitly accepted the final physical-iPhone information architecture with `디자인 최종 판정: PASS`: the ProductionCard overview is approved as the pre-feature-expansion shell, and remaining typography, spacing, representative-media, tab-density, and color polish is deferred until actual tabs and inputs are connected. The user found no issue that blocks feature use or information understanding.
- The clean-run iPhone flow retained development connection, actual list, recent and legacy detail, disabled-tab behavior, list return, background/re-entry, and disconnect without crash, red screen, or infinite loading. Preserved logs contain no request-level access ledger, so exact API counts are unavailable rather than reconstructed; lazy/file/PDF/token/mutation paths remain absent by source, contracts, and runtime error audit.
- The canonical ownership stop ended only runner-owned cloudflared/Next/Metro processes, released ports 3100/8081 with ownership skip zero, preserved the separate localhost:3000 login server, and left Tailscale running. Current status is `ALPHA45_MOBILE_PRODUCTION_CARD_CORE_OVERVIEW_COMPLETE`; final Git and handoff identities are recorded by the matching alpha.45 repo-state.
- Evidence: `docs/project/app-v2/44-mobile-production-card-core-overview-evidence.md`.

# 2.0.0-alpha.44 Mobile Real Data Read-only Slice

- Internal APP_VERSION, mobile mirror, mobile package/lock trace, and Expo `extra.appVersion` are `2.0.0-alpha.44`. Expo public version stays `2.0.0`; Bundle Identifier and Android package stay `com.wafl.app`.
- Alpha.44 reuses the installed ATS-corrected alpha.43 iOS Development Build. Native dependencies, Expo/EAS/ATS configuration, build number, certificates, profiles, registered devices, EAS Build, and EAS Update are unchanged.
- A localhost-only `/dev/mobile-connect` flow issues an eight-character, five-minute, one-use development code only when the current external QA run is enabled, the actual session is an active system administrator, and the effective dev/test company context passes existing company access plus `workorder.read` guards.
- The code registry is process-local, bounded, hash-keyed, and bound to the current runner secret fingerprint. Raw code/session/cookie values are not persisted or logged.
- Exact external routes added are exchange, disconnect, auth/me, WorkOrder list GET, and UUID core-detail GET. WorkOrder POST/PATCH, lazy tabs, arbitrary APIs, internal/dev routes, and OPTIONS remain blocked. Request `Host` remains the only external authority input.
- Mobile runtime now uses real API data through one credentials-included, no-store, timeout-bounded JSON client. The entry no longer renders `ProductionCardMock`; remote representative-image fetch, automatic retry, polling, mutation methods, and lazy detail calls are absent.
- Phone implements list/detail/back navigation. Tablet implements bounded list/detail split view. Every detail failure keeps an explicit upper-left back action plus primary `목록으로` and secondary `다시 시도`; returning clears only detail selection/error and does not refetch the list, while retry is bounded to one request per user action.
- The reproduced legacy-detail 404 was classification `C4`, not missing data or a tenant/permission defect: Company A list and detail joins each admitted all 503 rows, but the external proxy accepted only RFC-version/variant-shaped UUIDs. PostgreSQL UUID values are valid independent of RFC version/variant bits, so the exact one-segment core-detail matcher now accepts canonical hexadecimal `8-4-4-4-12` UUID text while retaining exact GET-only pathname matching and every existing external block.
- Final iPhone QA passed development connection, effective Company A/user context, actual list, recent detail, the formerly failing legacy detail, back navigation, background/re-entry, and disconnect without crash, red screen, or infinite loading. Because the corrected legacy card opened successfully, the detail-error buttons are static/contract PASS and runtime not applicable rather than falsely reported as runtime-clicked.
- Automatic retry/polling, WorkOrder commands, lazy-tab/object/PDF/token requests, DB writes, and production access remained zero. Preserved runner logs prove one Metro JavaScript bundle but do not contain HTTP access records, so exact API request counts are recorded as unavailable rather than reconstructed.
- The final marker-owned cloudflared/Next/Metro processes were stopped by the canonical ownership guard with skip zero; ports 3100/8081 are released, localhost:3000 remains owned by its separate login server, and Tailscale remains running.
- Current status is `ALPHA44_MOBILE_REAL_DATA_READ_ONLY_SLICE_COMPLETE` after the final matching canonical verification and delivery workflow.
- Evidence: `docs/project/app-v2/43-mobile-real-data-read-only-evidence.md`.

# 2.0.0-alpha.43 External Mobile QA Foundation

- Internal APP_VERSION, the mobile mirror, and mobile package metadata are `2.0.0-alpha.43`. Expo's public iOS/Android version is the Apple-compatible numeric triplet `2.0.0`, while `expo.extra.appVersion` retains `2.0.0-alpha.43` for internal traceability.
- Canonical product identity is Project `PeaceByPiece`, planned Company `Sanjin Works`, Brand `WAFL`, Website `https://www.wafl.co.kr`, and long-lived Bundle Identifier `com.wafl.app`. The bundle identifier is a brand identifier and does not change with Project Name or Company Name.
- Apple Developer Program Individual membership is active. Expo owner `lostab` now owns EAS project `@lostab/wafl-mobile`; project ID `6cc3b260-a2cc-4c97-9c15-764bda530836` is linked in the mobile app config. The later company-account direction is Organization followed by Apple App Transfer, and the EAS project may move to a future Sanjin Works Expo Organization under a separately approved transfer.
- The mobile config uses iOS Bundle Identifier and Android package `com.wafl.app`, `expo-dev-client` `55.0.37`, and a single internal-distribution `development` profile pinned to EAS CLI `21.0.1` with remote app-version sourcing. Apple Individual Team connection, one registered iPhone, one valid Distribution Certificate, and one ad hoc provisioning profile are ready. No TestFlight, App Store Connect submission, EAS Update channel, `expo-updates`, or `runtimeVersion` has started.
- The final mobile dependency tree is aligned at Expo `55.0.28`, Expo Router `55.0.17`, React Native `0.83.6`, `expo-dev-client` `55.0.37`, and transitive `@expo/log-box` `55.0.13`. The stale lockfile was not edited in place: an isolated `.tmp` candidate was generated from `apps/mobile/package.json`, audited, and then copied over the active lock before one script-disabled `npm install`. `@expo/log-box` is not a direct dependency, `node_modules` was not deleted, lifecycle scripts did not run, `expo install --check` passed, and the Node `24.14.0` `automation-infrastructure` Verify passed. The retained npm audit result is 9 moderate findings; `npm audit fix` was not run.
- Development Build is the only official WAFL mobile QA path. Expo Go is excluded from official QA evidence and release gates; earlier Expo Go connectivity work remains transport-foundation evidence only.
- The first EAS iOS Development Build reached credential/profile completion but failed at Install Pods/React Native Codegen because `react-native-screens` `4.26.2` emitted an incompatible native declaration. The corrected SDK 55 tree keeps Screens `4.23.0`, restores React Native `0.83.6`, and the subsequent Development Build finished and installed on the registered iPhone.
- The installed Development Build reached the native launcher but iOS reported `The resource could not be loaded because the App Transport Security policy requires the use of a secure connection.` Safari reached the same Tailscale Metro `/status` URL, Local Network permission was enabled, the PC manifest and JavaScript bundle returned HTTP 200 with the expected content types, and Metro/Expo Router errors were zero. The direct failure is therefore ATS enforcement on the private HTTP Metro transport.
- `apps/mobile/app.config.js` merges the canonical `app.json` and adds only for `APP_VARIANT=development` the exact `100.64.0.0/10` `NSExceptionDomains` entry with `NSExceptionAllowsInsecureHTTPLoads=true`. Default/production config has no ATS exception, `NSAllowsArbitraryLoads` is absent, and the TailscaleLan runner injects the variant only into its Metro child.
- The ATS-corrected frozen-credential EAS iOS Development Build finished with Pods, Codegen, and Xcode archive PASS. Its embedded Info.plist contains the exact Tailscale CIDR exception and no arbitrary-load switch. The build reused the existing certificate, ad hoc profile, and registered iPhone; credential/profile/device mutation was zero.
- The internal Development Build retained build number `1`, matching the earlier successful internal build. The owner accepts that duplicate for this installed internal QA artifact because signing, installation, and device execution passed. Before the next Development Build, monotonic iOS auto-increment is a follow-up policy candidate; alpha.43 does not add `autoIncrement` or create another build.
- The Windows QA runner separates transports: private Tailscale carries Expo Metro/JavaScript bundles, while process-only Cloudflare Quick Tunnel carries Next/PDF/Viewer HTTPS. The transports are not interchangeable and temporary Quick Tunnel hosts are never permanent PDF/QR origins.
- The final real-iPhone run reached `ALPHA43_ATS_FIXED_USER_DEVICE_APP_LOAD_PASS`: the signed Development Build opened through its deep link, loaded the HTTP manifest and JavaScript bundle over Tailscale, displayed the WAFL screen without the former ATS error, navigated basic screens, survived background/re-entry, and redisplayed WAFL after exactly one Development Client Reload. Red screen, crash, and infinite loading were absent; login and business-data/PDF-token actions were not executed.
- The final marker-owned cloudflared/Next/Metro processes were stopped through the canonical ownership guard with skip zero, ports 3100/8081 released, and Tailscale still running. Alpha.43 closes at `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE` with DB/R2/token/PDF/Worker/production mutation zero.
- Next external QA trusts the request `Host`, never unconditional `x-forwarded-host`, and exposes only the bounded Viewer/issued-Preview chain and required assets. Internal/admin/dev/test/migration/simulator routes remain blocked externally.
- Evidence: `docs/project/app-v2/40-external-mobile-qa-foundation-evidence.md`; operator runbook: `docs/project/app-v2/41-external-mobile-qa-runbook.md`; iOS build evidence: `docs/project/app-v2/42-ios-development-build-evidence.md`; identity/EAS authority: `docs/project/app-v2/06-expo-environment-setup.md`.

# 2.0.0-alpha.42 Realistic Issued Embedded QR PDF Lifecycle

- APP_VERSION, mobile mirror, Expo metadata, and mobile package metadata are `2.0.0-alpha.42`.
- Approved dev/test migration 012 is applied exactly once at ledger `12/12`; it adds `token_purpose`, its CHECK, and the one-embedded-token partial unique index without changing existing token business values.
- The retained realistic Company A WorkOrder/revision is issued/finalized at version `2/2`. Its generated document is `generated`, its embedded QR token is active with access count `1`, receipts are `3`, and incomplete receipts are `0`.
- The immutable PDF is `252994` bytes with SHA-256 `0334727646ebc43ab19a88ccb64cf1b5d3b1e91d3ca5438d3ec61a9a9665af37`, three pages in landscape/portrait/portrait order, one representative image, one first-page QR, matrix total 144, and centered page footers.
- Cumulative approved transport is Cloudflare Worker-mediated PDF PUT/GET/DELETE `1/3/0`; direct R2/S3 access is `0`. Finalize update is `1`, cumulative runtime event delta is `+3`, cleanup/rollback/delete is `0`, A30FACT is unchanged, and production mutation is false.
- Final runtime classification is `ALPHA42_RUNTIME_EFFECTS_COMPLETE_STATIC_VALIDATION_PASS`: viewer exchange and inline/download succeeded; stored Company B `404 / WAFL_NOT_FOUND` passes the workspace contract; Company H/C isolation passes source-only canonical contracts; additional live H/C calls were intentionally not executed under the zero-call completion policy.
- The ephemeral viewer port and exact ready timestamp were not preserved and are recorded as unavailable rather than reconstructed by another run.
- Evidence: `docs/project/app-v2/39-realistic-issued-embedded-qr-pdf-evidence.md`.

# 2.0.0-alpha.41 Mobile Order Summary and PDF Page Number

- APP_VERSION and mobile mirrors are `2.0.0-alpha.41`.
- Phone layouts below 760px render the material order summary as two explicit one-line Text nodes: order quantity plus unit price, then amount. The 320/360/375/390/412/425/480/759px checks found no ellipsis, overlap, card overflow, or horizontal scroll.
- Phone material actions remain icon-only with accessible labels and existing hitSlop. Tablet layouts at 760px and above retain the one-line summary and caption-capable action grammar.
- The work-instruction continuation header no longer appends `· 2` or `· 3`. Every rendered page receives one dynamic centered footer using `current / total`, where total is the cover plus packed content pages.
- Local HTML Preview QA passed at 1440x900 and 390x844 with three pages, footer texts `1 / 3`, `2 / 3`, `3 / 3`, landscape/portrait/portrait orientation, horizontal overflow 0, footer overlap 0, console errors 0, and failed requests 0.
- Local Chromium generated a 206,949-byte sample PDF with SHA-256 `ebb68afd21f5a470cbb460e13999a4357be7b680db74ac1a826eb453b5b1c8fc`. PDF extraction and page renders confirmed all three centered footers, mixed orientation, readable Korean/image/matrix content, and old header suffix count 0.
- The retained alpha.38 R2 PDF was read-only regression tested only: inline/download both matched 130,332 bytes and the retained SHA, R2 GET 2, DB `BEGIN READ ONLY`, and every DB/R2 write, token/generated-document, Worker, and production mutation false. The retained PDF is not reported as containing the new alpha.41 footer.
- Verification level: `LEVEL_4_PRODUCT_VERIFIED` for the approved local/mobile/HTML/PDF scope.
- Evidence: `docs/project/app-v2/38-mobile-order-summary-and-pdf-page-number-evidence.md`.

# 2.0.0-alpha.40 Preview Output and Material Action Density

- APP_VERSION and mobile mirrors are `2.0.0-alpha.40`.
- Alpha.40 keeps the existing material summary in one row at 390px and at most two rows at 320-359px while reducing mobile action visuals to 36x30px with a 42px effective touch target.
- Expo Web Preview opens exactly one popup and never navigates the current tab as a popup fallback; native `Linking` behavior is unchanged.
- The canonical work-instruction renderer now uses a real HTML image element and inline SVG color chips. The sample sketch no longer duplicates the right-side IVORY/NAVY/BLACK legend.
- Official Preview actions use generated-document metadata for PDF view, download, and share. Browser `window.print()` is removed; missing generated output is shown as `생성된 PDF 없음`.
- The authenticated generated-document file route performs tenant-scoped read-only metadata lookup and server-side R2 GET integrity verification. The localhost sample route reuses the alpha.37 Chromium renderer and never writes DB/R2 state.
- Local Chromium generated a 195,114-byte three-page sample PDF (landscape/portrait/portrait), and rendered inspection passed Korean/image/matrix-144/blank-page/clipping checks. Expo product QA passed at 320, 390, and 768px with no horizontal overflow or console warning/error; both Preview entries preserve the source tab and the rapid-click guard opens one popup.
- Approved dev/test read-only delivery verification passed at fingerprint `01e5dcc7fea3`: ledger `11/11`, Company A inline/download 200, 130,332-byte retained PDF SHA match, B/H `NOT_FOUND`, C approval-pending block, R2 GET 2, and all DB/R2 write/Worker/production mutation zero.
- Migration ledger remains `11/11`. DB/schema/token/generated-document/R2 PUT/R2 DELETE/Worker/production mutation is false.
- Evidence: `docs/project/app-v2/37-preview-output-and-action-density-evidence.md`.

# 2.0.0-alpha.39 Controlled Document Viewer Security

- APP_VERSION and mobile mirrors are `2.0.0-alpha.39`.
- Alpha.39 delivers hash-only opaque controlled links, `/v#t=...` fragment exchange, a signed HttpOnly 15-minute viewer session, server-side PDF inline/download, per-link revoke/rotation/history, and source-owned QR Model 2 SVG generation.
- Approved dev/test migration 011 added only two SECURITY DEFINER functions with fixed search paths and bounded runtime EXECUTE grants; ledger is `11/11`, PUBLIC EXECUTE is absent, and existing rows were unchanged.
- The single approved token runtime retained one share receipt, two token rows, three token updates, and five events. Token A is revoked after rotation, Token B remains active, and each token has access count one.
- Inline/download and Token B file delivery performed exactly three R2 GETs against the retained alpha.38 PDF. R2 PUT/DELETE, generated-document mutation, Worker mutation, cleanup, and production access are zero.
- Replay was a no-op, changed request SHA was rejected, invalid/revoked tokens used generic NOT_FOUND, Company B/H/C isolation passed, incomplete receipts are zero, and the completion audit reports partial mutation false.
- Raw tokens were not persisted or logged. DB storage is hash-only; external responses expose no generated-document UUID, R2 key, signed URL, company identity, or token hash.
- The initial runtime attempt failed before any API mutation because of a Next dynamic slug collision. The aligned `[documentRef]` routes subsequently built and served `/v` with HTTP 200; the successful bounded runtime was not retried.
- Evidence: `docs/project/app-v2/36-document-viewer-security-evidence.md`.

# 2.0.0-alpha.38 Generated Document DB/R2 Lifecycle

- APP_VERSION and mobile mirrors are `2.0.0-alpha.38`.
- Approved dev/test migration 010 added nullable native `uuid` receipt linkage with a tenant-safe composite FK; ledger is `10/10`, existing receipt rows were not backfilled, and production was not accessed.
- PostgreSQL `DEFAULT gen_random_uuid()` generated document `f9c2141d-19e2-4a37-ba4b-33588cd3cd74`; application code neither supplied nor derived the entity UUID.
- The first runtime committed one receipt and one pending generated document, then stopped on a local Chromium `networkidle` timeout before PDF/R2/finalize. Bounded audit confirmed `PARTIAL_MUTATION_CONFIRMED`, event 0, and R2 object 0.
- The renderer now waits for explicit document, font, image, and page-root readiness. A logging wrapper failure occurred before the continuation runner body and caused no mutation; its Failure Handoff is preserved.
- The approved exact-identity continuation reused the pending UUID, rendered the actual issued A30FACT Preview, uploaded exactly one PDF, verified it by signed GET, finalized the existing row once, and appended one domain event.
- Final PDF: 130,332 bytes, SHA-256 `9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2`, two pages, landscape then portrait. Snapshot SHA-256 is `25d92b5a0dea77da01553173786eec7a05dc10b5ce741a18266ccbc5ca332325`.
- Final target counts are receipt/document/event `1/1/1`, incomplete/pending/failed `0/0/0`. Duplicate replay produced no DB update, render, PUT, event, UUID, or key delta; B/C/H tenant isolation passed.
- The DB receipt, generated document, event, and exact R2 object are retained for alpha.39. R2 DELETE, cleanup, rollback, production, and business-data mutation are false.
- Evidence: `docs/project/app-v2/35-generated-document-db-r2-runtime-evidence.md`.

# 2.0.0-alpha.37 Issued Revision PDF Generation Foundation

- APP_VERSION and mobile mirrors are `2.0.0-alpha.37`.
- The canonical PDF source is the immutable `WorkOrderIssuedPreviewReadModel` rendered by the existing `IssuedWorkOrderDocument`; legacy work-order and order-request renderers remain separate.
- Stable canonical snapshot serialization produced SHA-256 `f1c5a20776a9199160b8b920209e9ec88336de99d04322e1cd7eb665cc419b07` on both runs.
- Local Chromium produced a 197,751-byte, three-page PDF with landscape cover and two portrait continuations. Korean text, repository-owned image, matrix total 144, blank/clipping/console/network error count 0 passed.
- PDF byte SHA differed between Chromium runs because metadata is not canonicalized; file size, pages, orientation, page text lengths, and structure were identical.
- The deterministic key plan is `companies/{companyId}/workorders/{workOrderId}/pdf/{generatedDocumentId}.pdf`. The local object store uses create-new semantics under excluded `.tmp`; the R2 adapter is not instantiated.
- Migrations 004/005 already support the planned generated-document lifecycle. No migration 010 is proposed.
- Actual issued DB rendering is `SKIPPED_WITH_REASON`: alpha.37 does not load DB credentials. Accepted alpha.28/30 immutable Preview evidence remains authoritative, and sample fallback is not reported as actual data.
- Verification level: `LEVEL_4_FOUNDATION_VERIFIED`, not persisted PDF/R2 lifecycle verification.
- DB data mutation, R2 mutation, Worker execution, and production access are false. Alpha.38 requires separate approval for one pending row, one R2 PDF object, one finalize update, one event, and the exact receipt delta.
- Evidence: `docs/project/app-v2/34-issued-revision-pdf-generation-foundation-evidence.md`.

# 2.0.0-alpha.36 Material Summary and Card Separation

- APP_VERSION and mobile mirrors are `2.0.0-alpha.36`.
- Fabric/accessory cards preserve the alpha.35 two-row, three-field compact grammar and unit position.
- The final row now always identifies order quantity, unit price, and amount. Missing calculation inputs render a neutral dash instead of a misleading zero.
- Core fields and unit expose no default `미입력`, `입력`, or `0` placeholder text. Missing values remain field-only label/underline states; usage area and memo retain their production placeholders.
- An 8px inter-card interval and faint work-surface background make each material row group legible while preserving the compact body height and existing status accent.
- Preview renderer, actual/sample boundary, mixed-orientation print contract, API, DB, R2, Worker, and generated-document lifecycle are unchanged.
- `LEVEL_4_PRODUCT_VERIFIED`: representative mobile card height stayed `214px`; tablet cards were `212px`; 390x844, 768x1024, and 1024x768 horizontal overflow was 0; complete and missing-price summary interactions passed; localhost sample/144/production-host 404/console 0 passed; and the unchanged accepted three-page mixed-orientation Chromium print artifact was re-inspected.
- Evidence: `docs/project/app-v2/33-mobile-material-card-separation-and-summary-evidence.md`.

# 2.0.0-alpha.35 Material Compact Input and Order Action Density

- APP_VERSION and mobile mirrors are `2.0.0-alpha.35`.
- Fabric/accessory cards use exactly two three-field core rows: supplier, color/option, unit price, required, allowance, and stock. Unit remains directly below the material name.
- Editable `입력중` rows use same-position 22px inline controls. Requested/completed rows are plain read-only values without edit underlines.
- The local view model recalculates `max(required + allowance - stock, 0)` and amount from unit price; unit suffix changes do not convert the numeric value.
- Reference/warning prose is removed from the card face. Missing required values use only a muted field label/underline state, while the three canonical status badges remain.
- The last card block is one `order summary + nowrap actions` row. Preview routes, sample data, renderer, API, DB, R2, Worker, and PDF lifecycle are unchanged.
- Product QA PASS at 390x844, 768x1024, and 1024x768: representative cards are `214px` versus alpha.34 `275px`, every core row is `22px` with three fields, edit height is stable, horizontal/footer overflow is 0, and locked edit controls are absent.
- Unit and quantity interaction produced `382m / 4,889,600원` then `392m / 5,017,600원`. Preview/print regression retained three pages, exact 144 total, production-host 404, and console/failed-request 0.
- Evidence: `docs/project/app-v2/32-mobile-material-compact-input-evidence.md`.

# 2.0.0-alpha.34 Mobile Sample Preview and Material Footer Alignment

- APP_VERSION and mobile mirrors are `2.0.0-alpha.34`.
- Every Expo mock `작지 보기` entry opens the development-only `/dev/workorder-preview-sample` target. The actual issued-document target remains `/workspace/documents/:documentNumber/preview` and has no sample fallback.
- The development sample opener accepts only localhost loopback hosts outside production. Native continues to use the configured approved web base; no token, company scope, storage key, or secret is added to the URL.
- Fabric/accessory cards use one final footer band: reference/warning messages align left, available actions align right, the action group never wraps, and no empty footer renders when both sides are absent.
- Localhost product QA PASS: top `작지 보기` and `출력·공유 > 보기` both reached the realistic sample; mobile 390x844, tablet portrait 768x1024, and tablet landscape 1024x768 had horizontal overflow 0, one 1px footer separator, and `nowrap` actions. Browser console warning/error count was 0.
- Chromium print QA generated a local-only three-page PDF and visual inspection found no clipping, overlap, broken table, or unreadable glyph. It is not a generated-document/PDF/R2 lifecycle execution.
- No DB migration/write, API mutation, R2, Worker, generated-document lifecycle, production access, root package/lockfile, or dependency change occurs.
- Evidence: `docs/project/app-v2/31-mobile-preview-sample-and-material-footer-evidence.md`.

# 2.0.0-alpha.33 Realistic Preview Entry and Material Card Flow

- APP_VERSION and mobile mirrors are `2.0.0-alpha.33`.
- Actual issued Preview remains tenant/revision scoped and never receives sample fallback. Known stable product category codes use a display-only Korean formatter; unknown values remain unchanged.
- The localhost-only `/ui` catalog links to `/dev/workorder-preview-sample` as `실무 샘플 보기`. Both routes retain the canonical local-host boundary, so production hosts expose neither the entry nor sample route.
- The deterministic sample uses a Korean front/back product board, IVORY/NAVY/BLACK chips, exact 144 color-size matrix, two fabrics, four accessories, five size measurements, four processes, and practical Korean factory instructions.
- Mobile fabric/accessory cards now follow `header -> basic information -> usage area/memo -> order summary -> status/warning -> footer actions`. Actions are the final block and alpha.32's 22px single-line edit contract remains unchanged.
- No DB migration/write, API mutation, R2, Worker, generated-document lifecycle, production access, root package/lockfile, or dependency change occurs.
- Evidence: `docs/project/app-v2/30-realistic-preview-entry-and-material-card-flow-evidence.md`.

# 2.0.0-alpha.32 Inline Density and Realistic Sample

- APP_VERSION and mobile mirrors are `2.0.0-alpha.32`.
- Mobile material usage area/memo, process memo, and factory memo use one compact single-line field grammar with shared summary typography and stable card height.
- Escape cancels without blur recommit; Enter/blur complete once; unchanged normalized values do not invoke the optional commit callback.
- Separate process application-area/color rows and Preview columns are removed. Existing DB/API fields remain unchanged and are merged into work memo for display only.
- `/dev/workorder-preview-sample` uses realistic deterministic Korean production data, an exact 144 color-size matrix, and a repository-owned front/back garment board with no tenant API or external asset.
- The A4 landscape cover and portrait continuations remain. Chromium print evidence is local QA only, not generated-document/PDF/R2 lifecycle execution.
- Product QA PASS: mobile view/edit typography `12px/17px/800`, row `22px`, fabric/accessory cards `265px`, process card `128px`, tablet overflow 0, locked affordance 0, separate process application rows 0, and console/error response 0.
- Final Chromium PDF PASS: three nonblank pages, 841.92x594.96pt landscape cover plus two 594.96x841.92pt portrait pages, boundary violations 0. A trailing blank page found during QA was removed with a print-only root support-node exclusion.
- No DB migration/write, API mutation, R2, Worker, QR, generated-document lifecycle, production access, root package/lockfile, or dependency change occurred.
- Evidence: `docs/project/app-v2/29-inline-density-and-realistic-sample-evidence.md`.

## 2.0.0-alpha.31 Inline Input and Preview Layout Complete

- APP_VERSION and mobile mirrors are `2.0.0-alpha.31`.
- Mobile fabric/accessory/process factory fields use shared inline edit/read-only components. Editable values occupy their display position with a dotted underline; long notes expand in place; issued/completed values render as plain text without a duplicate input box.
- Issued Preview fetch and rendering are separated. The pure renderer uses one A4 landscape cover with a 58/42 product-sketch/information split, then packs revision-scoped sections into A4 portrait content pages without forcing one section per page.
- Factory delivery memo and the existing general memo are preserved in one factory memo area. Revision labels use Korean ordinal form (`0차`, `1차`) while the immutable display document number keeps its `R0` suffix.
- `/dev/workorder-preview-sample` is localhost-only, deterministic, and uses the same renderer with repository-owned SVG and fixed sample data. It makes no tenant API call and is production-blocked by the canonical local-only host guard.
- No DB migration/write, API mutation, R2, Worker, PDF binary, QR, generated-document lifecycle, production access, or external asset download occurred.
- Evidence: `docs/project/app-v2/28-inline-input-and-preview-layout-evidence.md`.

## 2.0.0-alpha.30 Factory Workorder Input and Preview Complete

- Migration 009 was applied exactly once to approved dev/test fingerprint `01e5dcc7fea3`; ledger is 9/9 and the four new nullable fields, four `NOT VALID` checks, existing-row null state, row-count invariants, RLS/ACL invariants, and filename/SHA contract passed post-apply audit.
- APP_VERSION and mobile mirrors are `2.0.0-alpha.30`. Approved Company A synthetic runtime retained WorkOrder/revision `+1/+1`, materials `+2` (fabric/accessory 1/1), process fixture `+1`, receipts/events `+4/+7`, and one document number.
- Final target is issued/finalized at WorkOrder/revision 7/7, fabric/accessory/process versions 2/1/2, incomplete receipt 0, revision count 1, next draft 0, and generated document 0.
- Preview new-field mapping, deterministic repeat GET, B/H `NOT_FOUND`, C `FORBIDDEN`, and immutable `LOCKED` for factory memo, both material usage areas, and process application fields passed. Earlier runner GET and accessory-precondition failures are preserved in Failure_Handoff; neither caused inconsistent or extra mutation.
- No send-time, factory delivery quantity, next-process, or separate remark field is added.
- Evidence: `docs/project/app-v2/27-factory-workorder-input-and-preview-evidence.md`.

## 2.0.0-alpha.29 Mobile Issued Preview Entry Complete

- Expo 제작 카드의 네 Preview 진입점은 공통 platform opener를 사용하며, 발행 문서번호 `WAFN-26FWA-A25CMD-260711-001-R0`은 mock metadata 한 곳에서만 관리한다.
- `/workspace/documents/:documentNumber/preview`가 인증된 tenant scope에서 issued/finalized revision을 찾고 기존 alpha.28 ID Preview로 이동한다. B/H는 generic `NOT_FOUND`, C는 `FORBIDDEN`이다.
- Approved dev/test read-only runtime PASS on `01e5dcc7fea3`: ledger 8/8, resolver/Preview parity PASS, snapshot 불변, 모든 mutation false.
- Expo Web QA: 상단·문서 행·눈 아이콘은 동일 Next Preview 경로를 열고, draft 발주 전 sheet Preview는 비활성 이유를 표시했다. 인증 세션이 없는 브라우저는 기존 로그인 경계로 이동했다. 콘솔 warning/error 0.
- Native Linking/static contract PASS. iPhone/iPad/Android 실제 시스템 브라우저와 앱 복귀는 사용자 수동 QA 대상이다.
- Evidence: `docs/project/app-v2/26-mobile-issued-preview-entry-evidence.md`. Alpha.30 is PDF/QR/R2 document lifecycle.

## 2.0.0-alpha.28 Issued Revision Preview Complete

- Issued/finalized revision based 작업지시서 Preview API and workspace A4/print UI implemented.
- Approved dev/test read-only runtime PASS on `01e5dcc7fea3`: ledger 8/8, Company A 200, B/H NOT_FOUND, C FORBIDDEN, fabric/accessory 2/1, deterministic repeat GET, query count 9, payload 2,983 bytes.
- First measured DB/API durations were 715.83ms/1,614.74ms and include cold server/remote connection; no new performance gate was introduced.
- DB migration/schema/index/test-data/business/R2/Worker/PDF/production mutation false. Alpha.29 remains PDF/QR/R2 document lifecycle.

## 2.0.0-alpha.27 Revision Issue Command Complete

- Baseline was committed `2.0.0-alpha.26` at `1910dcb69deadecfc2c2d1c7923a8246cb229a78`; APP_VERSION and mobile mirrors are now `2.0.0-alpha.27`.
- Alpha.27 adds the dev/test-only current-revision issue Command, server-owned document-number allocation, immutable finalization, WorkOrder/revision dual-version concurrency, tenant/actor-scoped idempotency, and one append-only issue event.
- Approved dev/test migration 008 added the tenant-safe numbering-settings function and ACL; ledger is 8/8. Approved synthetic `company_settings` rows exist only for Company A/B/H (`WAFN`, `Asia/Seoul`), with no direct runtime table SELECT and no production/business data use.
- The one-shot synthetic issue allocated `WAFN-26FWA-A25CMD-260711-001-R0`, moved WorkOrder/revision `draft/draft -> issued/finalized`, advanced versions `14/14 -> 15/15`, completed one receipt, appended one event, and created no revision, next draft, generated document, R2 object, or PDF.
- Idempotency replay, changed-payload conflict, optimistic concurrency single winner, Company B/H `NOT_FOUND`, Company C `FORBIDDEN`, and bounded Read regressions passed. Completion audits found incomplete receipts 0 and `NO_PARTIAL_MUTATION`.
- Immutable acceptance combines WorkOrder scalar runtime `LOCKED`, material scalar runtime `LOCKED`, and `MATERIAL_ORDER_LOCKED_PASS_BY_SHARED_RUNTIME_GUARD_AND_STATIC_CONTRACT`. The shared order repository checks issued/draft lock before material-state transition and durable UPDATE/event work; a thrown lock rolls back the provisional receipt transaction. No terminal-line order request was executed.
- Automatic next draft, correction/reissue, PDF, QR, R2, Preview, mobile API connection, production, and actual business data remain excluded.
- Evidence: `docs/project/app-v2/24-workorder-revision-issue-command-evidence.md`.

# 2.0.0-alpha.26 WAFL v2 Material and Order Command Vertical Slice

- Baseline: `2.0.0-alpha.25`, commit `da4d05839cfd7dbc67787f45373cbb5ab9af42fb`, synchronized clean `master` before this work. APP_VERSION and mobile mirrors are now `2.0.0-alpha.26`.
- Fabric/accessory use shared create, scalar PATCH, order request, request-cancel, and order-complete routes.
- Create/request/cancel/complete use actor-scoped hashed receipts; PATCH and transitions require WorkOrder `expectedVersion` and atomically advance WorkOrder, current draft revision, and line versions.
- Status changes are dedicated commands only: `editing -> requested`, `requested -> cancelled|completed`. Completed lines and finalized/non-current revisions are locked.
- Server derives amount from order quantity and unit price. Cross-tenant material/supplier references are opaque `NOT_FOUND`.
- No DELETE route is implemented because the applied schema has no soft-delete/deactivation lifecycle. Hard delete is forbidden.
- No migration/schema/index, seed, cleanup/reset/rollback, mobile API connection, business data, R2/Worker/PDF, or production access/change occurred.
- Read-only preflight PASS at fingerprint `01e5dcc7fea3`: ledger 7/7 unchanged, valid material mutation sent false, Company C `FORBIDDEN`, finalized fixture and alpha.23~25 regressions PASS, and every mutation category false. Log: `OK_Wafl_V2_Alpha26_Material_Command_Preflight_2.0.0-alpha.25-20260712-101213.txt`.
- The separately approved one-shot runtime committed exactly fabric `2`, accessory `1`, receipts `9`, events `11`, and WorkOrder/revision transitions `3 -> 14`. Its runner then failed only because the finalized fixture expected `REVISION_MISMATCH` instead of canonical `LOCKED`.
- Bounded read-only audit returned `NO_PARTIAL_MUTATION`: material version sum `11`, incomplete receipt `0`, supplier mismatch `0`, ledger `7/7`, and no cleanup requirement.
- Two temporary completion attempts are preserved as failures: the first used non-canonical ledger column `migration_name`; the second used a switch-case source regex while the service uses `if (error.reason === "locked")`. Neither performed mutation or API GET.
- Final GET-only completion `READ_ONLY_COMPLETION_PASS`: GET success/failure `14/0`, direct DB client/query/SQL `0`, mutation route/method `0`, B/H `NOT_FOUND`, C `FORBIDDEN`, alpha.23~25 regressions PASS, and material Read reflects fabric `2` cancelled `2`, accessory `1` completed `1`, parent version `14`.
- Finalized `LOCKED` is `PASS_BY_EXISTING_RUNTIME_AND_SOURCE_EVIDENCE`; the prohibited mutation PATCH was not replayed. Completion log: `readonly-completion-alpha26-material-command-20260712-152459.txt`.
- Canonical evidence: `docs/project/app-v2/23-workorder-material-order-command-evidence.md`.

---

# 2.0.0-alpha.25 WAFL v2 WorkOrder Create and Basic Update Command Vertical Slice

- Current source checkpoint: Command implementation and the explicitly approved dev/test runtime matrix are complete. Final Git delivery identity is recorded in the matching repo-state artifact.
- Baseline source remains `2.0.0-alpha.24`, commit `e0ea9b51d8a846fc6f6eb243c0e3a1642096c367`, synchronized clean `master` before this work.
- Routes: `POST /api/v2/work-orders` and `PATCH /api/v2/work-orders/:workOrderId`; alpha.23 list and alpha.24 detail/lazy GET handlers remain mounted.
- Create is draft/R0 only, does not allocate a display document number, and requires an actor-scoped hashed idempotency receipt.
- PATCH accepts bounded scalar basic information, requires `expectedVersion`, locks only the current draft revision, and returns typed 409 conflict/lock/revision errors.
- Create/revision/event/receipt and WorkOrder/revision/event updates share one fixed `wafl_v2_tenant_runtime` transaction. Raw idempotency/auth tokens, DB URL, storage keys, signed URLs, document snapshots, and session claims are not persisted or logged.
- Static/build checkpoint before the approved runtime: targeted ESLint, alpha.20~25 contracts, root/mobile TypeScript, Expo config, Next build, route guards, docs/Mermaid, Unicode/PowerShell, and mutation audit PASS; mutation audit remains 189 findings with 0 high-risk.
- Read-only preflight fingerprint `01e5dcc7fea3`: valid create/PATCH sent false, Company C pre-mutation `FORBIDDEN`, alpha.23/24 GET regression, ledger 7/7, and before/after schema/row snapshot equality PASS.
- Preflight log: `OK_Wafl_V2_Alpha25_Command_Preflight_2.0.0-alpha.24-20260712-085501.txt`.
- Approved Command runtime fingerprint `01e5dcc7fea3`: Company A synthetic WorkOrder/R0/hashed receipt `+1/+1/+1`, audit event `+3`, and exactly two successful PATCH version transitions PASS.
- Idempotent replay and same-key/different-payload conflict, optimistic concurrency single winner, Company B/H cross-company denial, Company C `FORBIDDEN`, finalized revision `LOCKED`, and alpha.23/24 Read API regression PASS.
- Runtime log: `OK_Wafl_V2_Alpha25_Command_Runtime_2.0.0-alpha.24-20260712-090516.txt`; create/update DB time `715.57ms`/`529.44ms`, API time `1381.97ms`/`687.03ms` in the one-shot evidence run.
- APP_VERSION and mobile metadata are `2.0.0-alpha.25` after runtime PASS.
- Dev/test synthetic test-data mutation occurred only in the approved retained scope. No migration/index/schema validation, seed, cleanup/reset/rollback, business data, R2/Worker/PDF, production access, or production mutation occurred.
- Canonical alpha.25 evidence: `docs/project/app-v2/22-workorder-create-basic-update-command-evidence.md`.

---

# 2.0.0-alpha.24 WAFL v2 WorkOrder Detail and Lazy Read API Vertical Slice

- Current GPT checkpoint: `2.0.0-alpha.24` implementation and approved dev/test read-only runtime verification complete. Final Git delivery identity is recorded in the matching repo-state artifact.
- Baseline source: `2.0.0-alpha.23`, commit `33052fd305e131cedf47cd6f1d86987c96a4dd23`, synchronized clean `master`.
- Core route: `GET /api/v2/work-orders/:workOrderId`.
- Lazy routes: materials, size-color, size-spec, processes, assets, documents, and history.
- The core response contains identity/revision/status/quantity/due-date/amount/representative/readiness/document/count summaries only. Child collections are not eager-loaded.
- Materials, assets, documents, and history use signed 30/50 cursors bound to company, visibility, WorkOrder, and tab kind.
- Missing/invalid/cross-company IDs share generic `NOT_FOUND`; company C remains `FORBIDDEN` through the existing workspace guard.
- Every repository callback remains two bounded statements after the fixed read-only begin/tenant-role call: claims plus one core/tab SQL.
- The mobile mock remains disconnected. Alpha.24 adds no command, migration/index, schema validation, seed, cleanup/reset/rollback, R2/Worker/PDF, business-data, or production path.
- Canonical evidence: `docs/project/app-v2/21-workorder-detail-lazy-read-api-evidence.md`.
- Final runtime log: `OK_Wafl_V2_Alpha24_Detail_API_Verification_2.0.0-alpha.24-20260711-213958.txt`.
- Company A core DB/API p95 is `79.96ms`/`464.02ms`; tab DB p95 ranges `74.66~83.31ms`, tab API p95 ranges `446.89~476.41ms`; Company H core DB/API p95 is `81.75ms`/`455.84ms`. Every over-500ms API outlier count is 0.
- Accessory 10 rows traverse 4 pages and assets 2 rows traverse 1 page with duplicate/missing `0/0`. A/H/B reads, C `FORBIDDEN`, cross-company `NOT_FOUND`, typed errors, forbidden fields, and pre/post DB snapshot equality PASS.
- Two earlier read-only failures are preserved under `Failure_Handoff`; they exposed and removed an unauthorized legacy `partners` join without schema/grant mutation. `4. Newest` remains alpha.23 until successful Finish.

Required before Finish:

```text
- alpha.23 list regression and alpha.24 static contract PASS
- A/H/B read, C FORBIDDEN, cross-company core/tab NOT_FOUND
- lazy cursor duplicate/missing 0 and forbidden-field scanner PASS
- core/tab DB p95 <= 250ms; API p50/p95/max/outlier recorded
- before/after schema and row counts identical; all alpha.24 mutations false
- Verify -> Plan -> Finish, push synchronization, and matching handoff
```

---

# 2.0.0-alpha.23 WAFL v2 WorkOrder List Read API Vertical Slice

- Current GPT checkpoint: `2.0.0-alpha.23` implementation and approved dev/test read-only runtime verification complete; final Verify/Finish pending.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.22`.
- Baseline commit: `4cf851a72282d86f937c31da188237c208112ff7`.
- The first v2 runtime read path is `GET /api/v2/work-orders`; no command, detail, tab, PDF, QR, or mobile API path is added.
- The route checks dev/test runtime, read feature/approval flags, approved DB fingerprint, and `wafl-fn` prefix before the DB-backed workspace guard.
- Existing workspace authentication and `workorder.read` permission supply company scope. Client `companyId`, `workOrderId`, and unsupported query parameters are rejected.
- The canonical `WorkOrderListPage`, branded primitives, 30/50 limits, error codes, and signed cursor contract are reused rather than duplicated.
- Cursor order is `(updated_at DESC, id DESC)`; cursor payload is HMAC-signed, versioned, expiring, and bound to tenant plus visibility scope.
- The list-only tenant transaction helper sends the fixed `BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime` SQL in one protocol call, then the repository executes two bounded callback statements: local RLS claims and one page-first list SQL. `X-WAFL-List-Query-Count: 2` describes those repository callback statements, not all endpoint DB protocol round trips.
- Response rows exclude storage keys, raw tokens, child lists, size/color matrices, document snapshots, and attachment metadata.
- `scripts/run-wafl-v2-alpha23-list-api.mjs` and the canonical pipeline switch provide one read-only HTTP runtime verification against the existing alpha.22 dev/test schema and synthetic seed.
- `docs/project/app-v2/20-workorder-list-read-api-evidence.md` is the canonical alpha.23 implementation/evidence record.
- The Expo mobile mock remains disconnected from the API. Root package files and dependencies are unchanged.
- Approved additive index `007_v2_work_order_list_material_lookup_index.sql` is present only on the approved dev/test target; migration ledger is 7/7 and the legacy v1 fingerprint is unchanged.
- The final approved read-only runtime log is `OK_Wafl_V2_Alpha23_List_API_Verification_2.0.0-alpha.23-20260711-210852.txt`: Company A 30-sample DB p95 `86.17ms`, API p95 `463.29ms`, Company H 100-page API p95 `481.46ms`, query count `2`, 500/5,000 cursor traversal duplicate/missing `0/0`, and all tenant/error/payload budgets PASS.
- The final runtime run changed no schema, seed, business data, R2, Worker, PDF, or production state. Earlier failure handoffs remain preserved; `4. Newest` remains unchanged until successful Finish.

Required runtime evidence before Finish:

```text
- authenticated active company A/H/B list reads and approval-pending company C `FORBIDDEN`
- company A cross-company row/ID/cursor isolation
- 500 rows / 10 pages and 5,000 rows / 100 pages, duplicate 0, missing 0
- typed auth/cursor/limit/unsupported-ID errors
- query count, payload, DB and API p50/p95/max budgets
- identical before/after schema fingerprint and v2 row counts
- schema/seed/business/R2/production mutation: all false for alpha.23
```

---

# 2.0.0-alpha.22 WAFL v2 Dev/Test Migration and Performance Evidence

- Current GPT checkpoint: `2.0.0-alpha.22`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.21`.
- Baseline commit: `6cdcaddef92f6fb02edcf0ef10dd75dd60b62c1c`.
- The canonical runner confirmed runtime `development`, approved DB fingerprint `01e5dcc7fea3`, canonical `wafl-fn` prefix, non-superuser migration owner, and a dedicated `NOLOGIN`/`NOBYPASSRLS` tenant runtime role.
- Additive migrations `001` through `006` were applied once to the approved dev/test Neon target and recorded as six matching migration-ledger rows.
- The v1 baseline fingerprint remained `e9429ac90ff17afd08843c21221bf1f1b1e2dcca574108665615ac4ece292fcc`; legacy `db/schema` and `db/migrations` source files were not changed.
- Post-apply validation found 20/20 tenant RLS tables, 44 deferred `NOT VALID` tenant FKs with zero precondition issues, and zero tenant/orphan/revision/document collisions.
- Deterministic synthetic profiles created 500, 5,000, and multi-tenant 5,400 WorkOrders, totaling 10,900 across existing `wafl-fn` companies. No R2 object was created.
- Runtime verification passed tenant isolation, audited privileged access, cursor traversal, optimistic concurrency, idempotency, finalized-revision immutability, stale readiness blocking, and 12/12 unique atomic document sequence allocations.
- Cursor traversal returned 500 rows over 10 pages and 5,000 rows over 100 pages with no duplicate or missing ID.
- List DB p95 measured 81.56ms at 500 rows and 78.88ms at 5,000 rows. Detail plus selected tab measured at most 148.74ms; indexed search p95 measured at most 79.01ms.
- List payloads measured 13,921/23,201 bytes for 30/50 at 500 rows and 13,981/23,311 bytes at 5,000 rows.
- Two runner failures were non-destructive, preserved under `Logs/Repo_Status/Failure_Handoff`, and retried only after explicit owner approval. Failure artifacts were never published to `4. Newest`.
- `docs/project/app-v2/19-v2-dev-test-migration-and-performance-evidence.md` is the canonical alpha.22 evidence record.
- App/mobile version metadata is aligned to `2.0.0-alpha.22`; no dependency changed.

Explicit mutation status:

```text
- dev/test DB schema mutation: true; additive v2 migrations 001-006 only
- dev/test synthetic test-data mutation: true; deterministic wafl-fn fixtures
- legacy v1 destructive mutation: false
- business data mutation: false
- R2/Worker/PDF mutation: false
- production mutation: false
- app/api and mobile runtime API integration: unchanged/not implemented
- root package.json/root package-lock.json: unchanged
```

---

# 2.0.0-alpha.21 WAFL v2 Additive Migration Draft and Schema Contract

- Current GPT checkpoint: `2.0.0-alpha.21`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.20`.
- Baseline commit: `0d68db472d41e8a8c03851b4396af056a69c5256`.
- This checkpoint adds six ordered additive SQL drafts under `db/v2/migrations/`; none is connected to or applied against a database.
- Every draft has an alpha.21 execution prohibition and requires future explicit development/test session gates.
- The schema draft covers tenant/document sequence foundation, WorkOrder/revision identity, relational revision content, asset snapshots, generated documents, hash-only access tokens, domain events, deferred tenant constraints, and query indexes.
- Tenant rows carry direct `company_id`; tenant-member RLS and audited privileged-system RLS are separate draft policies.
- Finalized revisions and generated-document identity/snapshots have immutable guard triggers. Corrections create a new draft revision.
- Document sequence allocation uses atomic `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING`; `max()+1` is prohibited.
- Opaque QR/document access persists `token_hash`, expiry, revoke, and rotation metadata only. Raw tokens are not stored.
- `tests/workorder-v2-migration-schema-contract.mjs` validates additive-only SQL, ordering, execution gates, RLS, immutability, token, constraints, indexes, and forbidden path stability without DB access.
- The `automation-infrastructure` Verify/Finish safety gate allows only the exact alpha.21 `001` through `006` draft paths when `APP_VERSION`/expected version is exactly `2.0.0-alpha.21`; all other migration/schema changes remain blocked.
- Static verification passes for WorkOrder API/type, migration schema, root/mobile TypeScript, Expo config, Unicode, route guards, document links/Mermaid, PowerShell encoding, Next build, and approved workflow; mutation audit remains 189 findings with 0 high-risk.
- `docs/project/app-v2/18-v2-additive-migration-draft-and-schema-contract.md` maps alpha.20 API contracts to alpha.21 schema drafts and alpha.22 dev/test gates.
- App/mobile version metadata is aligned to `2.0.0-alpha.21`; no dependency changed.

Explicitly not changed or executed:

```text
- Neon or any database connection
- migration apply or constraint validation
- Full Reset, seed, backfill, benchmark, or EXPLAIN
- existing db/schema or db/migrations
- app/api or repository implementation
- mobile runtime API integration
- R2/Worker/PDF implementation
- dev/test, business, or production mutation
- root package.json/root package-lock.json
```

---

# 2.0.0-alpha.20 WAFL v2 Source/DB Boundary and WorkOrder Contract Baseline

- Current GPT checkpoint: `2.0.0-alpha.20`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.19`.
- Baseline commit: `420c362aee4d50bcafe3325b29cba97b18e107de`.
- This patch defines architecture/type contracts only. It does not implement API routes, repositories, migrations, RLS SQL, DB access, or mobile runtime integration.
- `app/` remains Next.js web/admin/API/internal tooling and `apps/mobile/` remains the Expo customer app. Version-number folders such as `app/v2` are prohibited.
- Existing `db/schema`, `db/migrations`, `db/audits`, `db/seed`, and `db/test` stay in place. New `db/v2` contains README boundaries only and no SQL.
- `docs/project/app-v2/15-v2-source-db-boundary-and-release-policy.md` separates internal architecture generation, public app release version, source roots, legacy DB paths, migration runner policy, and future Full Reset timing.
- `docs/project/app-v2/16-workorder-api-command-read-model-contracts.md` defines branded primitives, state transitions, bounded list/detail/tab read models, granular commands, readiness, cursor, concurrency, errors, tenant/RLS, document number/revision/QR, and payload/query budgets.
- `docs/project/app-v2/17-v2-api-contract-test-plan.md` defines alpha.20 static/compile evidence and alpha.21 SQL draft / alpha.22 dev-test migration and performance gates.
- Type-only contracts live in `lib/domain/work-orders/contracts/` and are not imported by `app/api` or `apps/mobile` runtime code.
- Commands omit `companyId`, use authenticated tenant context, and require explicit `expectedVersion` for major mutations. Issue/completion commands add idempotency keys.
- WorkOrder list defaults to 30 and caps at 50 with opaque cursor pagination. Child arrays, storage keys, raw tokens, and document snapshots are forbidden in list DTOs.
- Completed/finalized revisions are never reopened. A correction creates the next draft revision with a reason.
- Company/season/item code ownership, issued-document retention, inventory lot/ledger authority, correction revision behavior, and phased RLS/system-admin policy are confirmed by the alpha.20 work order.
- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`; `/id-control` test account switching is allowed under the existing allowlist and audit contract. Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged. Regression evidence remains `system-admin-internal-access`.
- Alpha.20 completion now requires `4. Newest` to contain only the current HEAD/APP_VERSION source ZIP and matching repo-state, with matching build/verification logs under `Logs/Repo_Status`; stale or missing artifacts, incomplete `.env*` exclusion, or staged `commit-meta.md` block completion reporting.
- App and mobile version metadata is aligned to `2.0.0-alpha.20`; no dependency changed.

Explicitly not changed or executed:

```text
- existing db/schema or db/migrations
- migration/full_reset/seed SQL
- Neon or any DB connection/mutation
- app/api or DB repository implementation
- RLS SQL/application
- mobile runtime API integration
- R2/Worker/PDF implementation
- business or production data
- root package.json/root package-lock.json
```

---

# 2.0.0-alpha.19 WAFL v2 App-first v1 DB/API Performance Audit and Core Schema Design

- Current GPT checkpoint: `2.0.0-alpha.19`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.18`.
- Baseline commit: `53869e0e8fa24adabbcf5feea57059cea3c163aa`.
- This patch is a read-only repository audit and architecture design checkpoint. It does not connect to any DB or execute a benchmark.
- `docs/project/app-v2/12-v1-db-api-performance-audit.md` inventories the actual v1 schema/API/query paths and classifies KEEP/CHANGE/REPLACE/DEPRECATE/UNKNOWN decisions.
- Confirmed v1 list risks include unbounded workorder summary/full-list queries, row-by-row lateral aggregates, full material JSON aggregation, client-side full-array search, bulk-save detail N+1, and child collection delete/reinsert writes.
- `docs/project/app-v2/13-core-domain-schema-v2.md` defines the v2 target around `work_orders`, immutable `work_order_revisions`, revision-scoped relational children, generated-document snapshots, opaque QR tokens, and company-scoped cursor queries.
- The display document number uses a company-wide daily sequence in the company business timezone, keeps a stable base number, and changes only the `R0/R1/R2` suffix for revisions.
- `docs/project/app-v2/14-v2-schema-migration-and-performance-plan.md` defines additive shadow schema, deterministic backfill, bounded dual-read/write cutover, rollback, and future 500/5,000-row dev/test performance gates.
- Existing `companies`, `partners`, `materials`, material-order allocation, and size-spec patterns remain reusable with changes. `spec_sheets`, generated-PDF-as-attachment, and mixed current/snapshot responsibilities are replacement targets, not immediate deletion targets.
- App display/package metadata is aligned to `2.0.0-alpha.19`; no dependency changed.

Explicitly not changed or executed:

```text
- migration SQL or schema SQL
- app/api implementation
- DB repository/query implementation
- dev/test or production DB connection/mutation
- seed/fixture generation
- benchmark or EXPLAIN execution
- R2 object mutation
- Cloudflare Worker or PDF Worker
- mobile production-card UI
- real save/search/upload/order/share/PDF integration
- root package.json or root package-lock.json
```

Open decisions are limited to company/season/item code ownership, final document retention, inventory source-of-truth consolidation, completion correction state naming, and the future RLS/system-admin phase. Existing confirmed 30-day trash retention and tenant/session rules remain confirmed.

---

# 2.0.0-alpha.18 WAFL v2 App-first A2Z App Font Application

- Current GPT checkpoint: `2.0.0-alpha.18`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.17`.
- Baseline commit: `1ab6041c3c9b50aa3a6a668b9371fc47a6a0ca61`.
- This patch keeps the `apps/mobile` mock-only boundary and applies 에이투지체 / A2Z as the mobile/tablet app mock UI font.
- A2Z TTF assets are added under `apps/mobile/assets/fonts/a2z/` with English repo filenames for Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black.
- Font source and license tracking is recorded in `apps/mobile/assets/fonts/a2z/FONT-SOURCE.md`.
- The app screen does not show font attribution text.
- `apps/mobile/constants/fonts.ts` defines A2Z font-family tokens and runtime assets.
- `apps/mobile/app/_layout.tsx` loads the A2Z font assets with the existing Expo font runtime before rendering the app.
- `ProductionCardMock` maps existing text weights to A2Z Regular, Medium, SemiBold, and Bold so Korean labels, amount values, tabs, buttons, badges, and bottom navigation use the bundled font without overusing Black/ExtraBold.
- PDF/Worker font embedding is not implemented in this patch and must be handled in a separate PDF-specific version.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, search, inline-edit save, schema, migration, or production mutation is connected.
- No new dependency is added. Root `package.json` and root lockfile remain unchanged; `apps/mobile` package metadata is version-aligned only.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real search API/filtering
- real share-link generation
- real PDF generation or PDF font embed
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait small Korean label readability with A2Z
- iPad mini portrait tabs, bottom navigation, and button label readability
- iPad Pro landscape amount/quantity/material row readability
- Galaxy Tab portrait/landscape Korean/numeric weight balance
- Expo Web preview inspection that A2Z, not system fallback, is applied
```

---

# 2.0.0-alpha.17 WAFL v2 App-first Inline Edit Visual Language and Production Flow Simplification

- Current GPT checkpoint: `2.0.0-alpha.17`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.16`.
- Baseline commit: `1c9737611dbfb9236ebc1fad9955124554d512da`.
- This patch keeps the `apps/mobile` mock-only boundary and corrects alpha.16 editable-value affordance that still felt like repeated boxed inputs.
- Fabric/accessory rows now read as compact material summary cards: item identity, status, summary tokens, amount line, and note.
- Editable values in `입력중` rows use subtle dotted underline/value emphasis instead of small rectangular field boxes.
- Rows in `발주요청` or `완료` continue to remove editable affordance and read as locked/read-only mock rows.
- The production-flow six-step rail is preserved as a high-level `발주 · 자재 · 재단 · 공정 · 검수 · 출고` summary.
- The detailed step-by-step list under the rail is removed and replaced by a compact note so the mock does not imply every base step must be manually managed.
- The actual management target is concentrated in the process-detail rows under `공정 단계 안의 세부 공정`.
- Process detail rows now show process name, partner, status badge, compact meta tokens, memo, and amount instead of repeated boxed fields.
- Existing section tab alignment, production-card search mock, bottom navigation Korean icon labels, and `작지 발주` local mock CTA are preserved.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, search, inline-edit save, schema, migration, or production mutation is connected.
- No new dependency, font file, or external image asset is added.
- Root `package.json` and root lockfile remain unchanged; `apps/mobile` package metadata is version-aligned only.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real search API/filtering
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait material/accessory row scan speed and dotted editable affordance review
- iPad mini portrait material/accessory card height and summary-token wrapping review
- iPad Pro landscape production-flow rail plus simplified process-detail review
- Galaxy Tab portrait/landscape locked/requested/completed read-only distinction review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.16 WAFL v2 App-first Tab Alignment and Editable-Affordance UX Correction

- Current GPT checkpoint: `2.0.0-alpha.16`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.15`.
- Baseline commit: `2e5ba9ca8e4cd884e1ffc788b1977533c38d8181`.
- This patch keeps the `apps/mobile` mock-only boundary and corrects navigation, search, and editable-value readability found after the alpha.15 icon-library pass.
- Mobile and tablet section tabs remain visible and horizontally scrollable, but tab items now use more stable centered alignment, wider spacing, and a centered active underline.
- Tablet tab rows are balanced inside the production-card width instead of reading as a left-pushed row.
- A compact mock search field is added under `제작 카드 목록` so product/style, factory/vendor, due date, and status search location is clear without connecting a real search API.
- Fabric/accessory rows now show subtle editable field affordance only while the row is `입력중`.
- Rows in `발주요청` or `완료` no longer show editable affordance and read as locked/read-only mock rows.
- Production-flow detail rows show subtle editable affordance for partner, quantity, due date, unit, unit price, status, and memo while the process is not complete.
- The bottom navigation no longer exposes unexplained `C/I/D/S` letters. It uses Lucide icons plus Korean labels for 카드, 이미지, 문서, and 설정.
- The production-flow rail remains six steps and the connector line ends at `출고`.
- `작지 발주` remains a local mock confirmation flow only.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, search, inline-edit save, schema, migration, or production mutation is connected.
- No new dependency, font file, or external image asset is added. Existing `lucide-react-native` icons from alpha.15 are reused.
- Root `package.json` and root lockfile remain unchanged; `apps/mobile` package metadata is version-aligned only.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real search API/filtering
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait section tab centering, horizontal scroll discoverability, and bottom nav readability
- iPad mini portrait tab spacing and 제작 카드 목록 search field review
- iPad Pro landscape tablet tab row balance and editable field affordance review
- Galaxy Tab portrait/landscape production rail ending and bottom nav review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.15 WAFL v2 App-first Icon Library Adoption

- Current GPT checkpoint: `2.0.0-alpha.15`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.14`.
- Baseline commit: `32c56058a515b59229cee11152e73ea9cc123357`.
- This patch keeps the `apps/mobile` mock-only boundary and replaces the remaining hand-drawn/temporary action icon grammar with a real React Native icon library.
- Added `lucide-react-native` to `apps/mobile` for cross-platform production action icons.
- Added `react-native-svg` to `apps/mobile` through Expo-compatible install because Lucide React Native renders SVG icons.
- License/package metadata checked: `lucide-react-native@1.24.0` is ISC; `react-native-svg@15.15.3` is MIT.
- The mobile mock now uses a single WAFL icon wrapper/mapping for photo, camera, sketch, attachment, crown, folder, save, plus, ruler, palette, document request, work-order CTA, preview, share, print, undo, check, delete, search, notification, and more actions.
- Temporary inline icon drawings were removed from `ProductionCardMock.tsx`; action meaning is now controlled through the central icon mapping.
- Per-item material/accessory `발주` remains separate from the global `작지 발주` CTA.
- The production-flow rail track no longer stretches to the full container width, so the line ends at the `출고` dot instead of continuing past it.
- `작지 발주` remains a local mock confirmation flow only.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, schema, migration, or production mutation is connected.
- No font files or external image assets are added.
- Root `package.json` and root lockfile remain unchanged; dependency changes are limited to `apps/mobile/package.json` and `apps/mobile/package-lock.json`.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait icon readability and work-order CTA review
- iPad mini portrait selector width and icon/label wrapping review
- iPad Pro landscape material row action/status distinction review
- Galaxy Tab portrait/landscape production rail ending review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.14 WAFL v2 App-first UI Polish + Work Order CTA Mock

- Current GPT checkpoint: `2.0.0-alpha.14`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.13`.
- Baseline commit: `ba43ded540ae97332827e0eb2696a696d7d1d3f8`.
- This patch keeps the `apps/mobile` mock-only boundary and applies field-feedback polish after alpha.13.
- Image/attachment icons are tightened with dependency-free photo, camera, sketch, attachment, and clearer crown-like representative-image marks.
- The decorative hanger line/hook is removed from the garment preview so the image area reads as production reference, not unexplained ornament.
- Size/color current-value selectors now use stable fixed widths for gender, category, and unit so `cm`/`inch` changes do not shift the row.
- Size/color load/save/add actions now include dependency-free helper icons for folder, save, row add, measure, and swatch add.
- Fabric/accessory row actions use short field language: `발주`, `완료`, `취소`, and `삭제`; the action buttons are visually separated from status badges.
- Material order icons avoid send/mail/airplane metaphors and use document request, undo, check, and delete shapes.
- The production-flow rail keeps one continuous line ending at the shipping step, and the current step receives stronger dot/label/status emphasis.
- A global `작지 발주` document CTA is added to the top summary card as local mock state only.
- Clicking `작지 발주` opens an in-screen confirmation panel with readiness checks and a mock `작지 출력 및 발주 완료` action.
- After the mock completion, the production rail marks `발주` as complete and derives the `자재` step from the current fabric/accessory statuses.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, schema, migration, or production mutation is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait image icon and work-order CTA review
- iPad mini portrait selector width and confirmation panel review
- iPad Pro landscape material row action/status distinction review
- Galaxy Tab portrait/landscape production rail current-step review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.13 WAFL v2 App-first Alpha.12 UX Follow-up Correction

- Current GPT checkpoint: `2.0.0-alpha.13`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.12`.
- Baseline commit: `c6fd1d831066d70e44d496a83eb375aeaefba116`.
- This patch keeps the `apps/mobile` mock-only boundary and corrects the alpha.12 UX items that still read too much like visible settings, bottom action rows, or segmented process fragments.
- Image/attachment actions now use dependency-free visual helper icons for photo, camera, sketch, attachment, and representative selection instead of ambiguous text symbols or emoji-like glyphs.
- The carousel keeps the focused image centered, floats the stable `n / total` counter, centers the caption area, and hides memo by default.
- Image titles remain optional: real titles are shown only when present, while fallback labels such as `사진 2` or `스케치 1` stay visually small and non-mandatory.
- Size/color selectors now show only current-value buttons such as `공용`, `상의`, and `cm` on the default screen; option piles are not permanently exposed.
- Size template load/save and size/body-part add actions remain grouped at the same top level without listing every saved template by default.
- Fabric/accessory row actions move onto the unit/price/amount line so repeated rows stay shorter and the user's eye reads amount plus allowed action together.
- `발주요청` stays text-first and no longer depends on a send/mail/airplane-like action symbol.
- Completed material/accessory rows remain read-only and expose no action buttons.
- The six-step production-flow rail now uses one continuous horizontal line with evenly placed dots, labels, and statuses on the same center axis.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait image carousel/action icon review
- iPad mini portrait current-value selector review
- iPad Pro landscape material row amount/action alignment review
- Galaxy Tab portrait/landscape continuous production rail review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.12 WAFL v2 App-first Alpha.11 UX Follow-up Correction

- Current GPT checkpoint: `2.0.0-alpha.12`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.11`.
- Baseline commit: `670447c3d577c15858d75e1aca101654f52bac61`.
- This patch keeps the `apps/mobile` mock-only boundary and follows up on alpha.11 UX feedback before moving to output/share deepening.
- Image/attachment carousel alignment is tightened: the active image remains centered with stable left/right navigation, centered index pills, and a clear `n / total` indicator.
- Image titles are treated as optional. Empty title mock rows fall back to safe labels such as `사진 2`, `스케치 3`, or `첨부 이미지`.
- Photo, camera, sketch, and attachment actions keep text labels and use dependency-free helper symbols without emoji-style meaning drift.
- Size/color controls change from always-visible chip piles to current-value selectors for gender, product category, and unit.
- Saved size templates are no longer listed on the default screen; only the current configuration is shown, with load/save actions separated from direct size/body-part edit actions.
- Fabric/accessory rows keep status labels in a fixed row position, use row border color only as secondary status support, and move allowed actions to a consistent action row.
- Order request uses a request/check style helper symbol and explicit `발주요청` text, not a send/mail/airplane-like arrow.
- Completed material/accessory rows remain read-only and expose no action buttons.
- The six-step production-flow rail keeps `발주`, `자재`, `재단`, `공정`, `검수`, and `출고`, while dot, step label, and status are aligned on the same center axis.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait image carousel/index/action review
- iPad mini portrait size selector and table-action review
- iPad Pro landscape material row status/action alignment review
- Galaxy Tab portrait/landscape production-flow rail review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.11 WAFL v2 App-first UX Correction

- Current GPT checkpoint: `2.0.0-alpha.11`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.10`.
- Baseline commit: `00fa7cd5380f8790ca9d1b2a0916b8c043c8b870`.
- This patch keeps the `apps/mobile` mock-only boundary and corrects practical UX issues found after alpha.10.
- Image/attachment now uses a single-image carousel card with left/right movement, current index, representative-image state, separate representative/delete controls, and no visible "tap for detail" instruction.
- Attachment rows show filename, file type, output include/exclude, and upload timestamp in `YYYY.MM.DD HH:mm:ss` mock format.
- The overview removes ambiguous trading/production and short memo rows. It shows participating companies and a stronger next-check work card instead.
- Size/color now starts from gender, product category, unit, and saved template load/save mock controls. The size table removes the generic division column and uses `size / chest / length / shoulder / sleeve`; color rows include small swatches.
- Fabric and accessory status flow is simplified to `입력중`, `발주요청`, and `완료`: editable/request/delete, complete/cancel/delete, and read-only respectively.
- The six-step production rail remains `발주`, `자재`, `재단`, `공정`, `검수`, `출고`, with more centered spacing and clearer current-step emphasis.
- No nested button pattern is intentionally added. Carousel image navigation, thumbnail selection, and action controls are sibling press targets.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait carousel and material status review
- iPad mini portrait size/color and attachment timestamp review
- iPad Pro landscape centered production-flow rail review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.10 WAFL v2 App-first Icon Action Interpretability Polish

- Current GPT checkpoint: `2.0.0-alpha.10`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.9`.
- Baseline commit: `57889601e9de78bf3e5fecf13bc3feee23380f0f`.
- This patch keeps the `apps/mobile` mock-only boundary and polishes action/icon interpretability after alpha.9 field feedback.
- Image/attachment top actions now read as photo, camera, sketch, and attachment entry points with compact icon captions instead of ambiguous standalone symbols.
- Image thumbnails now carry the detail-view affordance on the thumbnail itself, while the separate tile action cluster is reduced to representative-image and delete controls.
- Fabric and accessory row action clusters use a consistent grammar for current-state action, lock/edit state, view, delete, and optional photo selection.
- Status-based primary actions still expose only one current action: order request, order completion, or information check.
- Size-add and color-add actions move beside their relevant size-template and color-list areas as compact `+` chips instead of detached large buttons.
- The six-step production-flow rail expands across the available width more evenly, while detailed process rows remain grouped below.
- No nested button pattern is intentionally added. Thumbnail detail press areas and action buttons remain sibling controls.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, auth, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait icon-caption density review
- iPad mini portrait action cluster review
- iPad Pro landscape production-flow rail review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.9 WAFL v2 App-first Button and Action Cluster UX Polish

- Current GPT checkpoint: `2.0.0-alpha.9`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.8`.
- Baseline commit: `7fdc3a4c05ad8879512a5903a6aa780bdfcbf9aa`.
- This patch polishes the `apps/mobile` mock button/action grammar instead of adding real feature integration.
- Fabric and accessory rows remove repeated bottom text primary buttons. The current state action moves into the row-top action cluster beside the status badge.
- Fabric and accessory add entry points move to the section header as compact `+` icon buttons.
- Row-level editing is represented as inline-edit affordance text, while locked/completed rows show read-only/locked direction.
- Image/attachment restores a compact top action row for image upload, camera, sketch, and attachment mock entry points without connecting real picker/camera/sketch/upload behavior.
- Production flow rail spacing and process structure are clarified: the six baseline steps remain the top rail, and detailed process items are grouped inside the process step.
- Flow addition is treated as an advanced/exception mock direction; the default visible `+` action focuses on process addition.
- Output/share keeps the document workbench and uses a more consistent compact icon action row for view/share/print/save/save-delivery placeholders.
- No nested button pattern is intentionally added. Button-like actions stay in separated action clusters rather than inside another button tile.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, auth, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column action-density review
- iPad mini portrait action cluster review
- iPad Pro landscape production-flow rail review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.8 WAFL v2 App-first Real-Use UX Alignment Correction

- Current GPT checkpoint: `2.0.0-alpha.8`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.7`.
- Baseline commit: `fe9c9cef17ab1f84522ef1bbdd3370432555cf15`.
- This patch corrects the `apps/mobile` mock toward real apparel-production usage instead of adding real feature integration.
- Customer-facing mock screens no longer show internal production-card IDs such as `WAFL-2408-119` in the list, header, or document preview.
- Image tiles now behave like thumbnail-first visual references: no per-image title/description input burden on the default surface, with representative-image crown/selection and detail/delete affordances only.
- The first-image auto-representative rule, representative fallback direction, and no-real-camera/file-picker/upload boundary are shown as mock copy only.
- Attachment mock rows now follow the existing WAFL/R2 allowed file shape by using image/PDF examples only; `.txt` and `.xlsx` examples were removed from the mobile mock.
- Factory delivery memo is represented as a separate editable-looking field, not as an attached text file.
- Size/color now shows only the selected unit (`cm` or `inch`) in the measurement table; the same cell no longer mixes both units.
- Size/color includes visible size-add and color-add mock actions plus product-type template suggestions for top, bottom, one-piece, outer/jumper, and sweatshirt/overall patterns.
- Fabric and accessory rows no longer expose `E`/`L` letters. Row actions use compact icon-like controls for lock/read, view, edit, delete, and optional photo selection while preserving one current primary action.
- Fabric/accessory item photo is presented as optional only; default item entry is not blocked by a missing photo.
- Production flow now uses the baseline six steps: order, material, cutting, process, inspection, and shipping. Statuses are simplified to `준비`, `작업중`, and `완료`.
- Cutting is displayed as a removable default step, and process addition is separated from flow-step addition.
- Output/share keeps the alpha.7 document workbench but reduces repeated row action clusters and focuses on document setting, included items, and delivery-request summaries.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, auth, order, delivery, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column production-card flow review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.7 WAFL v2 App-first Signature UI Correction

- Current GPT checkpoint: `2.0.0-alpha.7`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.6`.
- Baseline commit: `396b90dec09b1746d519d7dbf96e434ff8b07894`.
- This patch strengthens the `apps/mobile` mock as a WAFL signature production-card UI instead of adding real feature integration.
- The production-flow tab now includes a compact progress rail from `발주 요청` through `출고 준비`, with WAFL-specific handoff states such as `전달 준비`, `공정 메모 필요`, and `납기 확인 필요`.
- The production-flow detail remains a mock factory/process preparation surface. It does not become a real-time production tracker, drag system, or long-press implementation.
- The output/share tab now includes a document preview/workbench mock: document list, selected production-document sheet preview, included information chips, delivery-request summary, and compact icon actions.
- Icon-style actions are kept dependency-free with `View`/`Text`/`Pressable` grammar because no new icon dependency is added.
- The image tile structure no longer nests an action `Pressable` inside an outer image-tile `Pressable`; the tile is a container and the delete action is the only button-like control in that tile.
- Existing alpha.5 visual fidelity and alpha.6 production-card wording are preserved.
- Image/attachment mock deepening, representative-image UX rules, and camera/photo/attachment placeholder details are deferred to `2.0.0-alpha.8`.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, auth, order, delivery, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column production-card flow review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.6 WAFL v2 App-first /ui Alignment Correction

- Current GPT checkpoint: `2.0.0-alpha.6`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.5`.
- Baseline commit: `1ee39d6f54a49d49468c21eae55b267bd905c7b9`.
- This patch aligns the `apps/mobile` mock with the settled `/ui` production-card flow instead of adding real features.
- The mobile mock now emphasizes the production-card input, order, factory-delivery, document, and delivery-request flow from the `/ui` baseline.
- A compact tab-aware `다음 확인` panel replaces a generic assistant feeling and shows the next business check for overview, image/attachment, size/color, fabric, accessory, production flow, and output/share.
- The production-flow section is reframed away from generic production-progress tracking and toward `제작 공장 + 추가 공정 + 공장 전달 준비`.
- Production-flow wording now uses WAFL-specific checks such as `공장 전달 준비`, `공정 메모 필요`, and `납기 확인 필요`, rather than generic `진행 예정`, `일정 확인`, or `대기`.
- Output/share now shows document type and included information first, then compact view/share/print/save mock actions.
- Delivery-request rows show one origin, one destination, multiple items, contact confirmation, and delivery memo.
- Size/color user-facing wording is kept as `사이즈·색상` across the mobile mock and updated App-first docs.
- Image/attachment deepening, representative-image UX rules, and camera/photo/attachment placeholder details are deferred to `2.0.0-alpha.8`.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, auth, order, delivery, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column production-card flow review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.5 WAFL v2 App-first Visual Fidelity Correction

- Current GPT checkpoint: `2.0.0-alpha.5`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.4`.
- Baseline commit: `8666afbeb67d71826463f27e2f388db256532e6d`.
- This patch corrects the `apps/mobile` mock visual fidelity after App Design Theme v1 adoption.
- Scope is visual foundation only: no new feature integration and no real DB, API, R2, PDF Worker, upload, camera, file picker, share, auth, order, or delivery mutation.
- The runtime app no longer shows a design-explanation strip. Theme language remains in docs, while the app surface behaves like a production tool.
- The mock reduces repeated boxed-card feeling with softer list rows, line-based metrics, compact tab treatment, and practical workbench spacing.
- Representative image, list thumbnail, output preview, and material/accessory rows use React Native `View`/`Text` based garment and swatch placeholders instead of plain text boxes or external assets.
- Mobile remains portrait-first for normal production-card screens. Tablet portrait/landscape keeps a centered workbench with restrained width and no heavy desktop admin three-panel layout.
- Status-based material/accessory rows still expose only one current primary action.
- Image/attachment deepening, representative-image UX details, and camera/photo/attachment placeholder rules are deferred beyond `2.0.0-alpha.6`.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.
- Expo generated local outputs such as `.expo` and `apps/mobile/node_modules` are not source deliverables and must not be committed or included in source ZIP handoff.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column visual fidelity review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.4 WAFL v2 App Design Theme v1 and Mobile Mock Redesign

- Current GPT checkpoint: `2.0.0-alpha.4`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.3`.
- Baseline commit: `2c7cadf3ae9a4ec99a505ccfaf71482e1a457f8d`.
- This patch adds the first App-first visual foundation document: `docs/project/app-v2/11-app-design-theme-v1.md`.
- Theme direction: `동대문 제작 워크룸 / Dongdaemun Atelier Ops`.
- `apps/mobile` is redesigned as a mock-only professional production workroom surface with warm paper/off-white base, deep navy primary, brick orange/thread amber production accents, and deep olive completion states.
- The mobile mock keeps normal production-card screens portrait-first and uses compact, information-dense cards rather than large portfolio-style samples.
- Tablet mock behavior is represented as a centered/wide workbench with a production-card list and selected card detail, without turning into a heavy desktop admin three-panel layout.
- Status-based row actions now expose only one current primary action: input/check guidance, `발주 요청`, `발주 완료`, or no action for completed rows.
- Font files, external images, new dependencies, real camera/file/upload/share/PDF/API/DB/R2/Worker connections, and root package metadata changes are still not added.
- Expo generated local outputs such as `.expo` and `apps/mobile/node_modules` are not source deliverables and must not be committed or included in source ZIP handoff.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column review
- iPad mini portrait review
- iPad Pro landscape centered-width review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.3 WAFL v2 App-first Production Card Mock UX

- Current GPT checkpoint: `2.0.0-alpha.3`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.2`.
- Baseline commit: `3dad6e86956f59e8699fd350a319cdb8b483cc57`.
- This patch improves the Expo skeleton into a visually inspectable mock production-card app screen.
- `apps/mobile` now shows a richer mock-only production card with top production summary, image/attachment, size/color, fabric, accessory, production flow, output/share, and delivery-request sections.
- The mobile app remains React Native primitive based and does not add dependencies.
- The app display version is aligned to `2.0.0-alpha.3`.
- Expo generated local outputs such as `.expo` and `apps/mobile/node_modules` are not source deliverables and must not be committed or included in source ZIP handoff.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column review
- iPad mini portrait review
- iPad Pro landscape centered-width review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.2 WAFL v2 App-first Expo Skeleton and Public Web Boundary

- Current GPT checkpoint: `2.0.0-alpha.2`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.1`.
- Baseline commit: `e0332307604d99e6a63b68f14d3aef71f44a5c77`.
- This patch creates the first App-first Expo React Native skeleton under `apps/mobile`.
- Expo SDK choice: SDK 55, because it supports Node `20.19.x` and the owner environment is Node `20.20.2`.
- The mobile skeleton is mock-only and shows 제작 카드 navigation for 개요, 이미지·첨부, 사이즈·색상, 원단, 부자재, 제작 플로우, and 출력·공유.
- `www.wafl.co.kr` is recorded as the public WAFL app landing site for app introduction, download area, pricing, examples, Instagram CTA, inquiry, trial request, and waitlist.
- `/ui`, `/roadmap`, and `/functions` are now localhost-only development check routes.
- `/system` and `/workspace` are documented as long-term removal targets, but no route is deleted in this patch.
- New version line: `2.0.0-alpha.2`.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

---

# 2.0.0-alpha.1 WAFL v2 App-first Transition Documentation

- Current GPT checkpoint: `2.0.0-alpha.1`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.27`.
- Baseline commit: `a35a4e0f1ccb714f5146cd5a29aeb973c025fdc7`.
- `0.30.0-alpha.27` is the final committed/pushed `/ui` production-card design baseline before the App-first transition.
- This patch starts the WAFL v2 App-first line.
- Customer-facing product direction moves to Expo React Native mobile/tablet app first.
- Next.js remains for system admin, customer admin advanced settings, operations, API, file/PDF/R2/Worker integration, `/ui` design showroom, internal docs, and test console.
- This patch is documentation and version alignment only.
- No Expo project is created in this patch.
- New version line: `2.0.0-alpha.1`.

Explicitly not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real app implementation
- Expo skeleton
- package dependency
- lockfile
- production behavior
```

---

# 0.30.0-alpha.27 WAFL v2 /ui Image/Attachment Compression and Output/Share Delivery Correction

- Current GPT checkpoint: `0.30.0-alpha.27`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.26`.
- This patch continues from the uncommitted alpha.13 through alpha.26 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to reduce visible image/attachment noise, move attachment inclusion selection to output/share, and compact delivery-request rows without wiring real services.
- New version line: `0.30.0-alpha.27`.

## 0.30.0-alpha.27 checkpoint

The `/ui` internal WAFL v2 showroom now treats the image tab as a thumbnail-first representative-image picker and the output/share tab as the place where document attachments are selected.

The correction demonstrates:

```text
- User-facing "이미지 자산 목록" wording is changed to "이미지 목록".
- Image items are reduced to thumbnail placeholder, crown representative selector, and delete icon.
- File name, long note, source badge, visible preview eye icon, and "대표" text are removed from the default image list.
- Image preview opens by clicking the thumbnail/item, with file name and type shown inside the preview mock.
- Crown representative selection, header reflection, representative deletion fallback, and no-image state from alpha.26 remain intact.
- Attachment rows remove preview eye icon, production-document checkbox, and included/not-included badges.
- Attachment inclusion is selected from output/share through an included-attachment area and attachment picker mock.
- Selected attachments can be removed from the output/share chip list.
- Output/share shows the representative image as a small thumbnail instead of a filename string.
- 작업지시서 and 공장 전달 작업지시서 rows remove the visible preview eye icon and use row selection for preview mock.
- Delivery-request rows remove the repeated 배송요청 badge, align row height, compress item lists to "외 n개", and show long memo only in detail mock.
- Delivery-request share/print/save actions are icon-only, with mobile and tablet favoring compact/bottom-sheet style mocks.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real file preview API
- real image drawing, edit, or camera capture tooling
- real share-link generation
- real PDF generation
- real order mutation
- real delivery-request API
- real process/unit/size management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` image density, attachment-selection location, document row behavior, and delivery-request presentation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.26 WAFL v2 /ui Image Asset Structure and Production Summary Correction

- Current GPT checkpoint: `0.30.0-alpha.26`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.25`.
- This patch continues from the uncommitted alpha.13 through alpha.25 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to show multi-image assets, representative-image selection behavior, attachment inclusion, compact card actions, production-summary cost structure, and inch fraction entry without wiring real services.
- New version line: `0.30.0-alpha.26`.

## 0.30.0-alpha.26 checkpoint

The `/ui` internal WAFL v2 showroom now treats images and attachments as managed Sheet assets instead of fixed upload slots.

The correction demonstrates:

```text
- Image/photo/sketch/reference files appear as a list of image assets with file-like names, source type, thumbnail placeholders, preview, representative selector, and delete action.
- The first added image becomes representative automatically when no image exists.
- Deleting a non-representative image keeps the selected representative image.
- Deleting the representative image selects the first remaining image, and deleting the last image leaves the Sheet with no representative image.
- The selected representative image is reflected immediately in the Sheet header and output/share mock; the header also supports the no-image state.
- Attachments are separate from image assets and include a mock "제작 문서에 포함" toggle that is reflected in output/share.
- Mobile image/photo/sketch/attachment add actions are icon-first, and sketch uses the palette/brush visual language.
- Fabric/accessory row order-request and order-complete actions sit in the top-right row action cluster instead of bottom-heavy buttons.
- The Sheet header no longer repeats unit/total cost; overview "제작 요약" carries 한벌 단가, 총 예상, 원단 총액, 부자재 총액, and 공정 총액.
- Overview no longer repeats status, and 로스/여유 비용은 별도 항목이 아니라 발주수량 x 단가에 포함되는 기준으로 설명된다.
- Size/color inch mode includes a mock fraction helper with integer input plus none, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, and 7/8 choices.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real image drawing, edit, or camera capture tooling
- real share-link generation
- real PDF generation
- real order mutation
- real delivery-request API
- real process/unit/size management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` asset management, representative-image behavior, compact actions, production-summary wording, and size helper behavior, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.25 WAFL v2 /ui Image, Size/Color, Output/Share, and Confirmation Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.25`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.24`.
- This patch continues from the uncommitted alpha.13 through alpha.24 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to show image/attachment management, size/color structure, output/share inclusion, representative-image selection, and confirmation-first material actions without wiring real services.
- New version line: `0.30.0-alpha.25`.

## 0.30.0-alpha.25 checkpoint

The `/ui` internal WAFL v2 showroom now shows the production-card flow as image-first, size/color-aware, and confirmation-first.

The correction demonstrates:

```text
- Image/attachment is promoted to a first-class section tab with representative image selection.
- The selected representative image is reflected in the production summary and output/share mock.
- Size/color is a separate section with size-system selection, size chips, measurement table, unit toggle, and color quantity rows.
- Output/share states that the generated document includes representative image, size/color, material, process, and memo data.
- Material delete, order request, order-missing, and order-complete actions open confirmation mock panels instead of implying immediate execution.
- Process rows are thinner inline-edit rows instead of heavy nested cards.
- Mobile keeps the same section flow and shows confirmation as a bottom-sheet mock with safe-area padding.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real image drawing or edit tooling
- real share-link generation
- real PDF generation
- real order mutation
- real delivery-request API
- real process/unit/size management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` section structure, representative-image flow, confirmation panels, size/color entry, and output/share wording, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.24 WAFL v2 /ui Overview Summary and Card Action Grammar Correction

- Current GPT checkpoint: `0.30.0-alpha.24`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.23`.
- This patch continues from the uncommitted alpha.13 through alpha.23 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to simplify the overview summary, move work-needed counts to fabric/accessory tab badges, and unify material/process card action placement.
- New version line: `0.30.0-alpha.24`.

## 0.30.0-alpha.24 checkpoint

The `/ui` internal WAFL v2 showroom now presents the production-card hub with fewer repeated statuses and clearer row-level actions.

The correction demonstrates:

```text
- Overview keeps only quantity, due date, estimated unit cost, estimated total, and one plain status line.
- Overview shortcut buttons for fabric input/order, accessory input/order, and output/share are removed.
- Fabric/accessory work-needed counts move to small warning tab badges instead of repeated summary badges.
- Fabric/accessory section summaries are text-centered lines, not rows of competing badges.
- Material rows show status, lock/unlock icon, and delete icon in the top-right action cluster.
- Material primary actions sit at the lower/right edge with send/check icons for order request and order completion.
- Locked material rows no longer show visible "수정 잠김" text; the state is communicated with a lock icon and quieter row treatment.
- Process content keeps the `제작 플로우` title but uses the same card grammar for 제작 공장 and additional process cards.
- Process cards show process, factory/partner, quantity, unit, unit price, amount, due date, drag-handle mock, and delete icon.
- Process address/contact/change/copy/up-down/detail actions are removed from the default screen.
- Assistant is reduced to current blocker, next recommendation, and output/share availability.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real delivery-request API
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` summary density, tab badges, material actions, and process card grammar, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.23 WAFL v2 /ui Fixed Panel Scroll and Action Reduction Correction

- Current GPT checkpoint: `0.30.0-alpha.23`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.22`.
- This patch continues from the uncommitted alpha.13 through alpha.22 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to make PC/tablet frames read as fixed-height work panels with internal scroll, reduce unnecessary global actions, and simplify the production flow/output sections.
- New version line: `0.30.0-alpha.23`.

## 0.30.0-alpha.23 checkpoint

The `/ui` internal WAFL v2 showroom now presents the production-card prototype as a fixed work hub rather than a long page.

The correction demonstrates:

```text
- Desktop uses fixed-height Product Explorer / central production card / Assistant panels, with internal scroll per panel.
- Tablet landscape uses fixed-height product list, work area, and Assistant regions; tablet portrait uses a drawer-style product selector mock instead of a permanent long selector above the work area.
- Mobile removes global fabric/accessory add buttons and shows add actions only inside the active fabric or accessory section.
- Fabric/accessory row actions are limited to order request, order completion, and delete where appropriate.
- Requested/ordered/received/done material rows read as locked/read-only with muted treatment and a lock indicator.
- Top production summary avoids repeating product type, quantity, due date, and production status.
- Metrics are compacted to a few badges plus text instead of awkward badge rows.
- Factory/process is titled 제작 플로우 and shows representative factory details plus additional process rows with reorder/copy/delete icon actions.
- Output/share removes duplicate summary/contact blocks and keeps document and delivery-request row-level actions.
- Assistant remains focused on current blockers, recommendation, missing/unordered items, and output/share availability.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real delivery-request API
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` responsive layout, panel scrolling, action placement, and output/process wording, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.22 WAFL v2 /ui Assistive Feature Exposure and Factory/Process Structure Correction

- Current GPT checkpoint: `0.30.0-alpha.22`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.21`.
- This patch continues from the uncommitted alpha.13 through alpha.21 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom simplification only. The goal is to reduce assistive-function exposure on default fabric/accessory/output screens and clarify representative factory plus additional-process structure.
- New version line: `0.30.0-alpha.22`.

## 0.30.0-alpha.22 checkpoint

The `/ui` internal WAFL v2 showroom now keeps the default production-card screen more focused.

The correction demonstrates:

```text
- Fabric and accessory default sections show item rows, quantity math, order status, add/order/view-all actions, and next actions first.
- Input source, supplier import, stock import, previous-record copy, unit reference, and similar assistive functions move into drawer/editor mock surfaces.
- Accessory category chip/summary space is removed from the default view; category remains as row-level supporting information.
- Output/share removes top-level common view/share/print buttons and keeps actions on each document or delivery-request row.
- Quick delivery memo is represented through delivery-request creation and request rows, not as a standalone document row.
- Factory/process defaults to representative production factory information plus additional process rows.
- Sewing is treated as the normal representative production-factory work, while special sewing can still appear as an additional process exception.
- Assistant repeats less section detail and focuses on current blockers, next recommended action, missing/unordered warnings, and output/share availability.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real delivery-request API
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` density, action placement, output/share behavior, and factory/process structure, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.21 WAFL v2 /ui User Wording, Loss/Allowance Ordering, Output/Share, and Quick Delivery Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.21`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.20`.
- This patch continues from the uncommitted alpha.13 through alpha.20 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom wording and mock-flow correction only. The goal is to remove awkward Sheet/PDF-heavy user wording, clarify loss/allowance ordering, and show document output plus quick delivery request flow.
- New version line: `0.30.0-alpha.21`.

## 0.30.0-alpha.21 checkpoint

The `/ui` internal WAFL v2 showroom now uses more natural user-facing Korean wording and clearer ordering/delivery flows.

The correction demonstrates:

```text
- User-facing showroom copy avoids Sheet/시트 wording and uses 제작 카드, 제작 요약, 출력·공유, 작업지시서, 공장 전달 작업지시서, and 퀵 전달 메모.
- Top product summary removes current-PDF style metric wording and focuses on product type, quantity, due date, unit cost, total amount, and production state.
- Fabric/accessory rows show required quantity, loss/allowance quantity, stock use, order quantity, total required quantity, leftover quantity, and leftover handling.
- Leftover/over-order handling is represented as no leftover, factory allowance, loss included, stock conversion, or all used in current production.
- Unit and process selection are shown as unified chip lists with small company-standard labels instead of large system/company splits.
- Output/share tab uses document names without repeating PDF in each title.
- Document rows expose short view/share/print actions with icon-centered controls.
- Quick delivery request mock groups selected items by one origin, one destination, and a delivery memo, showing when multiple requests are needed.
- Long factory, supplier, address, and contact values use wrapping definition-list rows rather than fixed-height boxes.
- Section tabs, device switcher, document actions, and mobile tabs use centered/even icon-first alignment.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real process/unit management API
- real delivery request API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` terminology, ordering math presentation, output/share wording, and quick delivery flow, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.20 WAFL v2 /ui Card Reduction and PDF-Friendly Sheet Layout Correction

- Current GPT checkpoint: `0.30.0-alpha.20`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.19`.
- This patch continues from the uncommitted alpha.13 through alpha.19 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom layout correction only. The goal is to reduce excessive nested card/box visuals and make the central WAFL Sheet read more like a paper/PDF-friendly production document.
- New version line: `0.30.0-alpha.20`.

## 0.30.0-alpha.20 checkpoint

The `/ui` internal WAFL v2 showroom now uses fewer small cards and presents Sheet data as larger sections with document-like rows.

The correction demonstrates:

```text
- Sheet summary header uses a product thumbnail plus one compact document summary line instead of metric boxes.
- Input source, unit reference, and process reference examples are shown as toolbar/chip rows inside the Sheet section.
- Overview uses definition-list style rows for cost, missing data, order readiness, factory delivery, and current PDF status.
- Fabric/accessory preview items are table-like rows inside one section card, not many separate item cards.
- Accessory categories are shown as compact chips while the item list remains row-based.
- Process delivery details and process steps use definition rows and reorderable row lists instead of nested cards.
- PDF/share uses a current PDF document block, included-information summary, PDF-purpose rows, and delivery definition rows.
- Assistant summary is reduced to a next-action panel plus compact Sheet context rows.
- Mobile header replaces small summary boxes with one compact total/current-PDF metadata line.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` layout density and PDF-friendly Sheet presentation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.19 WAFL v2 /ui Material Input, Status, Unit, and Process Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.19`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.18`.
- This patch continues from the uncommitted alpha.13 through alpha.18 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom material/accessory input clarity, simplified order status, mobile editor mock, unit/process reference use, and small-frame typography correction only.
- New version line: `0.30.0-alpha.19`.

## 0.30.0-alpha.19 checkpoint

The `/ui` internal WAFL v2 showroom now makes material/accessory entry easier to understand, especially on mobile.

The correction demonstrates:

```text
- Fabric/accessory user-facing status is simplified to input, orderable, order requested, or order completed meanings.
- Received/inbound/inventory reflection language is hidden from the main Sheet input screen.
- Abstract issue badges are replaced by concrete warnings such as missing unit price, missing supplier, missing color/option, or quantity confirmation.
- Fabric/accessory item cards show item name, simplified state, supplier, explicit color/option, required quantity, stock use, order quantity, unit, unit price, amount, and one primary action.
- Mobile phone frame includes + fabric and + accessory buttons that open a local editor panel inside the 390px frame.
- Mobile editor mock shows fabric/accessory name, color/option, supplier import, required quantity, unit, unit price, stock use, order quantity, and memo fields.
- Input source wording is changed to new input, supplier import, stock import, and previous record copy.
- Unit selection shows system/base units, company units, and unit-add request.
- Process tab shows base process, company process, process-add request, temporary process input, and a sortable/editable process list.
- Process items show factory/supplier, quantity, unit, unit price, amount, due date, memo/warning, and move/copy/delete actions.
- Small-frame typography uses compact text rows and nowrap values for money, quantity, and units.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` input behavior, mobile editor flow, status language, and responsive typography, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.18 WAFL v2 /ui Sheet Input-Order-PDF Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.18`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.17`.
- This patch continues from the uncommitted alpha.13 through alpha.17 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom Sheet-centered input, order, amount summary, and PDF delivery flow correction only.
- New version line: `0.30.0-alpha.18`.

## 0.30.0-alpha.18 checkpoint

The `/ui` internal WAFL v2 showroom now frames one WAFL Sheet as a production card that connects material/accessory input, amount review, order request readiness, and current PDF delivery.

The correction demonstrates:

```text
- Overview tab changed into a manager summary dashboard.
- Manager summary shows Sheet status, estimated unit cost, fabric/accessory/process amounts, total estimate, missing unit prices, unordered items, factory delivery readiness, and current PDF status.
- Fabric tab uses compact item cards with input source, required quantity, stock use, order quantity, unit, unit price, amount, status, and next action.
- Accessory tab keeps category grouping while showing the same input, amount, status, and order action flow as fabric.
- Input source examples are direct input, supplier selection, stock use, and previous Sheet copy.
- Mobile uses compact item cards instead of table-like previews.
- Product selector stays one-column in compact contexts to avoid vertical text clipping.
- PDF/share tab is reorganized around current PDF, PDF view/share/download actions, included information, and delivery data cards.
- User-facing PDF copy avoids snapshot/STEP/developer-preview wording and maps Sheet status to incomplete, order, making, or completed PDF meaning.
- Factory delivery PDF and quick delivery PDF concepts are shown as PDF purposes without connecting real generation or sharing.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- production guard
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` flow, copy, and responsive content behavior, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.17 WAFL v2 /ui Device-Size Prototype Correction

- Current GPT checkpoint: `0.30.0-alpha.17`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.16`.
- This patch continues from the uncommitted alpha.13/alpha.14/alpha.15/alpha.16 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom device-size and copy-density correction only.
- New version line: `0.30.0-alpha.17`.

## 0.30.0-alpha.17 checkpoint

The `/ui` internal WAFL v2 showroom now uses device-width prototype frames instead of relying on browser zoom or compressed panels.

The correction demonstrates:

```text
- Device switcher split into Desktop, Tablet 세로, Tablet 가로, and Mobile
- Tablet 세로 frame near 768px and Tablet 가로 frame near 1024px
- Mobile phone frame near 390px without transform-scale shrinking
- Mobile product search/selection entry that changes the selected Sheet and actions
- Korean-first visible status labels without English code parentheses in the main prototype
- Fabric/accessory/process quantity and due-date display corrected to Korean business notation and YY/MM/DD dates
- History tab, history summary count, and history-centered Assistant copy removed from the main showroom
- Help/info boxes reduced so the prototype reads more like a working WAFL Sheet screen
- Badge/status pills constrained to avoid mobile overflow and horizontal clipping
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` device presentation, copy density, and responsive behavior, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.16 WAFL v2 /ui Interactive Mock Prototype Correction

- Current GPT checkpoint: `0.30.0-alpha.16`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.15`.
- This patch continues from the uncommitted alpha.13/alpha.14/alpha.15 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom interactive mock correction only.
- New version line: `0.30.0-alpha.16`.

## 0.30.0-alpha.16 checkpoint

The `/ui` internal WAFL v2 showroom now behaves as a small interactive prototype instead of a mostly static explanation screen.

The correction demonstrates:

```text
- Device mode switcher for Desktop, Tablet, and Mobile prototype frames
- Four mock Product/Style records with separate thumbnail, Sheet status, fabric, accessory, process, PDF/share, history, and Assistant data
- Product Explorer local-state selection that changes the selected Sheet preview
- Section Tabs local-state selection for overview, fabric, accessory, factory/process, PDF/share, and history
- Desktop 3-column prototype with Product Explorer, WAFL Sheet hub, Assistant, and local drawer preview
- Tablet prototype with compact product selector, Sheet summary, tabs, selected-section preview, collapsed/expanded Assistant, and detail panel
- Mobile phone-frame prototype with product selector, sticky section nav, current section accordion, and local bottom sheet mock
- Assistant next-action copy that changes by selected product and selected section
- Fabric/accessory data volume preserved while default views show preview rows and detail entry points
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` behavior, device presentation, and local interactions, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.15 WAFL v2 /ui Sheet Navigation Showroom Correction

- Current GPT checkpoint: `0.30.0-alpha.15`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.14`.
- This patch continues from the uncommitted alpha.13/alpha.14 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom navigation/responsive correction only.
- New version line: `0.30.0-alpha.15`.

## 0.30.0-alpha.15 checkpoint

The `/ui` internal WAFL v2 showroom now corrects the Sheet from a long vertical document into a navigation-based work hub.

The correction demonstrates:

```text
- WAFL Sheet Summary Header with product name, Sheet status, thumbnail, item counts, process count, PDF/share state, and history count
- Section Tabs / segmented navigation for overview, fabric, accessory, factory/process, PDF/share, and history
- Selected-section preview instead of always-expanded fabric/accessory/process/PDF sections
- Fabric tab with summary metrics, 3-4 row preview, and full-list drawer entry
- Accessory tab with category group summary, 4-5 item preview, and full-list drawer entry
- Static desktop detail drawer mock for full fabric/accessory editing
- Assistant next action text that changes by selected tab
- Tablet frame with compact product selector, Sheet summary, section tabs, selected-section preview, and collapsed Assistant
- Mobile phone-frame with sticky section nav, current accordion, and bottom sheet mock
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` layout and responsive explanation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.14 WAFL v2 /ui Showroom Section/Responsive Correction

- Current GPT checkpoint: `0.30.0-alpha.14`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.13`.
- This patch continues from the uncommitted alpha.13 `/ui` showroom prototype and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only.
- New version line: `0.30.0-alpha.14`.

## 0.30.0-alpha.14 checkpoint

The `/ui` internal WAFL v2 showroom now explains that real Sheet work is not handled by one large fabric/accessory card per item. Fabric and accessory are presented as section/list cards that summarize many items and lead into full list/edit/order flows.

The correction demonstrates:

```text
- Fabric section card with 6 mock fabric rows
- Fabric summary metrics: total count, total amount, unordered count, issue count
- Fabric actions: view all, add fabric, request order
- Accessory section card with 12 mock accessory rows
- Accessory category grouping for buttons, zipper, label, cord, package, sewing parts, and other
- Accessory actions: view all, add accessory, request accessory order
- Factory/process section as multi-step process timeline/list
- PDF/share as whole-Sheet snapshot lifecycle
- Desktop / Tablet / Mobile structure preview
- Mobile one-column section accordion direction
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` layout and responsive explanation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.13 WAFL v2 /ui Showroom Prototype Baseline

- Current GPT checkpoint: `0.30.0-alpha.13`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.12`.
- This patch is the first narrow WAFL v2 code implementation entry.
- Implementation scope: `/ui` internal v2 showroom prototype only.
- New version line: `0.30.0-alpha.13`.

## 0.30.0-alpha.13 checkpoint

The `/ui` internal catalog now includes a mock-only WAFL v2 showroom prototype above the existing component catalog.

The showroom demonstrates:

```text
- Product Explorer / WAFL Sheet / Assistant layout meaning
- Product/Style and Sheet header
- image/sketch as first-class Sheet data
- base info, fabric, accessory, factory/process, PDF/share Sheet Cards
- Korean-first Sheet/Card status labels with English code hints
- mock action-code examples without role-name branching
- Assistant next action panel
- form field samples with mobile-safe 16px input/select/textarea text
- PDF-like Sheet preview
- mobile one-column card flow with safe-area-aware action area
```

Explicitly not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- workspace/system production behavior
- package.json or lock files
```

This version remains a visual/product-direction prototype. Because it changes visible UI and responsive layout, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.12 WAFL v2 Operational Policy Absorption Baseline

- Current GPT checkpoint: `0.30.0-alpha.12`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.11.zip` with matching repo-state `repo-state-0.30.0-alpha.11-20260706-230647.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.11`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch absorbs the v1-docs gap review findings into the active v2 baseline and drafts the first narrow Codex work order. It is documentation/version/prompt-preparation only.
- New version line: `0.30.0-alpha.12`.

## 0.30.0-alpha.12 checkpoint

The previous gap review established that v2 changes the product center but does not discard confirmed operational policy. This checkpoint converts that finding into active v2 implementation constraints in `docs/project/v2/14-operational-policy-absorption.md`.

Absorbed policy areas:

```text
- commercial onboarding / Trial / approval / provisioning
- billing / plan / storage quota / storage add-on
- Neon source-of-truth / safe migration / tenant isolation
- R2 / Worker / file lifecycle
- production guard and destructive-operation guard
- system default catalog / categories / sizes / units
- system-admin and customer-admin account lifecycle
- company export / deletion / restore / purge
- product completion evidence
- PowerShell/dev-test automation follow-up
```

First recommended Codex work order after this checkpoint:

```text
docs/codex-prompts/0.30.0-alpha.13-v2-ui-showroom-prototype.md
```

That work order is mock-only and explicitly forbids DB migration, API implementation, R2/Worker mutation, production behavior change, package dependency change, and broad workspace replacement.

## Active v2 Codex read order

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/10-roadmap-0.30.md`
14. `docs/project/v2/11-pdf-share-spec.md`
15. `docs/project/v2/12-codex-working-rules.md`
16. `docs/project/v2/13-v1-gap-review.md`
17. `docs/project/v2/14-operational-policy-absorption.md`
18. `docs/project/25-korean-unicode-encoding-standard.md`
19. `docs/project/32-product-completion-and-ui-evidence-standard.md`

---

# 0.30.0-alpha.11 WAFL v2 v1-docs Gap Review Baseline

- Current GPT checkpoint: `0.30.0-alpha.11`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.10.zip` with matching repo-state `repo-state-0.30.0-alpha.10-20260706-224807.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.10`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch records the v1-docs vs v2-docs gap review. It is documentation only.
- New version line: `0.30.0-alpha.11`.

## 0.30.0-alpha.11 checkpoint

The owner asked to compare the first-pass v2 design with the existing docs before Codex implementation. This checkpoint records the gap review in `docs/project/v2/13-v1-gap-review.md`.

Important conclusion:

```text
v2 replaces the product center and screen model.
v2 does not erase confirmed commercial, signup, billing, storage, deletion, DB safety, R2, PDF, QA, or production guard policies.
```

The review identifies required v2 absorption areas:

```text
- signup / consent / Trial / approval / provisioning
- plan / billing / storage quota / storage add-on
- Neon source-of-truth and safe migration
- R2 / Worker / file lifecycle
- system default catalog / size / unit
- system-admin and customer-admin operations
- company export / deletion / restore / purge
- product completion evidence
- PowerShell/dev-test automation follow-up
- v1 workorder route/domain to v2 Sheet/Card mapping
```

## Active v2 Codex read order

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/10-roadmap-0.30.md`
14. `docs/project/v2/11-pdf-share-spec.md`
15. `docs/project/v2/12-codex-working-rules.md`
16. `docs/project/v2/13-v1-gap-review.md`
17. `docs/project/25-korean-unicode-encoding-standard.md`
18. `docs/project/32-product-completion-and-ui-evidence-standard.md`

---

# 0.30.0-alpha.10 WAFL v2 Document Governance and Roadmap Baseline

- Current GPT checkpoint: `0.30.0-alpha.10`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.9.zip` with matching repo-state `repo-state-0.30.0-alpha.9-20260706-224435.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.9`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch records the WAFL v2 document governance, v1 keep/rewrite/archive classification, Codex read order, and 0.30 roadmap baseline. It is documentation only.
- New version line: `0.30.0-alpha.10`.

## 0.30.0-alpha.10 checkpoint

The owner provided the applied `0.30.0-alpha.9` source, matching repo-state, and successful build log. This checkpoint continues GPT-side design work and does not authorize broad Codex implementation yet.

This checkpoint completes the first-pass Codex-entry design baseline:

```text
1. WAFL v2 product definition: documented.
2. Product / WAFL Sheet / Sheet Card center objects: documented.
3. IA and screen model: documented.
4. Neon-based data model draft: documented.
5. Permission action code catalog: documented.
6. Sheet/Card status workflow: documented.
7. PDF/share and R2/Worker lifecycle: documented.
8. v2 design system and /ui showroom target: documented.
9. dev/test seed and QA scenarios: documented.
10. v1 keep/rewrite/archive classification: documented.
11. v2 Codex read order and working rules: documented.
12. 0.30 roadmap: documented.
```

Before Codex implementation starts, run one GPT-side consolidated review of `docs/project/v2/*` for conflicts, missing Korean labels, and implementation sequencing. Codex must then receive a narrow work order, not a broad "redesign everything" instruction.

## Active v2 Codex read order

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/10-roadmap-0.30.md`
14. `docs/project/v2/11-pdf-share-spec.md`
15. `docs/project/v2/12-codex-working-rules.md`
16. `docs/project/25-korean-unicode-encoding-standard.md`
17. `docs/project/32-product-completion-and-ui-evidence-standard.md`

---

# 0.30.0-alpha.9 WAFL v2 Seed/Test Scenario Baseline

- Current GPT checkpoint: `0.30.0-alpha.9`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.8.zip` with matching repo-state `repo-state-0.30.0-alpha.8-20260706-223952.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.8`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch records WAFL v2 dev/test seed scenarios, QA matrix, R2/PDF scenario coverage, and future automation follow-up concepts. It is documentation only.
- New version line: `0.30.0-alpha.9`.

## 0.30.0-alpha.9 checkpoint

The owner provided the applied `0.30.0-alpha.8` source, matching repo-state, and successful build log. This checkpoint continues GPT-side design work and does not authorize Codex implementation yet.

Seed/test planning now covers:

```text
- test companies
- Korean role baseline: 시스템관리자 / 고객사 관리자 / 디자이너 / 재고관리
- Product/Style and WAFL Sheet scenarios
- Sheet status and Card status coverage
- PDF lifecycle scenarios: 임시 / 검토용 / 공유용 / 최종 / 만료·폐기
- R2/Worker-controlled file scenario planning
- storage usage levels by company/plan
- inventory receiving/inspection/stock reflection scenarios
- mobile input/modal/orientation QA mapping
- future PowerShell/dev-test automation menu concepts
```

## Updated v2 canonical read order

For WAFL v2 design and later implementation work, read in this order:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/11-pdf-share-spec.md`
14. `docs/project/10-r2-storage-policy.md` before any R2 key/upload/delete implementation.
15. `cloudflare/README.md`, `cloudflare/r2-upload-worker.js`, and `cloudflare/pdf-generator-worker/` before any Worker or PDF generation implementation.
16. Existing v1/0.24 documents only when explicitly needed for preserved operational rules.

## 12-point Codex implementation readiness progress

```text
1. WAFL v2 product definition: complete
2. Core objects Product / Sheet / SheetCard: complete
3. Main IA / screen model: complete
4. DB table draft: complete
5. Permission action code catalog: complete
6. Status model: complete
7. PDF/share method: complete
8. /ui design-system component list: complete
9. seed/test scenarios: first detailed baseline complete
10. v1 document keep/rewrite/archive classification: pending detailed pass
11. Codex read order: active, needs final sync after roadmap/archive work
12. 0.30 roadmap: pending
```

## Implementation boundary

This patch is documentation/version only.

It does not authorize:

```text
- DB migration
- seed mutation
- API implementation
- UI route implementation
- Playwright implementation
- Worker changes
- Cloudflare deployment
- R2 mutation
- production behavior changes
- package dependency changes
- existing v1 document deletion/move
```

Next GPT-side checkpoint should be `0.30.0-alpha.10` for v1 document keep/rewrite/archive classification and Codex read-order cleanup.
