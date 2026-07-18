# WAFL v2 Mobile Real Data Read-only Evidence - 2.0.0-alpha.44

Status: `ALPHA44_MOBILE_REAL_DATA_READ_ONLY_SLICE_COMPLETE`

## Baseline and result boundary

- Baseline is alpha.43 commit `9f00b61854cd6c424378012813d6afb0e648cac6`, status `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE`, migration ledger `12/12`, and the installed ATS-corrected iOS Development Build.
- Alpha.44 reuses that native binary. Public app version remains `2.0.0`; Bundle Identifier remains `com.wafl.app`; internal source/mobile trace version is `2.0.0-alpha.44`.
- The result slice is development connection, current effective user/company confirmation, actual dev/test WorkOrder list, core detail overview, phone navigation, tablet split view, explicit error/retry states, background/re-entry, and disconnect.
- This is not Google/Apple login or production authentication. User-facing copy is `개발용 연결` and `dev/test 읽기 전용`.

## One-time development connection

- `/dev/mobile-connect` is localhost-only under the external QA proxy and issues a code only while the exact external QA run is enabled in a non-production runtime.
- Issuance requires the actual signed-in session to resolve to an active system administrator and the effective dev/test context to resolve to an approved company target with `workorder.read` through the existing workspace/company-access guard.
- The code is eight characters from a confusion-reduced uppercase alphabet, expires within five minutes, and is consumed exactly once.
- The process-local bounded registry is attached to `globalThis`. Its key is SHA-256 over the current runner secret plus the code; the raw code, cookie, user/company identifiers, and session payload are not written to DB, R2, files, or logs.
- Each entry is bound to the current runner token fingerprint. Another run cannot consume it. Active entries are bounded to 32 and expired entries are removed during bounded registry operations.
- The localhost screen displays only effective user name, company name, role label, code, expiry countdown, and use state. It does not display full IDs, cookies, secrets, tokens, or credentials and does not copy a code automatically.

## Exchange, cookie, and disconnect

- External exchange is exactly `POST /api/dev/mobile-connect/exchange` on the runner's exact Quick Tunnel host. Production, a different host/run, invalid format, expired code, and reused code are blocked with a generic unavailable response.
- Success reuses `createWaflSessionCookieValue` and `wafl_auth_session`. The cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and at most two hours. No cookie or raw session token appears in the response body.
- The app immediately verifies the cookie with `GET /api/auth/me`; physical-device cookie-jar retention remains a required runtime checkpoint.
- `POST /api/dev/mobile-connect/disconnect` clears the WAFL auth and dev/test context cookies without a business/audit row mutation and returns the app to the connection screen.

## External allowlist

Alpha.44 adds only:

- `POST /api/dev/mobile-connect/exchange`
- `POST /api/dev/mobile-connect/disconnect`
- `GET /api/auth/me`
- `GET /api/v2/work-orders`
- `GET /api/v2/work-orders/:uuid`

The proxy continues to trust request `Host` only. It does not use `x-forwarded-host` as authority. `/dev/mobile-connect`, code issuance, WorkOrder POST/PATCH, lazy tabs, material/process/revision commands, arbitrary `/api/v2/*`, OPTIONS, internal/admin/dev/test routes, and production temporary origins remain blocked. The alpha.43 Viewer/Preview allowlist remains intact.

The reproduced legacy-detail 404 was classification `C4`, an external list/detail validity mismatch. Read-only Company A evidence found 503 list-visible rows and the same 503 detail-core-join-eligible rows, with missing revision and company mismatch both zero; the tenant runtime likewise saw all 503. The mobile selected and keyed rows by `workOrderId`, excluding revision/document ID substitution and index/key collision. The remaining boundary admitted only UUIDs whose version and variant nibbles matched a narrow RFC expression, excluding otherwise valid PostgreSQL UUID text. The correction accepts exactly one lowercase-or-uppercase hexadecimal UUID segment in canonical `8-4-4-4-12` form. Method, full pathname, host, and external allowlist remain exact; malformed, unhyphenated, extra-segment, wildcard, prefix, command, and cross-company paths remain blocked.

## Mobile read-only slice

