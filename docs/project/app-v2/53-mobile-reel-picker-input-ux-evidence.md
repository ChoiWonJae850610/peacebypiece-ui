# WAFL v2 Mobile Reel Picker Input UX Evidence

## Result and boundary

- Alpha.54 implementation began on `2026-07-23 KST` from synchronized, clean `master` at baseline `2.0.0-alpha.53`, HEAD/origin `15744fd22fbfb26e9123df7cdc734bcf3850f155`.
- Result version: `2.0.0-alpha.54`.
- Result status after all delivery gates: `ALPHA54_MOBILE_REEL_PICKER_INPUT_UX_COMPLETE`.
- Scope is mobile Reel Picker input, explicit-save session lifecycle, draft/response safety, immediate/Korean-initial search, canonical workflow badge presentation, and bounded calendar/search polish.
- Material order lifecycle, schema/migration, production, R2/PDF/token, dependency, native plugin/configuration, EAS Build/Update, accessory/lineage, and unrelated redesign remain excluded.

## Input and save behavior

- Total quantity uses an integer Reel Picker with direct-input fallback.
- Required quantity, allowance, and inventory-use fields use quantity plus step reels with `0.1 / 0.5 / 1 / 5 / 10 / 50`; unit is edited by a dedicated stable-order unit reel.
- Reel actions are icon-only X/Check with accessibility labels. X discards local picker state and performs PATCH `0`. Check is the single explicit save action, performs at most one PATCH, applies the canonical response, closes the picker, and tears down the field/card edit session.
- Unit-wheel order, stable key/index mapping, vertical flow, center selection, fade, snap, and ref/effect synchronization passed without a new package or native dependency.
- The existing numeric formatter, trailing-zero behavior, order-quantity formula, amount formula, currency display, calculated-field read-only policy, duplicate-submit guard, and silent-discard navigation policy remain intact.

## Draft, validation, response, and failure safety

- Material picker updates use `MaterialDraftUpdate`; the application controller merges a field patch with the current live full draft immediately before validation and save. A stale UI editor snapshot is not the canonical save source.
- Optional memo, usage area, color/option, supplier, and unit inputs are normalized before validation. Missing optional values do not reach unsafe `.trim()` calls, do not become stringified `undefined`, and do not remove sibling fields.
- Validation returns structured results for invalid required data and does not throw for absent optional text.
- `apiResponseNormalizer.ts` is a deterministic, alias-free, React/React Native/Expo/network/environment-free pure module. Both `apiClient.ts` and Node behavior contracts use the same material response normalization boundary.
- Valid material read/save responses, including allowed optional omissions, are normalized to the canonical mobile shape. Truly malformed responses remain rejected; valid saves no longer produce the generic malformed-response banner.
- Async save handlers contain errors, release in-flight state in all paths, retain usable local state on failure, and prevent unhandled promise rejection, red screen, crash, duplicate submit, or lingering blocker state.

## Search, status, and visual polish

- Search remains button-free and immediate under the existing debounce/API boundary. Its wrapper/input/clear affordance retain a fixed single-line height across empty, composing, filtered, and cleared states.
- The pure alias-free Hangul helper normalizes input and extracts only initial consonants from Korean syllables. Completed Korean, compatibility-jamo initials, English, numbers, document identifiers, whitespace, and case normalization are behavior-tested.
- A query such as `ㄹ`, `ㄹㄴ`, or `ㅅㅊ` matches the corresponding initial corpus without adding a network request. Search-result zero and company-data zero use distinct empty states.
- `workOrderListStatusPolicy.ts` is the single presentation owner for filter labels, filter predicates, representative badge labels, and variants: `작성 중`, `전달·발행`, `진행 중`, `완료`, and `보류·취소`.
- Document-generation wording such as `발행됨` does not override the list card's one representative workflow badge.
- The due-date sheet uses bounded content-fit spacing and safe-area preservation. Normal, today, selected, and today-plus-selected cells share one fixed centered text container without border-induced baseline shift.

## Tests and contract remediation

