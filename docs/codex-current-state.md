# 0.24.34.14 Codex 0.24.35 Start Gate

- Current GPT checkpoint: `0.24.34.14`.
- `0.24.34.13` owner-provided build/repo-state result was checked before this patch.
- Build status from owner log: Next.js production build passed, TypeScript passed, static generation completed `66/66`.
- Repo-state status from owner log: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.24.34.13`.
- This patch records the final GPT-side start gate before Codex can begin `0.24.35`.
- `0.24.35` Export implementation has not started. Owner approval is still required.

## 0.24.35 start gate

Codex must not begin `0.24.35` until the owner explicitly approves implementation after `0.24.34.14` is applied, built, and repo-state is checked.

The first Codex implementation step must be continuation A. Do not combine A~E. Do not run Final as an implementation prompt.

# 0.24.34.12 Canonical and Codex Prompt Synchronization

- Current GPT checkpoint: `0.24.34.12`.
- `0.24.34.11` owner-provided build/repo-state result was checked before this patch.
- Build status from owner log: Next.js production build passed, TypeScript passed, static generation completed `66/66`.
- Repo-state status from owner log: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.24.34.11`.
- This patch synchronizes the Codex continuation prompt guardrails before `0.24.35`.
- `0.24.35` Export implementation has not started.

## Mandatory Codex read order for the next implementation window

Every Codex implementation prompt must start by reading these documents in order:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. `docs/project/32-product-completion-and-ui-evidence-standard.md`
6. `docs/project/33-workorder-pdf-size-dashboard-finalization.md`
7. Latest relevant `docs/audits/0.24.34.x-*.md`
8. The target `lib/internal/roadmap/roadmap-*.ts`
9. Older project documents only when needed for historical context

Confirmed policy decisions already marked `CONFIRMED` must not be re-asked. If a later canonical document conflicts with an older document, the later canonical decision wins.

## Patch packaging contract

GPT/Codex generated patch ZIPs must use flat ZIP structure and the `commit-meta.md` token contract below:

- `Version :`
- `Summary :`
- `Description :`
- `수정 파일 목록 :`
- `추가 파일 목록 :`
- `삭제 파일 목록 :`

Do not use the old `변경 파일 목록 :` token. Keep pending tests outside `삭제 파일 목록 :`; use chat response or `pending-tests.md`.

## Source/evidence separation

Source ZIPs must exclude runtime and evidence artifacts including `.git/`, `.next/`, `node_modules/`, `artifacts/`, `playwright-report/`, `test-results/`, `reports/`, `coverage/`, `blob-report/`, `.nyc_output/`, `*.tsbuildinfo`, `*.zip`, `storageState*.json`, `*.har`, and `*.webm`.

QA evidence ZIPs must remain separate from source ZIPs and must not be committed unless an explicit evidence artifact is requested outside source packaging.

## Codex continuation sequence

Run the continuation prompts in this order only:

1. A — Factory-delivery workorder PDF template
2. B — Size standards and measurement UI
3. C — Live workorder runtime and factory save
4. D — Returning signup applicant and policy modal
5. E — Customer dashboard and system admin screens
6. Final — final review, evidence check, commit, push

Do not combine A~E into one large implementation. Do not start Final until A~E are completed and user review is complete. Do not start `0.24.35` without owner approval.


# 0.24.34.11 Applied Result Static Check

- Current GPT checkpoint: `0.24.34.11`.
- Verified owner-provided `0.24.34.10` repo-state/source ZIP statically.
- `0.24.35` Export implementation has not started.
- Next GPT task before Codex: `0.24.34.12` canonical/Codex prompt synchronization.

# Codex Current State - 0.24.34.10

## Version

- Current version: `0.24.34.10`.
- Current implementation version: `0.24.34.10`.
- Branch: `master`.
- Latest implementation version: `0.24.34.10` Pipeline Contract Final Check.
- Next official feature: `0.24.35` Company-wide Export Execution.
- 0.24.35 implementation has not started.

