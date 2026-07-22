# WAFL v2 Mobile Core Inline UX, Calculation, List, and Date Evidence

## Result and boundary

- Baseline: `2.0.0-alpha.51` at `2d808d4db8d7e086a51ba0a4ad21d1f62350bcc1` on synchronized, clean `master`.
- Result: `2.0.0-alpha.52`.
- Status: `ALPHA52_MOBILE_CORE_INLINE_UX_CALCULATION_LIST_AND_DATE_COMPLETE` after every delivery gate passes.
- Scope: customer-facing WorkOrder naming and list density, same-position overview/material inline editing, editable/read-only affordance, keyboard-safe focus, canonical quantity/amount calculation, compact due-date picker, and numeric draft correction.
- New API routes, migrations, material order Commands, production mutation, R2/PDF/token work, native dependency/plugin changes, and EAS Build/Update remain excluded.

## Mobile behavior

- Customer-facing mobile copy uses `작업지시서`; `ProductionCard` remains an internal component/design term.
- The list card keeps representative-image treatment, product name, one status badge, quantity/unit, and delivery date. Long document numbers, revision labels, factory name, recent-update metadata, and internal identifiers are not default card content.
- Search and bounded status filtering operate on the existing read model without changing the API contract.
- Overview product name, total quantity, and delivery date edit in their exact display positions. Material name, color/option, usage area, required/allowance/inventory quantities, unit, unit price, and memo use the same-position grammar when the draft line is active and unlocked.
- Separate edit buttons and full edit panels are absent. Archived, ordered/locked, non-draft, status, revision, and calculated values have no edit affordance.
- Explicit X/Check actions preserve automatic-save `0`, duplicate-submit protection, expectedVersion, stale conflict, canonical GET/cache refresh, and dirty-guard behavior.

## Input, calculation, and date correction

- Narrow quantity rows expand only the selected field to bounded card width so value, cursor, unit, X, and Check remain visible without horizontal overflow; cancel/save restores the compact row.
- Focus routing uses the tapped field, measured layout, actual keyboard frame, and bounded scroll. Polling, focus retry loops, duplicate inputs, and fixed blind offsets remain absent.
- Numeric display removes unnecessary trailing zeros; Korean currency display uses grouped integer `원` values.
- Canonical order quantity is read-only and server-calculated as `max(required + allowance - inventory, 0)`. Amount uses the canonical order quantity and unit price. The client does not submit `orderQuantity`.
- A canonical numeric zero now becomes an empty edit draft before focus, with placeholder `0`; first input `5` yields `5`, not `05`. Leading decimal input becomes `0.`, valid `0.5`/`0.05` remain intact, empty Check is disabled, and X restores the stored value.
- The due-date UI is a compact paper-sheet bottom sheet with a single open/close source of truth, Korean month/week presentation, clear-date draft action, X cancel, Check confirm, safe-area handling, and no automatic reopen.
- Date-only payloads remain `YYYY-MM-DD`; no UTC datetime conversion can shift the calendar date.

## Runtime and mutation attribution

- Approved dev/test used the retained `QA_DRAFT_A`, canonical Company A context, DeveloperAutoConnect, Tailscale Serve API, Tailscale LAN Metro, Cloudflare preview transport, localhost-only Next backend, and Funnel disabled.
- Exploratory iPhone work exposed UX issues before the final bounded QA. Every successful mutation was later attributed to the sole user and the same authorized actor/target with unique request/correlation identities and continuous versions.
- The final retained state is WorkOrder/revision/material versions `34/34/14`, event/receipt counts `67/26`, migration ledger `13/13`, due date `2026-07-30`, and total quantity `10`.
- DB session timezone was `GMT`; raw event timestamps and `Asia/Seoul` conversions proved separate `20:59` and `21:07-21:08` explicit-save groups. DB/host clock skew was approximately one second, not eight minutes.
- No event represented automatic save or duplicate submission. Material row, document, token, archive/restore/order/delete, production, R2/PDF, schema, native, and EAS effects remained unchanged in the correction phase.
- The final read-only Runtime preflight at baseline `34/34/14` passed auth, exact company context, list/detail, active/archived materials, manifest, and bundle with successful PATCH/POST/DELETE/order requests `0` and all measured deltas `0`.

## Physical iPhone QA

- External cellular, Tailscale, DeveloperAutoConnect, list/detail navigation, existing overview/material behavior, compact calendar, and narrow-field layout were exercised on the existing iOS Development Build.
- The owner accepted the compact date sheet and confirmed close-to-reopen count `0`.
- Narrow-row expansion, cursor/action visibility, and compact restoration passed within the observed device scope.
- For the final numeric correction, the owner verified that entering `5` into a canonical-zero field displayed exactly `5` with `05` occurrence `0`; an existing `0.5` value selected and could be cleared or replaced directly; no numeric-input anomaly occurred.
- X restoration, empty-save blocking, automatic-save `0`, duplicate-input prevention, and background/re-entry safety are additionally covered by component/unit/contracts and the mutation-free Runtime ledger. The owner was not asked to repeat equivalent low-value input combinations.

## Validation and teardown

- Targeted ESLint, root/mobile TypeScript, alpha.45-alpha.52 and lifecycle regressions, Next production build, Expo config/dependency checks, date-only and numeric pure-function contracts, and canonical Node `v24.14.0` Verify are required final gates.
- Mutation audit reports `203` findings and high-risk `0` on the final pre-document source fingerprint.
- Canonical stop terminated only the four exact runner-owned processes. State is stopped, owned PID count is `0`, ports 3000/3100/8081 are `0/0/0`, Serve config is empty, `AllowFunnel: true` is `0`, Tailscale remains Running, and unrelated process termination is `0`.
- Final fingerprint, commit, origin synchronization, Source ZIP, and matching repo-state identities are owned by the final workflow output and repo-state.

## Deferred boundary

- Alpha.53 candidate: `ALPHA53_MOBILE_ARCHITECTURE_FOUNDATION_COMPLETE` for bounded mobile orchestration separation, shared contracts/policies/formatters/theme tokens, and reel-input foundations/prototype.
- Material order request/cancel/complete moves to a later separately approved candidate after the architecture foundation.
- Partners, Factory, Supply, lineage/rework, accessories, image/attachment, production deployment, and broad mobile polish remain outside alpha.52.