- `apps/mobile/app/index.tsx` mounts `MobileWorkOrderApp`; `ProductionCardMock` and its constants remain only as historical design evidence and are not mixed into current runtime data.
- The centralized mobile client validates an origin-only URL, requires HTTPS/non-localhost for external QA, uses `credentials: include`, `Cache-Control: no-store`, JSON content checks, a 15-second abort timeout, typed errors, and correlation IDs.
- It performs no automatic retry or polling. The only POST methods are explicit connection exchange/disconnect; WorkOrder access is GET-only.
- The first list request is `GET /api/v2/work-orders?limit=30`. The UI labels the loaded count rather than claiming an unknown total and reports `hasMore` only as a next-page fact.
- List cards show product, status, due date, quantity, estimated amount/currency, incomplete material counts, process count, latest document status, update time, and optional display document number.
- Thumbnail metadata never causes an image/object request; the screen uses a neutral `이미지 있음/없음` placeholder. R2 GET remains zero.
- Detail uses only `GET /api/v2/work-orders/:workOrderId` core data. It shows basic header, revision, readiness, amount, count, document, and entity-version summaries without requesting or inventing material/process/asset/document/history rows.
- Save, edit, order, completion, delete, PDF/token, and Preview actions are absent.

## Responsive and state contract

- The implemented phases are booting, disconnected, connecting, authenticated list loading, list ready, detail loading, detail ready, recoverable error, and session expired.
- Phone uses list -> detail -> explicit back navigation. Tablet widths from 768px use a bounded left list and flexible right detail pane in portrait and landscape.
- Safe area, 44px-or-larger primary touch targets, product-name truncation/accessibility labels, explicit empty/loading/error messages, and user-controlled retry are included.
- Every phone detail error has an accessible upper-left back action, primary `목록으로`, and secondary `다시 시도`. Tablet keeps the list pane. Returning clears only selected detail/error state and preserves the loaded list without refetch; an in-flight guard bounds retry to one detail GET per user action.
- The app does not refresh on a timer or foreground event. The final iPhone background/re-entry preserved a usable real-data flow without crash, red screen, or infinite loading.

## Verification and runtime result

- Root/mobile TypeScript, targeted ESLint, Expo public config/install check/Doctor, alpha.20-alpha.44 contracts, alpha.43 external-QA/ATS regression, Next production build, secret/temporary-origin/migration scans, mutation audit, and the final Node `24.14.0` `automation-infrastructure` Verify form the matching final gate.
- The first physical issuance attempt stopped before session evaluation because the external QA runner had not injected the existing WorkOrder Read API runtime guard into its Next child. The bounded correction validates the canonical dev/test DB fingerprint before any child starts, records only a short verified prefix, and injects the five Read guard values into Next only. It does not weaken `getWorkOrderV2ReadRuntimeGuard`, persist environment values, or expose them to Metro.
- Final physical iPhone QA passed one-time development connection, expected effective Company A user/company context, actual WorkOrder list, recent core detail, the formerly failing legacy core detail after the C4 correction, phone back, background/re-entry, and disconnect. Crash, red screen, blank screen, and infinite loading were absent.
- Because the corrected legacy card opened, the error-state `뒤로가기`, `목록으로`, and `다시 시도` controls were not applicable to the final runtime path. Their source and contract assertions pass; they are not misreported as physical clicks.
- Preserved runner output proves Metro started and bundled the iOS JavaScript once. It has no Next/Cloudflare access log entries, so exact exchange/auth/list/detail/disconnect counts are unavailable and are not reconstructed. User-observed flow proves the bounded sequence; automatic retry and polling remain zero by source contract.
- The final ownership-guarded stop ended cloudflared, Next, and Metro with skip zero, released ports 3100/8081, retained the separately owned localhost:3000 login server, and kept Tailscale running.

## Mutation boundary

- Process-local code create/consume and HttpOnly cookie create/delete are ephemeral authentication effects, not business-data mutations.
- DB write, schema change, migration apply, fixture/seed, business mutation, R2 PUT/GET/DELETE, PDF generation, viewer token exchange/issue/revoke/rotate, document finalize, production access/mutation, direct object access, native dependency change, EAS Build, and EAS Update are all zero.