## 0.24.34.10 Pipeline Contract Final Check

`0.24.34.10` is a GPT-side static checkpoint after the watcher cleanup.

Confirmed baseline before this patch:

- `0.24.34.9` build passed.
- `repo-state` printed `APP_VERSION: 0.24.34.9`.
- `master` matched `origin/master`.
- Working tree was clean.
- Canonical watcher files are `download-watcher.ps1` and `dev-server-watcher.ps1`.
- Versioned temporary watcher files must not remain in source ZIPs.

Patch contract going forward:

- `commit-meta.md` must use:
  - `Version :`
  - `Summary :`
  - `Description :`
  - `수정 파일 목록 :`
  - `추가 파일 목록 :`
  - `삭제 파일 목록 :`
- Do not use `변경 파일 목록 :` for new GPT patches.
- Source ZIP and QA evidence ZIP must remain separate.
- Source ZIP must exclude runtime/evidence/build artifacts.
- `repo-state` must print the concrete `APP_VERSION` value.

## Historical notes

# Codex Current State - 0.24.34.7

## Version

- Current version: `0.24.34.7`.
- Current implementation version: `0.24.34.7`.
- Branch: `master`.
- Latest implementation version: `0.24.34.7` Pipeline Packaging and Cleanup Audit Guard.
- Next official feature: `0.24.35` Company-wide Export Execution.
- 0.24.35 implementation has not started.


## 0.24.34.7 Packaging/Cleanup Guard

`0.24.34.7` is a pipeline packaging and cleanup-audit version.

Confirmed changes:

- `tools/pipeline/pipeline-patch-processing.ps1` now reads `APP_VERSION` from `lib/constants/version.ts` rather than the `app.ts` re-export file.
- download-watcher patch processing backup ZIP creation now excludes QA artifacts/test output/report directories and generated files.
- `tools/pipeline/peacebypiece-auto-pipeline.ps1` source ZIP contract now also blocks `blob-report`, `coverage`, `.nyc_output`, `storageState*.json`, `*.har`, and `*.webm`.
- source ZIP and QA evidence ZIP remain separate artifacts.
- Korean docs folder names must not be renamed from Linux/ChatGPT mojibake observation alone; Windows/Git confirmation is required.

0.24.35 remains not started.


## Mandatory Read Order

Before implementation, Codex must read in this order:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. `docs/project/32-product-completion-and-ui-evidence-standard.md`
6. `docs/project/33-workorder-pdf-size-dashboard-finalization.md`
7. the latest confirmed topic specs relevant to the target work
8. `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md`
9. `docs/audits/0.24.34.6-system-admin-screen-gap-audit.md`
10. `docs/audits/0.24.34.6-customer-workspace-screen-gap-audit.md`
11. `docs/audits/0.24.34.7-source-zip-packaging-audit.md`
12. `docs/audits/0.24.34.7-project-structure-and-cleanup-audit.md`
13. `docs/audits/0.24.34.7-refactor-candidates-audit.md`
14. `docs/productization-roadmap.md`
15. the target `lib/internal/roadmap/roadmap-*.ts`
16. the relevant `docs/codex-prompts/0.24.34.5-*` prompt document before each continuation
17. older/provisional documents

Current 0.24.34.5 continuation prompt documents:

- `docs/codex-prompts/0.24.34.5-continuation-a-workorder-pdf-template.md`
- `docs/codex-prompts/0.24.34.5-continuation-b-size-standards-ui.md`
- `docs/codex-prompts/0.24.34.5-continuation-c-live-workorder-runtime.md`
- `docs/codex-prompts/0.24.34.5-continuation-d-signup-return-policy-modal.md`
- `docs/codex-prompts/0.24.34.5-continuation-e-dashboard-system-admin.md`
- `docs/codex-prompts/0.24.34.5-final-review-and-commit.md`

Rules:

- CONFIRMED policy is not re-asked.
- If implementation, an older roadmap, or general SaaS convention conflicts with final owner policy, classify it as an implementation mismatch.
- The latest implementation audit is evidence of actual completion state, not a replacement for final owner policy.
- A historical roadmap entry marked `completed` means that entry's declared scope was completed. It does not prove that every higher-level canonical product requirement in the same domain is finished.


## 0.24.34.6 Prompt Execution Reinforcement

- `0.24.34.6` is a document/audit/prompt-preparation version, not a product implementation closeout.
- The `docs/codex-prompts/0.24.34.5-continuation-*.md` documents must be executed one at a time in this order: A -> B -> C -> D -> E -> Final.
- Each continuation must stop at its checkpoint with source ZIP, matching repo-state, and QA evidence ZIP when the work changes PDF or visible UI.
- Do not merge A-E into one large implementation run unless the owner explicitly approves it after reviewing the prior checkpoint.
- PDF/screen implementation output must not be finally committed or pushed before owner visual review.
- `0.24.35 — Company-wide Export Execution` remains not started until the final review prompt completes.

## 0.24.34.6 Audit Update

- `0.24.34.6` is a document-only gap audit version created before Codex implementation resumes.
- Added canonical route-level audits:
  - `docs/audits/0.24.34.6-system-admin-screen-gap-audit.md`
  - `docs/audits/0.24.34.6-customer-workspace-screen-gap-audit.md`
- These audits do not complete implementation. They define the missing and weak productization areas that must be considered in `0.24.34.5` continuations and before `0.24.35`.
- `0.24.35 — Company-wide Export Execution` remains not started.
- Known documentation caveat: there are two existing `docs/project/33-*` files. Future new project policy documents should avoid duplicate numbering.
- Known tooling caveat: the repo-state generator can read APP_VERSION from a re-export file and print `export { APP_VERSION } from "./version";`; future Codex work should read `lib/constants/version.ts` directly.

## Policy Authority

- Trial remains 7 days, 100MB, and 3 members.
- Payment readiness remains mandatory before Trial approval.
- Raw card data must never be stored.
- Actual PG/provider selection, merchant secrets, production webhook, real charge/refund, and actual email delivery remain deferred or separately approved.
- System-admin actual/effective session boundaries and runtime-independent internal read screens remain unchanged.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, Purge, and production mutation guards remain unchanged.

## Latest Completed State

0.24.33 and 0.24.33.1 completed the public signup and approval path plus authenticated browser QA automation:

- `/signup` public Trial entry and login CTA separation.
- Applicant application form and system-admin review queue/detail.
- Dev/test payment-readiness preparation and approval guard.
- Trial/company/admin/catalog/quota provisioning integration.
- Authenticated applicant, system-admin, and approved company-admin fixtures in non-production runtime.
- Chromium/WebKit/mobile/iPad browser matrix and deployed read-only smoke.
- Certificate PNG/JPEG/PDF/revoke integration with residual DB/R2 0.

Remaining manual QA:

- Actual Google OAuth round trip.
- Actual iPhone/iPad Safari OAuth and native file picker.
- Actual Vercel session refresh and real-device safe-area/keyboard behavior.

These manual checks do not block 0.24.34 implementation, but they remain `PENDING_USER_QA` and must be revisited before launch or after signup/auth changes.

## Foundation vs Product Completion Reconciliation

The 0.24.33.1 full audit found that several historical sprints completed their bounded foundation scope but not the complete customer-facing product path.

Completed foundations:

- 0.24.27: system catalog, size-set, POM definitions, activation, and provisioning foundation.
- 0.24.28: supplier order-request PDF and private R2 lifecycle/reconciliation foundation.
- 0.24.31~0.24.32: PG-neutral billing policy, persistence, simulator, export/termination/notification foundation.
- 0.24.30: storage capacity profiles and principal quota guards.

0.24.34 completed product paths:

- Workorder size-set/POM selection from active defaults.
- Size-by-POM measurement editing and persistence with cm/inch and 1/8-inch validation.
- Incomplete workorder PDF and final workorder PDF as distinct generated document types.
- Incomplete watermark, status badge, missing-item list, final eligibility, size/POM pages, latest-only retention, failure-safe replacement, private R2 lifecycle, quota accounting, and inline viewer.

