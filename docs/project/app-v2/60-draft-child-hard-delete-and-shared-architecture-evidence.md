# 2.0.0-alpha.60 Draft Child Hard Delete and Shared Architecture Evidence

Status: `ALPHA60_DRAFT_COMPONENT_HARD_DELETE_AND_SHARED_ARCHITECTURE_RULES_COMPLETE`

## 1. Result and boundary

- Result version: `2.0.0-alpha.60`.
- Product checkpoint: `ALPHA60_DRAFT_COMPONENT_HARD_DELETE_AND_SHARED_ARCHITECTURE_RULES_COMPLETE`.
- Alpha.60 entered from synchronized alpha.59 HEAD/origin `55a2065c5bfc8a764fd5ad63865e21b2a1c8f916`.
- Completed scope: conditional hard delete for eligible WorkOrder-local draft size, color, fabric, and accessory rows; dependent quantity-cell removal; surviving-matrix total synchronization; protected lifecycle behavior; shared-architecture Permanent Rule and contract.
- Explicit exclusions: broad archive/restore redesign, legacy archive purge/drop, system/company/master library lifecycle changes, fractional total quantity, finished-measurement editing, company common colors, Factory, AI image generation, dependency/native/EAS work, schema/migration, R2/PDF/token mutation, and production access.

## 2. Product command behavior

- A size or color may be deleted only from an editable, unissued draft and only when its bounded protection policy allows deletion.
- The size/color command repository physically removes every dependent color-size quantity row and synchronizes WorkOrder `total_quantity` and Revision `total_quantity_snapshot` from the surviving matrix sum in the same transaction.
- Eligible WorkOrder-local fabric and accessory rows are physically deleted only while `editing` and with no request, cancelled-after-request, completed, issued, or other protected order history.
- Requested, cancelled-after-request, completed, issued-revision, and legacy archived rows remain protected. Revision and Event history remain the durable evidence boundary.
- Normal mobile deletion no longer calls the archive action and creates no new `archived_at` tombstone. Existing legacy archived rows and archive routes/schema remain bounded compatibility debt and are not purged or dropped.
- System, company, and master catalog lifecycle remains separate from WorkOrder-local draft deletion and receives no mutation from this flow.

## 3. Shared ownership and mobile interaction

- Shared draft-child eligibility and destructive confirmation semantics use canonical typed policy owners rather than separate size/color or fabric/accessory copies.
- Shared size/color behavior uses one typed command/service/repository path where lifecycle and transaction semantics match; entity-specific identifiers remain explicit.
- Material and accessory deletion uses one command boundary and shared mobile controller grammar.
- Command codes, destructive confirmation policy, size/color structure policy, response normalization, and mobile mutation handling each have one canonical owner.
- The Permanent Rule in `09a-codex-execution-lifecycle.md` requires search before creation, an explicit reuse/extend/extract/new/local decision, same-semantics typed sharing, paired-entity reuse, canonical constants, WAFL UI grammar, pure-module boundaries, no speculative abstraction, tests at the owner, and unexplained duplicate logic as a completion blocker.
- `tests/wafl-codex-working-rules-normalization-contract.mjs` verifies that rule at its canonical owner; the full rule is not recopied into `AGENTS.md`, the `09` entry point, or architecture guides.

## 4. API, read-model, and safety preservation

- Exact item DELETE routes retain method, identifier, anonymous, tenant, member, permission, editable-revision, expected-version, idempotency, and production-block guards.
- Active and archived material reads both omit newly hard-deleted rows. Existing archived compatibility rows remain queryable and protected.
- Detail, preview, mobile contract, API client, and normalizer surfaces carry the bounded deletion result without creating a second product model.
- The canonical `work_order.patch_basic_info` contract remains WorkOrder/Revision/Event/Receipt `+1/+1/+1/+0`; total Event/Receipt parity is not required.
- Receipt cleanup identity is always `company_id + command_code + idempotency_key`; no scalar Receipt ID or surrogate schema was introduced.

