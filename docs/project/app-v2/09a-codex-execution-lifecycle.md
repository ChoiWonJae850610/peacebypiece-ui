# WAFL Codex Execution Lifecycle

Document type: **Permanent Rules — Execution Lifecycle**

Entry point: [09-codex-working-rules.md](09-codex-working-rules.md)

This document owns the standard sequence from preflight through completion. It does not grant Runtime, mutation, production, native, dependency, or destructive authority.

## 1. Actual KST reporting

- Query actual `Asia/Seoul` time at each required report checkpoint.
- Intermediate and Failure Handoff reports begin with `작업 확인 시각: YYYY-MM-DD HH:mm KST`.
- Final delivery begins with `작업 종료 시각: YYYY-MM-DD HH:mm KST`.
- Do not reuse an earlier timestamp or infer it from UTC, commit time, or file time.
- Final time is recorded only after required validation, teardown, Git, push, artifact, and clean-state checks finish.

## 2. Start-of-work preflight

Before edits, verify the actual repository path, branch, HEAD, origin branch, ahead/behind, staged/unstaged/untracked paths, canonical APP_VERSION, scoped package/public/native versions, the named baseline artifact pair when applicable, and the required Runtime/data/remote state.

Unexpected dirty state, wrong branch or HEAD, origin divergence, artifact mismatch, unknown process ownership, unexplained mutation, migration mismatch, or remote-operation risk is a stop condition. Preserve the state. Do not reset, checkout, restore, clean, stash, pull, rebase, roll back, or broadly terminate processes to manufacture the expected baseline.

## 3. Standard lifecycle

Use the applicable steps in order:

1. preflight and start PC/resource audit;
2. authority, architecture, source, contract, and current-state audit;
3. characterize behavior before a structural change;
4. implement only the bounded Delta;
5. run targeted tests and static validation after meaningful extraction steps;
6. run the required Canonical Verify on the final changed fingerprint;
7. decide whether Runtime is required, explicitly recording `NOT_REQUIRED` when it is not;
8. when required, perform the pre-Runtime audit, canonical runner start, ownership/ports/Serve/Funnel checks, mutation-free preflight, and automated Runtime QA;
9. request only the minimum physical-device QA that automation cannot establish;
10. stop the runner by exact ownership, audit effects and PC state, and preserve unrelated processes/services;
11. finish evidence, version metadata, and canonical owner documents;
12. run final verification if the Delta requires a post-QA final pass;
13. follow `09d` for exact-path stage, commit, push, artifacts when applicable, and clean completion.

Do not postpone all feedback until one large rewrite. Run bounded checks at meaningful boundaries. Do not automatically repeat a failed command; use the failure rule in `09c`.

## 4. Audit and implementation discipline

- Record current responsibility ownership, duplicated state or policy, dependency direction, and extension conflicts before architecture work.
- Prefer public behavior and canonical response effects over JSX shape, line count, private function names, or incidental file locations.
- Preserve unrelated dirty files and owner changes.
- Do not add dependencies, migrations, broad abstractions, or future features without exact scope.
- If completion needs a materially wider authority, stop and request that authority through a Failure Handoff.

## 5. Static and Canonical verification

Follow `17-v2-api-contract-test-plan.md`, repository scripts, and the Delta. Applicable gates include:

- targeted unit, behavior, component, and contract tests;
- parser or PowerShell parser checks;
- root/mobile TypeScript and targeted ESLint;
- Next production build and Expo config/dependency/Doctor checks;
- document links, Unicode, secret, temporary-origin, and tracked-env checks;
- migration guard and mutation audit;
- `git diff --check`, then cached diff check before commit;
- canonical `approved-workflow.ps1 -Action Verify` on the final changed fingerprint.

Reuse a prior PASS only when profile, HEAD, changed paths, fingerprint, and the Delta explicitly allow it. A source change after validation invalidates the affected checks.

## 6. Runtime decision and QA

Runtime is required for behavior that static tests cannot establish and is prohibited when the Delta declares static/documentation-only work. Runtime commands always follow `09b` and the specialist runbook.

Automation proves deterministic connection, read/query, state, request-count, mutation, recovery, and teardown behavior. Do not ask the owner to repeat deterministic combinations already covered.

Physical-device QA focuses on actual layout, keyboard, scrolling, native sheet/reel feel, haptics, background/re-entry, and owner visual judgment. Source, simulator, manifest, or bundle reachability cannot establish physical-device PASS. Record unrun devices as `NOT_RUN`.

If a save QA is necessary, disclose the exact target, expected versions/events/receipts, and exact Check count before the action. After a device failure, do not request a retry, reload loop, or additional save. Preserve logs and effects, stop safely when required, audit read-only, and hand off.

Generator limitations such as `Manual QA Status: not provided` do not erase actual owner evidence. Record the generator output truthfully and preserve actual QA in evidence and the final report.

## 7. Completion

Declare the target status only after all applicable implementation, Runtime/device QA, effect audit, exact stop, documentation/version, verification, Git, push, artifact, and clean-state gates pass. Documentation/static maintenance uses its explicit exception in `09d`; it does not inherit product Runtime or artifact requirements.