Still open product paths:

- Full copy/reproduction UI proof for size/POM snapshots beyond repository/schema contracts.
- Rendered PDF visual QA on real devices remains `PENDING_USER_QA`.
- First-failure operator notification is recorded as foundation/backlog unless the actual notification provider is separately approved.
- Actual Company-wide Export ZIP execution, expiry, split parts, cleanup, plan enforcement, and final termination Export.
- Durable termination/recovery/deletion scheduler and exact execution.
- Actual PG/email/provider/production launch integrations.
- Inquiry, monitoring, CI, accessibility, performance, backup/restore, and launch QA.

Canonical evidence:

- `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md`

## Current Roadmap

- Current detail: `lib/internal/roadmap/roadmap-0.24.34.5.ts`.
- Next planned feature: `0.24.35` Company-wide Export Execution.
- Productization roadmap: `docs/productization-roadmap.md`.
- Runtime roadmap screen: `/roadmap`.

## 0.24.34 Completed Scope

`0.24.34 — Workorder Size Specification and Incomplete/Final PDF`

Implemented scope:

- Workorder size-set selection and POM rows from active defaults.
- Size-by-POM editing and persistence.
- cm/inch support and deterministic 1/8-inch handling.
- Company defaults/workorder overrides where current policy allows.
- Size/POM snapshot schema and repository support for copy/reproduction preservation.
- Incomplete workorder PDF with watermark, status badge, and missing-item list.
- Final workorder PDF with canonical eligibility and size/POM pages.
- Explicit separation from supplier order-request PDF.
- Latest-only final PDF retention, failure-safe replacement, private R2 lifecycle, quota accounting, and exact cleanup hooks.
- Responsive workorder editing surface for desktop/tablet/mobile.

Out of scope:

- Company-wide Export execution (`0.24.35`).
- Termination/recovery/automatic deletion execution (`0.24.36`).
- Operations/inquiry/monitoring/CI/accessibility/performance (`0.24.37`).
- Actual PG/email/provider/production work unless separately approved.

## 0.24.34.1 Patch Scope

`0.24.34.1 — Public Signup First-Draft Flow Fix and Repo-state Metadata Correction`

Implemented scope:

- Google OAuth-success applicant sessions with no signup application row are treated as a normal first-draft state.
- `/api/signup/application/certificate` GET returns `{ ok: true, certificate: null }` when the applicant has no application yet.
- Signup dashboard separates applicant/application loading from consent and certificate loading failures.
- Certificate upload remains blocked until the first draft application is saved.
- First-draft users see the company information form and do not loop back to the Google signup CTA.
- Repo-state metadata publication is corrected so the 0.24.34 workorder-size-pdf migration/audit evidence is explicit.

Out of scope:

- 0.24.35 Company-wide Export execution.
- Worker changes or deployment.
- Actual PG/email.
- Production mutation.
- New DB migration.

## 0.24.34.2 Patch Scope

`0.24.34.2 - Customer-facing Product UX, System Catalog, Size Editing, and Workorder PDF Integration Cleanup`

Implemented scope:

- Public signup copy was simplified for customers and no longer presents implementation terms as user-facing guidance.
- Signup uses plan cards, terms/privacy viewers, automatic draft creation on certificate file selection, and a single `가입 신청 제출` action.
- Customer company file copy avoids R2/DB/API implementation wording in customer-facing fallback states.
- System catalog is presented as `기준관리 - 생산품 분류·사이즈·치수`, with product categories, size sets, POMs, and default measurement chart discovery in one entry.
- Workorder size/POM details are summarized in the side panel and edited in a modal.
- Inch input is split into whole-number and 1/8-fraction controls.
- Workorder PDF output is a single action; the server automatically chooses incomplete or final based on completeness.
- Generated workorder PDF filenames use safe Korean status labels.
- Missing PDF object viewer fallback is a customer-safe HTML state instead of a raw JSON error page.