## 5. Automated Runtime and isolation

- Automated product Runtime lifetime execution was exactly `1/1`, with retry `0`.
- The reconstructed ledger recorded `44` requests and `39` product steps: changed/replay/rejected `25/3/11`.
- Size and color hard delete, connected quantity physical removal, matrix-sum totals, fabric/accessory hard delete, active/archived absence, tombstone zero, replay/idempotency, and every protected state passed.
- Both automated fixtures ended with mutable business residual zero. Append-only Event/Receipt evidence remained preserved and Receipt references were detached by full composite identity.
- The owner-approved equivalent isolation gate passed with stable identifiers and non-fixture state unchanged. User/master/migration/R2/production/document/token mutation was zero.
- iOS manifest/bundle returned `200/200`; exact-owned logs contained no fatal, red-screen, uncaught, unhandled, white-screen, infinite-loading, or crash evidence.

## 6. Owner physical-iPhone acceptance

- The owner used the exact isolated draft `QA A60 초안 삭제 검증 20260810-7C1E4A92`.
- Size `L` deletion removed connected quantity `100` and changed total `250→150` while `XL` remained.
- Saving `남색 × XL` from `100` to `200` changed total `150→250`.
- Deleting `삭제용 회색` removed its `XL 50` cell and changed total `250→200`.
- `삭제 테스트 원단` and `삭제 테스트 부자재` were hard deleted. Deletion of `삭제 취소 확인 원단` was cancelled and the row remained.
- Newly hard-deleted rows appeared in no normal recovery list. Background/re-entry and exactly one Development Client Reload succeeded.
- Final state was `XL` only, `남색` only, total `200`, cancel-check fabric retained, deletion targets absent, and no blocking red/white screen, infinite loading, or crash.

## 7. Exact owner-fixture cleanup

- Finalization captured the owner-approved final fixture state read-only before cleanup: draft/draft version `17/17`, total `200/200`, one size, one color, one quantity, one editing fabric, Event/Receipt `17/16`.
- The one-count difference was exactly the canonical `work_order.patch_basic_info` Event with no Receipt; the other 16 Events were Receipt-backed.
- One exact cleanup transaction used immutable company, marker, WorkOrder, Revision, and child IDs. It removed quantity/size/color/material/revision/WorkOrder `1/1/1/1/1/1`.
- All 17 Event rows and 16 Receipt rows were preserved; all 16 Receipt references were detached by full composite key.
- Post-cleanup marker, WorkOrder, Revision, and mutable-child residuals were zero. User/master/migration/R2/production mutation remained zero.

## 8. Verification and finalization

- Pre-version verification used bundled Node `24.14.0` on the complete alpha.60 implementation fingerprint and passed `89/89`, with fail/skipped `0/0`.
- Root/mobile TypeScript, changed-file ESLint, Runtime/helper parsing, `git diff --check`, Expo public config, dependency checks, Next production build, document links, Unicode, PowerShell encoding, mutation audit, and the automation-infrastructure Canonical Verify profile passed.
- After synchronizing canonical version surfaces, Current Baseline, roadmap, and this evidence, the same complete profile was run again on the final alpha.60 fingerprint.
- Root package metadata remains `0.5.637`; dependencies, schema/migrations, native build identity, EAS inputs, R2, PDF, tokens, and production remain unchanged.
- Candidate commit: `feat: WAFL v2 alpha.60 초안 구성요소 hard delete 완성`.
- This tracked evidence intentionally does not contain the hash of the commit that contains it or final artifact hashes. Post-push Git and artifact identities belong to the matching repo-state and final Result.

## 9. Later boundary

- No next-version design or implementation has started.
- Broader archive/restore lifecycle, fractional total quantity, finished-measurement editing, and company common colors remain separate possible packages.
- Each requires its own owner-approved Delta, data/mutation boundary, Runtime plan, and acceptance. Alpha.60 completion authorizes none of them.
