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