Out of scope:

- 0.24.35 Company-wide Export execution.
- New DB migration, production migration, or production data mutation.
- Worker source changes or deployment.
- Actual PG/email provider integration.
- Broad public marketing site redesign or `/workers` redesign.

## 0.24.34.3 Patch Scope

`0.24.34.3 - Workorder PDF Live R2 Integration and Visual Verification`

Implemented scope:

- Generated workorder PDF completion requires non-empty PDF binary and R2 read-back verification before attachment metadata registration.
- Workorder PDF response links use the tenant-scoped workorder generated-PDF viewer route instead of a generic raw-key file proxy.
- The workorder PDF viewer supports inline view and server-proxied download disposition without exposing a signed URL or raw R2 URL.
- PDF/R2 lifecycle integration now records incomplete workorder PDF, final workorder PDF, order-request PDF type isolation, previous-final preservation, exact cleanup, and residual DB/R2 evidence.
- R2 Upload Worker remains `0.13.71`; PDF Generator Worker remains `0.16.1.1`.

Out of scope:

- 0.24.35 Company-wide Export execution.
- New DB migration, production migration, or production data mutation.
- Worker source changes or deployment.
- Actual PG/email provider integration.

## Planned Sequence After 0.24.34.4

1. `0.24.34.4 — Workorder Runtime Recovery, Right-side Size Panel, WAFL Modal, and Signup Submission E2E`
2. `0.24.35 — Company-wide Export Execution`
3. `0.24.36 — Termination, Recovery, and Automatic Deletion Execution`
4. `0.24.37 — Operations, Inquiry, Monitoring, CI, Accessibility, Performance, and Backup/Restore Foundations`
5. External-dependency/launch versions for actual PG, email, production infrastructure, DNS/domain, legal review, and consolidated launch QA.


## 0.24.34.3.1 Product Completion Standard

`0.24.34.3.1 — Product Completion, Canonical WAFL UI, and Automated Evidence Standard`

Confirmed rules:

- UI work is complete only at `LEVEL_4_PRODUCT_VERIFIED`.
- Code existence, build, typecheck, lint, and static contracts alone are not product completion.
- Exact host component, section order, forbidden duplicate locations, and canonical WAFL imports must be stated and verified.
- Localhost Playwright evidence is mandatory: desktop/mobile screenshots, iPad when relevant, interaction screenshot, locator assertions, console error 0, unexpected failed request 0, and trace/network diagnostics for failures.
- Credentials remain in gitignored local environment or storageState inputs and never enter Git or handoff ZIPs.
- Full Reset is prohibited as a generic fix; API, loading-state, migration, schema, and query evidence plus user approval are required.
- Canonical detail: `docs/project/32-product-completion-and-ui-evidence-standard.md`.

## 0.24.34.4 Completed Scope

Before 0.24.35, Codex completed:

- workorder list/detail indefinite-loading diagnosis and runtime repair without assuming Full Reset,
- size summary in the canonical right-side panel after 디자인, 첨부 파일, 공장 전달사항, with the center duplicate removed,
- replacement of the screen-local size dialog overlay with canonical WAFL modal and controls,
- real dev/test signup submit → system-admin queue → approval → Trial → workspace E2E,
- customer-copy audit in running localhost screens,
- automated desktop/mobile/iPad screenshots, locator assertions, console/network evidence, and traces,
- requirement matrix with every mandatory item at `LEVEL_4_PRODUCT_VERIFIED`.

0.24.35 must not start before this mandatory patch is product-verified.

## 0.24.34.4 Product Verification Result

0.24.34.4 reached `LEVEL_4_PRODUCT_VERIFIED` for the scoped localhost product evidence:

