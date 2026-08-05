# 2.0.0-alpha.59 Mobile WorkOrder Input Expansion Evidence

Status: `ALPHA59_MOBILE_WORK_ORDER_INPUT_EXPANSION_COMPLETE`

## 1. Result and boundary

- Result version: `2.0.0-alpha.59`.
- Product checkpoint: `ALPHA59_MOBILE_WORK_ORDER_INPUT_EXPANSION_COMPLETE`.
- Alpha.59 entered from synchronized alpha.58 HEAD/origin `f6291ebc7d16d77c6c4c64673926bc41735960dc`.
- Completed scope: mobile overview input expansion, draft size/color structure commands, production-quantity matrix editing and integer total projection, automatic sorting, circular finite-option reels, quarter-decimal material quantities, material/accessory same-position inline fields, caret behavior, compact actions, parent/child size-color editor lifecycle, and exact inline-session ownership.
- Owner acceptance: the final physical-iPhone QA result was `잘 된다.`.
- Explicit exclusions: size/color archive/restore, fractional total quantity, finished-measurement editing, company common color library, Factory, AI image generation, schema/migration, dependency/native/EAS work, R2 mutation, production mutation, and user-owned QA data mutation.

## 2. Command and transaction model

- Exact v2 command routes cover draft size create/update/reorder, color create/update/reorder, and quantity create/update while preserving UUID, method, anonymous, tenant, member, permission, editable-revision, expectedVersion, and production-block boundaries.
- Per-item idempotency and sequential expectedVersion chaining prevent a multi-add batch from sending the same version concurrently or omitting its first item.
- Changed, no-op, rejected, and replay semantics are accounted independently; an HTTP success code alone is not treated as a mutation.
- Size and color IDs remain stable through rename, palette change, and automatic sorting, so quantity and finished-measurement identities remain attached to their existing rows.
- Quantity mutations update the color-size cell, matrix total, WorkOrder integer total quantity, and revision snapshot in one canonical transaction.
- Unchanged quantity and same-order operations do not increment versions or append command evidence.

## 3. Mobile size/color experience

- The accepted read-only projection remains the source of displayed size, color, quantity, POM, and finished-measurement data.
- Editable draft screens use compact paired size/color actions instead of hero cards or duplicated summaries.
- Immutable multi-add snapshots preserve selection order and normalize only once before sequential create requests.
- Size selection retains the canonical presets and direct input without a separate numeric-size wheel.
- Color selection retains the quick palette and adds a deterministic visual grid with read-only RGB and HEX evidence; existing custom colors are preserved until the user chooses a new cell.
- Row edits keep the parent WAFL INPUT open, retain the selected stable ID after automatic sorting, and allow repeated edits in one parent session.
- The color palette is a child editor: Check applies at most one patch and returns to the parent, X discards only the palette draft, and only the parent X closes the full editor.
- Read-only screens receive no add, drag, reorder, command, or allowlist action model.

## 4. Shared input, circular reel, and quantity behavior

- WorkOrder title and material/accessory name, color/option, usage area, memo, and unit price use same-position inline editing without visible inline X/Check controls.
- Inline session identity combines WorkOrder generation, WorkOrder ID, item ID, field key, and a monotonic token; a stale blur cannot close or commit a newer field session.
- Submit and blur share one finalization guard, unchanged values issue no request, and failure/conflict recovery restores canonical server state.
- Material and accessory cards share the same implementation and controller grammar.
- Finite option reels use canonical option IDs, modulo logical indices, a central repeated window, edge recentering, logical-transition callback/haptic dedupe, stable selection across option changes, and cleanup on unmount or session change.
- Material required quantity and allowance compose a whole-number reel with quarter values `0`, `0.25`, `0.5`, and `0.75`; legacy non-quarter values are preserved until an explicit edit.
- Order quantity remains required quantity plus allowance, and amount remains order quantity multiplied by unit price.
- Total quantity remains an integer derived from the color-size matrix; fractional total-quantity UI and hidden rounding were not introduced.

## 5. Overview, labels, and read-only preservation