- Seven alpha.54 contracts cover Reel Picker model/state, material patch/full-draft ownership, immediate search, save/session remediation, alias-free response normalization, UI layout, Korean-initial matching, and workflow badge policy.
- Historical alpha.44-alpha.52 contracts were updated only where their implementation-location, current-version, discarded-modal, count-copy, status-owner, or response-normalizer assertions had become stale. Their read, conflict, mutation-safety, decimal validation, explicit-save, and UX meanings remain enforced.
- Source-regex checks remain only where module ownership/import boundaries are the contract. Numeric state, response normalization, Hangul matching, status mapping, mutation gating, and picker behavior use pure or controller behavior assertions.
- Process-local Node `v24.14.0`, root/mobile TypeScript, targeted ESLint, Expo config/dependency checks, Next production build, Unicode/document links, runner contracts, migration guard, and mutation audit passed before device handoff.
- Pre-device Canonical Verify at `2026-07-23 22:24 KST` passed with ChangedFingerprint `198176b16ef9908c4efb8b66d6813b7f230ced1ee5927da4231f4e2be8e620e1`; mutation audit reported `203 findings / high-risk 0`.

## Runtime effects and physical-device QA

- Approved automated actual-save QA performed exactly four PATCH actions: total quantity, material required quantity, material unit, and material memo. The before/after state was WorkOrder/revision/material `34/34/14 -> 38/38/17`, event/receipt `67/26 -> 71/26`.
- Every automated action had request maximum `1`; canonical GET reflected each response. Business POST/DELETE, order/archive/restore, duplicate submit, unknown mutation, row-count change, document/token change, and production effect were `0`.
- The owner then performed exactly four explicit physical-iPhone Check saves for the same field categories. The approved final values are total quantity `12`, required quantity `2`, unit `벌`, and the owner-entered memo recorded in the dev/test row.
- The resulting approved canonical baseline is WorkOrder/revision/material `42/42/20`, event/receipt `75/26`, migration ledger `13/13`. Automatic, duplicate, unknown, order, archive, and delete mutation remained `0`.
- Physical-iPhone save QA passed: Check saved once, picker/field returned to display state, another field opened immediately, malformed-response banner and uncaught-error toast were absent, and red screen/crash/blocker modal were `0`.
- Physical-iPhone visual QA passed fixed search height, clear/filter layout stability, compact calendar spacing, centered date badges, background/re-entry, and existing Reel Picker behavior with additional save `0`.
- Final physical-iPhone search/status QA passed `ㄹ` and `ㄹㄴ` matching, clear-to-all behavior, current-display count copy, workflow filter/badge agreement, absence of `발행됨` as the representative badge, and existing UI regression `0`; save and business mutation were `0`.

## Final Runtime and PC resource audit

- Final read-only DeveloperAutoConnect Runtime owned four exact processes, used Next `3100` and Metro `8081`, left port `3000` unused, kept Command API blocked, and kept mutation mode read-only.
- Automated Runtime QA returned manifest/bundle/list/detail/materials `200`, passed auto-connect/auth/disconnect, and retained WorkOrder/revision/material `42/42/20`, event/receipt `75/26`, document/token counts, and business PATCH/POST/DELETE/order/archive/restore mutation `0`.
- The immediate pre-device audit at `2026-07-23 22:28:37 KST` measured CPU `13.27/9.56/14.41%` (average `12.41%`), memory `31.12 GB` total / `11.83 GB` used / `19.29 GB` available, `C:` free `1,198.17 GB`, disk active `0.958/0.215/0.622%`, queue `0/0/0`, runner ownership `4/4`, and remote-operation risk `0`.
- Canonical stop terminated only the four exact runner-owned processes. A first sandboxed stop attempt reached a Tailscale local-pipe permission denial before teardown; the same canonical stop was then run with the required administrative access and completed. No broad or name-based kill was used.
- Post-stop audit at `2026-07-23 23:32:17 KST`: ports `3000/3100/8081` were `0/0/0`, Serve ownership was released, Funnel `AllowFunnel: true` was `0`, and Tailscale/Chrome Remote Desktop remained Running.
- Post-stop CPU was `9.71/14.75/9.49%` (average `11.32%`); memory `31.12 GB` total / `10.79 GB` used / `20.33 GB` available; `C:` free `1,198.18 GB`; disk active `0.531/0.094/1.017%`; queue `0/0/0`.
- `Temperature: unavailable with approved read-only tooling`. Abnormal process `0`, remote-operation risk `0`, unrelated-process impact `0`.

## Delivery and extension boundary

- Final Verify/fingerprint, commit/push, Source ZIP, matching repo-state, and clean Git are owned by the final workflow output and matching alpha.54 repo-state because tracked source cannot contain its own final commit hash or post-commit artifact metadata.
- Alpha.55 may use the material feature/controller/policy and explicit mutation gate for a separately approved request/cancel/complete lifecycle. Alpha.54 adds no material-order command or new lifecycle state.