- Product Verified: `true`.
- E2E/Smoke Summary: `PASS - workorder runtime and public signup browser verification completed`.
- Workorder repository fetch started: `PASS`.
- Workorder summary request count: `1`.
- Workorder detail request count: `1`.
- Workorder list runtime: `PASS`.
- Workorder detail runtime: `PASS`.
- Infinite loading regression: `PASS`.
- Loading error state: `PASS`.
- Size right-panel placement: `PASS`.
- Size central-panel removal: `PASS`.
- Factory instruction ordering: `PASS`.
- Canonical WAFL modal import: `PASS`.
- Direct overlay audit: `PASS`.
- Desktop/mobile/iPad browser matrix: `PASS`.
- Public signup browser verification: `PASS - 20/20`.
- Console error count: `0`.
- Failed request count: `2 total non-workorder cancelled background requests; 0 workorder failures`.
- HTTP 4xx/5xx count: `0`.
- First runtime failure stage: `HMR origin mismatch before repository fetch`.
- API request 0 root cause: `127.0.0.1 baseURL과 localhost dev server origin 불일치`.
- Runtime fix: Playwright and session helpers now use `http://localhost:3000` consistently.
- Full Reset used: `false`.
- Full Reset reason: `NOT_APPLICABLE - client runtime origin mismatch; DB reset unnecessary`.
- DB migration applied: `NOT_APPLICABLE - no migration in 0.24.34.4`.
- Final residual DB rows: `NOT_APPLICABLE - no DB fixture mutation`.
- Final residual R2 objects: `NOT_APPLICABLE - no R2 mutation`.
- Business data mutation: `false`.
- Production mutation: `false`.
- Worker changed/deployed: `false`.

0.24.35 must not start until this patch is committed, pushed, and the final `4. Newest` handoff contains the matching source ZIP and repo-state.

## 0.24.34.5 Current Checkpoint Scope

0.24.34.5 is a user-review checkpoint, not the start of 0.24.35.

