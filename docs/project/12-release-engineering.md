# PeaceByPiece Release Engineering

## Purpose

This is the canonical pre-1.0 release flow for turning a verified `master` commit into Vercel real-device QA evidence and, later, a production release candidate.

## Branch and Artifact Contract

- `master` is the single development and QA branch before 1.0.
- Local verification precedes commit and push.
- `origin/master` must equal local `master` after Finish.
- Vercel deployment before 1.0 is QA deployment, not automatic production approval.
- Every handoff contains a full source ZIP, matching repo-state, version, commit hash, verification result, DB migration status, and explicit pending manual tests.
- Secrets, local environment files, build caches, reports, and temporary artifacts remain excluded.

## Release Gates

1. Scope gate: changed files match the approved roadmap/PB scope.
2. Static gate: TypeScript, lint where applicable, route/contract checks.
3. Build gate: production build PASS.
4. Mutation gate: high-risk findings are zero or explicitly approved.
5. Data gate: migration/seed/reset/R2 execution status is explicit.
6. Automated QA gate: required profile and targeted tests PASS.
7. Git gate: commit exists, push succeeds, ahead/behind is 0/0, tree is clean.
8. Vercel QA gate: deployment opens and device/browser smoke evidence is recorded.
9. Decision gate: unresolved product-owner decisions remain blocking only for the affected feature, not hidden as test failures.

## Version Finish

Use the tracked pipeline under `tools/pipeline/`. The finish process must stage only explicit files and must not use `git add .`, force push, reset, clean, or branch switching. A failed gate leaves the version uncommitted or clearly marked verification-pending.

## Rollback and Recovery

- A Vercel QA regression is handled by a same-version corrective patch or the next version.
- Rollback does not erase audit evidence.
- DB/R2 changes require their own recovery plan and cannot be inferred from Git rollback.
- Production rollback authority and four-eyes requirements remain a later operational decision.

## Evidence

Minimum release evidence:

- source and result versions;
- commit and origin hashes;
- build/profile result paths;
- changed-file list;
- DB Migration and DB/R2 execution status;
- automatic and manual test results;
- known defects and user decisions;
- deployed QA URL or deployment identifier when available.