- The overview input, cost, image, memo, and inline presentation follow the shared mobile WorkOrder grammar without broad design-system duplication.
- Input focus does not force automatic full selection, preserving normal caret movement and Korean IME behavior.
- The quantity and measurement sections use the exact titles `색상×사이즈` and `완성 치수표`.
- A normal totals-match badge is omitted; actionable mismatch and save/retry errors remain.
- Finished measurements remain read-only and stay attached to stable size IDs.
- The accepted rich read-only target continues to project three sizes, three colors, nine quantity cells, five POM columns, and fifteen measurement cells with zero command and allowlist invocation.

## 6. Runtime accounting and isolation evidence

- One approved temporary isolated draft was used for mutation QA; the two owner products remained GET-only.
- The Runtime issued 63 requests and serialized a 37-step ledger: changed `27`, no-op `2`, rejected `6`, and replay `2`.
- Independent observed deltas were WorkOrder `27`, revision `27`, Event `27`, and Receipt `24`, matching the source-derived per-command Receipt contract rather than a global Event/Receipt parity assumption.
- Exact size creation sent `44 → 55 → 66` as sequential `201/201/201` requests with chained nextVersion and per-item idempotency.
- Exact color creation sent `화이트 → 아이보리 → 그레이` as sequential `201/201/201` requests while ASCII ordinal identities remained `exact-color-1`, `exact-color-2`, and `exact-color-3`.
- Matrix-total checkpoints were `0→3→8→15→16`; each checkpoint matched the persisted WorkOrder total and revision snapshot, unchanged `6→6` remained a no-op, and a stale expectedVersion was rejected with `409`.
- Product title, material/accessory inline fields, unit prices, canonical units, required quantity `2.25`, allowance `0.75`, order quantity `3`, and amount formulas passed.
- Anonymous, foreign, malformed, and unsupported-method gates returned the canonical `401/404/404/404` results.
- Metro iOS manifest and bundle returned `200/200`; all semantic markers passed; fatal, red-screen, uncaught, and unhandled aggregation was `0/0/0/0`.

## 7. Cleanup and mutation boundary

- Immutable cleanup ownership used the recorded company, WorkOrder, revision, creation marker, and exact child IDs; a later product-name change was evidence only and did not affect ownership.
- Prefix synthetic colors and exact-sequence colors were validated independently before their exact-ID union was deleted.
- Finally cleanup removed only test-owned temporary children and parents in FK-safe order.
- Temporary WorkOrder, revision, size, color, quantity, spec, material, and accessory residuals were all zero.
- Append-only Event and Receipt evidence was preserved.
- User-owned product mutation, migration, R2 mutation, and production mutation were all zero.

## 8. Automated and physical-device acceptance

- Final alpha.59 targeted contracts and the complete alpha contract set passed `93/93`.
- Root/mobile TypeScript, changed-file ESLint with zero errors, Runtime JS parse, `git diff --check`, Expo public config, Next production build, dependency/lock, migration/schema, native/EAS, version, secret/production, mutation audit, and Canonical Verify passed.
- Mutation audit covered 1,387 source files, reported 204 review findings, and classified high-risk findings as zero.
- The owner completed final physical-iPhone QA for same-item inline continuation, direct field switching, stale-blur protection, parent-preserving size/color saves, palette Check/X return, repeated row editing, caret behavior, circular reels, matrix totals, and read-only regression, and reported `잘 된다.`.
- Automated QA does not substitute for that physical-device judgment.

## 9. Finalization and delivery boundary

- Finalization first verified the approved continuation while APP_VERSION remained alpha.58, then changed only canonical alpha.59 version surfaces, Current Baseline, roadmap, and this evidence before repeating the final static verification.
- No finalization Runtime mutation, schema/migration, fixture, R2, production, dependency, native, or EAS operation was performed.
- Root package metadata and Expo public/native version retain their separate canonical values.
- Candidate commit: `feat: WAFL v2 alpha.59 작업지시 입력과 수량 UX 완성`.
- This tracked evidence intentionally does not contain the hash of the commit that contains it or final artifact hashes. Post-push Git and artifact identities belong to the matching repo-state and final Result.

## 10. Next candidate boundary

- Candidate: `2.0.0-alpha.60`, not started.
- Size/color archive/restore lifecycle, fractional total-quantity policy, finished-measurement editing, and a company common color library remain separate possible packages.
- Each requires its own owner-approved Delta, data and mutation boundary, Runtime plan, and acceptance. Alpha.59 completion does not authorize any of them.