- Product Completion Level target before user review: `PRODUCT_QA_INCOMPLETE` until every live PDF, signup-returning, policy-modal, system-dashboard, and evidence ZIP requirement is complete.
- Commit/push: `NOT_RUN` until the user reviews PDF and screen evidence.
- Scope: live workorder selection/loading, factory save error handling, generated PDF/viewer evidence, system size information linkage, returning signup applicant state, policy modal unification, simplified system signup review, compact system dashboard, and system companies role cleanup.
- Evidence: PDF page PNGs, desktop/mobile/iPad screenshots, JSON manifests, requirement matrix, and a separate QA evidence ZIP under `C:\CWJ_Project\Patch\PeacebyPiece\5. QA_Evidence\`.
- Exclusions: `0.24.35`, production DB/R2/Worker access, Full Reset, destructive migration, actual PG/email, and final commit/push.

### 0.24.34.5 Continuation Evidence Status

- Product completion level: `PRODUCT_QA_INCOMPLETE`.
- Product verified: `false` until user PDF/screen review and remaining manual OAuth evidence are complete.
- Workorder localhost evidence:
  - Chromium desktop: `PASS`.
  - Mobile Chromium: `PASS`.
  - iPad WebKit: `PASS`.
  - Workorder summary request count across latest manifests: `12`.
  - Workorder detail request count across latest manifests: `11`.
  - HTTP 4xx/5xx count across latest manifests: `0`.
  - Page error count across latest manifests: `0`.
  - Console error count across latest manifests: `2` (`/api/policies/reagreement` abort/resource timing noise remains recorded, not hidden).
  - Failed request count across latest manifests: `7` (abort/cancel during navigation; workorder summary/detail/PDF requests completed).
- Root causes fixed:
  - Actual dev/test workorder IDs use `wo-...`; opaque route validation previously accepted only `wo_...`.
  - Generated workorder/order-request PDF viewer previously attempted direct R2 reads while the dev/test flow uses the Worker-backed storage path; the route now performs server-side signed Worker GET without exposing signed URLs to the browser.
  - Mobile/iPad hydration mismatch from viewport-dependent first render was reduced by using a stable initial layout size and switching after mount.
- Product screenshot evidence:
  - Public signup policy modal: `PASS`.
  - System dashboard: `PASS`.
  - System companies role cleanup screen: `PASS`.
  - System signup review screen: `PASS`.
- PDF evidence:
  - Server-proxied workorder PDF viewer: `PASS`.
  - PDF binary saved under `artifacts/pdf-qa/0.24.34.5/`.
  - PDF page PNG render: `PASS` for page 1 and page 2.
- Known remaining items:
  - User visual review of generated PDF and screenshots is still required.
  - Same Google account returning-applicant OAuth round trip remains manual/blocked in local automation.
  - Consent hash persistence is not implemented because it requires schema change outside this checkpoint.
  - Parallel browser PDF generation against the same dev/test fixture is not treated as final PASS; latest final evidence uses per-browser PASS manifests.
- DB/R2/Worker:
  - DB migration: `NOT_APPLICABLE - no migration in 0.24.34.5`.
  - Production mutation: `false`.
  - Worker changed/deployed: `false`.
  - Dev/test QA did exercise existing workorder factory save and PDF generation paths; no production data was touched.


## 0.24.34.5 Finalization Policy Before Further Implementation

Canonical finalization detail: `docs/project/33-workorder-pdf-size-dashboard-finalization.md`.

Before any further `0.24.34.5` coding or Codex handoff, the finalization policy and sequence in document 33 must be treated as canonical. The next Codex implementation must not start from ad-hoc instructions only.

Confirmed owner decisions recorded there include:

- factory-delivery workorder PDFs use the existing table-style production layout, not the temporary English size-only layout;
- factory PDFs exclude unit price, amount, internal labor cost, loss cost, total cost, and margin;
- factory PDFs include representative design image, factory instructions, fabric/accessory/process production information, and Korean size pages when applicable;
- incomplete and final workorder PDFs share the same template and differ only by status/watermark/missing-item display;
- generated PDFs must appear in the generated-document/attachment area;
- size specs are based on system-admin reference data and saved as workorder snapshots;
- size input must be audited/refactored toward canonical WAFL measurement controls and simplified inch input;
- the customer workspace dashboard must remove or compact the large `PLAN AND STORAGE` block and prioritize work queues;
- returning signup applicants must see the correct application state, not the application form again;
- signup policy viewers must use the canonical policy viewer and policy version/effective-date source;
- `/system/signup-applications`, `/system`, and `/system/companies` roles must be simplified without deleting customer operations routes.

Implementation order before `0.24.35`:

1. PDF template replacement.
2. Size reference linkage and input UI cleanup.
3. Live workorder runtime confirmation.
4. Signup returning-applicant and policy viewer cleanup.
5. Customer/system dashboard UX cleanup.
6. Evidence package, user review, final verification, then commit/push.

`0.24.35 — Company-wide Export Execution` remains blocked until the above checkpoint is resolved or explicitly re-prioritized by the owner.

## 0.24.34.13 Codex Prompt Consistency Final Review

`0.24.34.13` is a GPT-side consistency checkpoint created after the owner provided successful `0.24.34.12` build and repo-state results.

Confirmed baseline before this checkpoint:

- `0.24.34.12` build passed.
- TypeScript passed.
- Static page generation completed `66/66`.
- `master` matched `origin/master`.
- Working tree was clean.
- `APP_VERSION` was reported as `0.24.34.12`.

Active Codex prompt execution order remains:

1. A — `0.24.34.5-continuation-a-workorder-pdf-template.md`
2. B — `0.24.34.5-continuation-b-size-standards-ui.md`
3. C — `0.24.34.5-continuation-c-live-workorder-runtime.md`
4. D — `0.24.34.5-continuation-d-signup-return-policy-modal.md`
5. E — `0.24.34.5-continuation-e-dashboard-system-admin.md`
6. Final — `0.24.34.5-final-review-and-commit.md`

The prompts must stay separated by checkpoint. A~E must not be merged into one implementation pass. Final must not implement new features.

`0.24.35` remains blocked until owner approval. The next GPT-side task, if needed, is `0.24.34.14` start-gate documentation for Codex.

