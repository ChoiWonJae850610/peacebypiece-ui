# Codex Current State - 0.24.28

## Current Snapshot

- Current version: `0.24.28`.
- Current implementation version: `0.24.28`.
- Current work result: **0.24.28 PDF and R2 Lifecycle validation PASS before commit**.
- Previous completed version: `0.24.27` System Catalog, Sizes, and POM.
- Next official work after this checkpoint: reserved productization checkpoint before `0.24.30` Storage Capacity Profiles.

## Policy Source Order

For product policy, billing, signup, trial, access-boundary, PDF/R2, and launch decisions, use:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. related latest confirmed topic specs
6. `lib/internal/roadmap/*`
7. older/provisional documents

If implementation, old roadmap text, or general defaults conflict with final owner policy, classify it as implementation mismatch and align the implementation/roadmap to final policy.

## 0.24.27 Carryover Corrections

- README and docs README now point to existing canonical UTF-8 document paths.
- `document-structure-contract` checks canonical UTF-8 links instead of mojibake placeholders.
- System catalog seed unsets previous `is_current` rows before marking the current version, without changing existing company catalog activation rows automatically.
- Menu 7 repo-state/build-result publication keeps explicit verification fields and must not infer PASS for not-run items.

## 0.24.28 Scope

0.24.28 is the PDF and R2 Lifecycle sprint.

Included:

- Canonical PDF document type and field visibility policy.
- Canonical generated PDF key: `companies/{companyId}/workorders/{workOrderId}/pdf/{pdfId}.pdf`.
- Server-side due-date guard for order-request/vendor/share PDF generation.
- Exact-key cleanup when R2 PDF upload succeeds but DB metadata registration fails.
- Cloudflare R2 upload Worker source policy for canonical workorder PDF keys.
- Static contracts for PDF policy, R2 key policy, Worker signature regression, PowerShell menu wiring, and roadmap.
- PowerShell menu entries for PDF/R2 read-only audit, local fixture generation, dev/test lifecycle integration, reconciliation dry run, and exact cleanup plan.

Excluded:

- Production DB/R2 mutation.
- Production Worker deployment.
- Actual Kakao Biz message/API integration.
- Storage quota enforcement.
- PG/billing operation.

## Worker And Integration State

- R2 upload Worker source/deployed dev-test version: `0.13.71`.
- PDF Generator Worker version: `0.16.1.1`; unchanged in 0.24.28.
- Guarded live PDF/R2 lifecycle integration passed on approved dev/test DB/R2.
- Integration covered upload, trash, restore, regeneration, permanent delete, missing detection, orphan detection, upload success/DB failure cleanup, 1MB/5MB/10MB boundary, over-10MB reject, reconciliation, exact cleanup plan, and residual cleanup.
- Final residual DB rows: `0`.
- Final residual R2 objects: `0`.

## Data Safety

- DB migration: none for 0.24.28.
- Production DB mutation: forbidden.
- Production R2 mutation: forbidden.
- Prefix delete and bucket-wide cleanup: forbidden.
- Cleanup must use manifest-scoped exact keys only.
- Raw R2 keys, signed URLs, worker endpoints, DB URLs, tokens, cookies, and secrets must not be exposed to clients or logs.

## Manual QA

- PDF visual layout still needs manual PC/mobile QA after automatic validation.
- Due-date-missing behavior should be checked from the workorder PDF action.
- Live R2 lifecycle integration is complete for approved dev/test. Manual PDF visual QA remains recommended after Vercel deployment.
