# Codex Current State - 0.24.29

## Current Snapshot

- Current version: `0.24.29`.
- Current implementation version: `0.24.29`.
- Current work result: **Integrated Productization Checkpoint**.
- Previous completed versions:
  - `0.24.26` Public Signup, Verification, Approval, and Trial.
  - `0.24.27` System Catalog, Sizes, and POM.
  - `0.24.28` PDF and R2 Lifecycle.
- Next official version: `0.24.30` Storage Capacity Profiles.

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

## 0.24.29 Scope

0.24.29 is the Integrated Productization Checkpoint. It does not add a new large feature. It verifies and packages the combined flow from signup through approval provisioning, system catalog, workspace access, workorder PDF generation, and PDF/R2 viewer/lifecycle evidence.

Included:

- APP_VERSION and roadmap/current-state synchronization to `0.24.29`.
- Signup review and catalog QA-surface copy/responsive cleanup.
- Signup/provisioning guarded dev/test integration regression.
- System catalog guarded dev/test integration regression.
- PDF/R2 lifecycle regression based on 0.24.28 live PASS evidence plus policy/static contracts.
- Route/navigation, authorization, tenant, mock/hardcoded, Vercel readiness, and mutation audit evidence.
- Manual QA checklist for PC, iPhone, iPad, and Android validation.
- Repo-state metadata cleanup so contract summary is grouped/count-based rather than repeated `contract` labels.

Excluded:

- `0.24.30` Storage Capacity Profiles, Trial quota enforcement, quota race, warning/grace/termination/deletion.
- PG/billing/payment method work.
- Notification email sending.
- Kakao external API sending.
- Customer dashboard redesign or `/workers` density redesign.
- PDF/R2 lifecycle feature expansion.

## Worker And Integration State

- R2 upload Worker source/deployed dev-test version: `0.13.71`.
- PDF Generator Worker version: `0.16.1.1`.
- 0.24.28 guarded live PDF/R2 lifecycle integration passed on approved dev/test DB/R2.
- PDF/R2 final residual DB rows: `0`.
- PDF/R2 final residual R2 objects: `0`.
- 0.24.29 does not require Worker source change or redeployment unless a checkpoint regression proves otherwise.

## Data Safety

- DB migration this version: none.
- Production DB mutation: forbidden.
- Production R2 mutation: forbidden.
- Production Worker mutation: forbidden.
- Dev/test fixture mutation is allowed only through approved guarded runners with residual DB/R2 0.
- Raw DB URLs, Worker URLs, R2 keys, signed URLs, tokens, cookies, and secrets must not be exposed to clients, docs, logs, or repo-state.

## Manual QA

- Manual QA status: `PENDING_USER_QA`.
- Checklist: `docs/qa/0.24.29-integrated-productization-checkpoint.md`.
- Codex automatic validation is not a substitute for real-device visual QA on Vercel.
