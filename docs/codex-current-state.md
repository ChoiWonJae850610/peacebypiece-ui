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
