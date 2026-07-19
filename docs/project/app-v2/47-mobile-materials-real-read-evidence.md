# WAFL v2 Mobile Materials Real Read Evidence

## Result

- Version: `2.0.0-alpha.48`
- Baseline: `2.0.0-alpha.47` at `1c7ba28914bd95529e2dbe451dd71d0f021732f5`
- Status: `ALPHA48_MOBILE_MATERIALS_REAL_READ_COMPLETE`
- Scope: one read-only vertical slice for the live ProductionCard `원단` tab. Accessory, material write, material order Command, migration, native, and EAS work remain excluded.

## Read and security boundary

- The mobile client calls the existing exact `GET /api/v2/work-orders/:workOrderId/materials?type=fabric&limit=30` route through the Tailscale Serve API origin. The Cloudflare Preview/Viewer origin does not admit this path.
- Existing authenticated Company A scope, `workorder.read`, tenant filtering, canonical PostgreSQL UUID path, active developer mapping, approved dev/test fingerprint, production block, and read-only runner remain authoritative.
- The server response parser preserves nullable fields and decimal strings. It validates material identity, type, status, pagination metadata, quantity, price, and amount without coercing stored decimals to JavaScript floating-point values.
- The runner kept Command API blocked. WorkOrder POST/PATCH and material create/edit/delete/order-request/order-cancel/order-complete calls were zero.

## Mobile state, cache, and pagination

- Opening a detail does not fetch materials. The first explicit `원단` tab selection performs one lazy GET.
- Per-WorkOrder states are `not-loaded`, `loading`, `loaded`, `empty`, `error`, `retrying`, and `loading-more`. Retry and `더 보기` are explicit user actions; automatic retry, polling, focus refresh, and render-triggered requests are absent.
- The process-local cache is keyed by WorkOrder ID and bounded to six entries. In-flight request tokens, session generation, selected WorkOrder identity, and response WorkOrder identity must all match before a response is applied. A late response cannot populate another card.
- The existing API uses cursor pagination with a mobile page limit of 30. A next page is requested only by `더 보기`, duplicate line identities are suppressed during merge, and the same cursor cannot be requested concurrently.

## Live material presentation

- Each card uses actual material name, unit, status, color option, usage area, required quantity, allowance, inventory usage, order quantity, unit price, amount, and memo. API-null values use neutral `미입력`, `없음`, or `—`; no mock value, supplier, image, attachment, or inferred application field is introduced.
- The compact first row follows the accepted mock grammar: `거래처 / 색상·옵션 / 단가`. The API has no supplier display value, so the supplier slot is `—`. The expanded row is `필요수량 / 로스·여유 / 재고사용`, followed by thin usage-area and memo rows.
- Quantity display removes unnecessary trailing zeroes. Continuous quantities show at most two fractional digits; stored/API precision is unchanged. KRW values are display-only rounded to won, grouped, and suffixed with `원`; null is never converted to zero.
- The footer restores the accepted two-line `발주수량·단가 / 금액` summary and the original status-specific action icons. Actions are visibly read-only/disabled and have no handler or Command API path.
- Status-specific left accents and badges distinguish editing, requested, completed, cancelled, and unknown values. Phone and tablet-static layouts use bounded flex/min-width rules; actual tablet device QA was not run.

## Runtime and owner QA

- The canonical read-only DeveloperAutoConnect runner reused iOS Development Build number 1. Tailscale Serve HTTPS carried authentication and business reads, Tailscale LAN carried Metro, and Cloudflare remained Preview/Viewer-only. Connection-code input was zero.
- Bounded preflight passed session/auto-connect, Company A list, recent and past detail/material reads, draft and non-draft reads, response shape, pagination, and disconnect with business delta zero.
- The first physical-iPhone function pass was provisionally successful, but the owner rejected UI conformity because quantity and currency formatting, a duplicate label, the missing action region, and footer layout differed from the accepted ProductionCard material grammar.
- After presentation-only correction and one Development Client Reload, the owner reported external cellular, Tailscale, automatic connection, list, recent/past material reads, number/currency formatting, compact/expanded rows, two-line footer, disabled actions, status accents, background/re-entry, and overall UI as PASS. Horizontal overflow, cross-card data mixing, crash, red screen, infinite loading, and other anomalies were absent.
- The final owner result is both `원단 UI conformity: PASS` and `전체 UI 판정: PASS`.

## Effects and teardown

- Post-runtime read-only audit found WorkOrder, revision, and material touches `0`; receipts, events, generated documents, tokens, and migrations changed by `0`; migration ledger remained `12`.
- Runtime mutation-log hits were `0`. R2 PUT/GET/DELETE, PDF generation, viewer-token operation, production access/mutation, schema change, fixture, native dependency, EAS Build, and EAS Update were all `0`.
- Canonical stop ended the four exact runner-owned processes. Final runner state is stopped; Serve config is empty; explicit `AllowFunnel: true` count is zero; ports 3000/3100/8081 have zero listeners; Tailscale remains Running; unrelated termination and ownership skip are zero.

## Validation and delivery

- Targeted ESLint, mobile/root TypeScript, alpha.48 and historical contracts, Next production build, Expo configuration/install/Doctor checks, Unicode, secret scans, migration guard, mutation audit, and canonical `automation-infrastructure` Verify are required on the final source/document fingerprint.
- Final Git, push, ZIP, and repo-state identities are recorded by the matching alpha.48 repo-state. Source ZIP is `peacebypiece-ui-2.0.0-alpha.48.zip`.

## Deferred work

- Alpha.49 candidate: draft material basic editing with explicit save, concurrency, and dirty-state protection. Material order Commands remain a separate later scope.
- The completed canonical-document analysis recommends separating Permanent Rules, Current Baseline, and Version Delta, then consolidating duplicated read-order/runtime/release text. Alpha.48 does not redefine, merge, shrink, or delete canonical documents; that work remains a separate Infrastructure change.
