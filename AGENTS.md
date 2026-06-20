# Codex Operating Rules

## Start Of Work
- Before changing files, check `git status`, the current branch, and `HEAD`.
- Do not edit files when the user asks for analysis, inspection, or reporting only.
- Keep changes inside the requested scope. Do not refactor adjacent code unless it is required for the task.
- Prefer existing shared components, constants, utilities, services, and repositories before adding new code.
- Treat the local repository, committed docs, and current Git state as the source of truth. Do not rely on previous chat memory when recovering project state.

## Autonomy And Questions
- When the user gives a clear goal and scope, proceed within the safest reversible path instead of stopping to ask broad 1/2/3 option questions.
- Codex should decide routine implementation details such as helper names, file organization, wording, test order, and minor refactors by following the existing project pattern, minimum change, shared components/utilities, low risk, and maintainability.
- If several safe implementations are equivalent for product behavior, choose the recommended one and explain the reason in the result report.
- Stop for user confirmation only when the action needs explicit approval, can affect production data or secrets, changes Git history/index/remotes, changes dependencies/package metadata, moves/deletes/renames files, changes schema or product policy, or is hard to reverse.
- If the user explicitly asks for analysis, inspection, review, or reporting only, stop after that and do not modify files.
- Unless the user asked for analysis only, continue from analysis to scoped edits and safe verification when the request clearly implies a fix.
- Before `git add`, `git rm`, `git commit`, or `git push`, stop and report the result unless the user has already explicitly approved the exact action and target.

## Safe Work Without Extra Confirmation
- Reading repository files, tracing references, checking docs/audits, and inspecting existing tests or scripts is allowed.
- Read-only Git commands such as `git status`, `git status --short`, `git status --branch --short`, `git diff`, `git diff --check`, `git diff --cached`, `git diff --cached --check`, `git log`, `git show`, `git branch --show-current`, and `git rev-list --left-right --count` are allowed.
- Scoped code, UI, logic, import, comment, and documentation edits inside the requested files or feature area are allowed when they are safe and reversible.
- Adding a new file is allowed only when it is clearly required by the requested change and does not replace or delete an existing file.
- Safe verification such as build, lint, typecheck, existing contract tests, mutation audits, PowerShell parse checks, dry-run commands, plan-mode commands, and simulator checks without DB/R2 mutation is allowed.
- If a safe validation fails and the cause is inside the requested scope, fix it and rerun the same validation when reasonable.

## Actions Requiring Explicit Approval
- Production DB, production R2, production APIs/bindings, secrets, tokens, account IDs, and production URLs require explicit approval before access or use.
- Reset, Seed execute mode, Cleanup execute mode, Migration execution or creation, destructive SQL, broad UPDATE/MERGE, and any DB/R2 mutation require explicit approval.
- `git add`, `git rm`, `git commit`, `git push`, force push, amend, reset, clean, checkout, restore, branch deletion, rebase, merge, and cherry-pick require explicit approval.
- File deletion, file moves, broad renames, dependency installs, dependency removals, dependency version changes, package manager changes, lockfile creation, and lockfile changes require explicit approval.
- DB schema changes, authentication/authorization policy changes, tenant-isolation changes, and user-data-shape changes require explicit approval unless the user directly requested that exact change.
- Do not use `git add .`, `git add -A`, or `git commit -am`. Stage only approved files by explicit path.

## Version Policy
- The app display version is `APP_VERSION` in `lib/constants/version.ts`.
- `package.json` `version` is npm package metadata and is not the app display version.
- For patch work, keep `APP_VERSION`, `commit-meta.md` `Version`, and the reported result version aligned.
- Do not change `package.json` or lock files unless the user explicitly approves dependency/package metadata changes.
- Do not bump `APP_VERSION` for Codex operating-rule documentation updates alone unless the user explicitly asks for a versioned patch.
- `commit-meta.md` is ignored local metadata; do not stage it.

## Data And Environment Safety
- Never print `.env.local`, DB URLs, credentials, tokens, or secrets.
- Never modify production DB or production R2.
- The dev/test simulator fixture prefix is `wafl-fn`.
- Simulator companies use deterministic IDs and display names; keep both stable:

| Code | Company ID | Display name |
|---|---|---|
| A | `wafl-fn-company-a` | 기본 운영사 |
| B | `wafl-fn-company-b` | 협업 운영사 |
| C | `wafl-fn-company-c` | 승인 대기사 |
| D | `wafl-fn-company-d` | 파일 반려사 |
| E | `wafl-fn-company-e` | 이용 중지사 |
| F | `wafl-fn-company-f` | 탈퇴 요청사 |
| G | `wafl-fn-company-g` | 인원 한도사 |
| H | `wafl-fn-company-h` | 대량 운영사 |
| I | `wafl-fn-company-i` | 과거 데이터사 |
| J | `wafl-fn-company-j` | 경계값 전용사 |
- DB/R2 destructive commands require explicit user approval.
- PowerShell menu 9 `Reset Database Schema` must keep production/runtime/fingerprint/prefix/confirmation guards before any SQL runner call.
- Normal test artifacts and logs may be generated by approved test commands, but keep them distinct from source changes.

## Runtime And Access Guards
- `/ui` and `/functions` must remain blocked outside allowed non-production runtime modes.
- `/dev/test-console` must remain production-blocked and explicitly enabled.
- Impersonation must use an allowlist, support returning to the original session, and keep audit logs.
- Maintain tenant isolation in UI, API, repository, DB, and simulator flows.
- Validate permissions in both UI affordances and API/server handlers.

## Git And Delivery
- Do not commit without user approval.
- Do not push without explicit user approval.
- Do not run `git reset`, `git checkout`, `git clean`, or equivalent destructive commands unless explicitly requested.
- Before staging, report the exact files and command. After staging, report the full staged file list.
- Before committing, run `git diff --cached --check`, then report the staged file list and diff summary.
- Before pushing, verify branch, remote, ahead/behind count, and working tree state.
- Force push is always forbidden unless the user explicitly changes this rule for a one-off recovery operation.
- Do not hide failed or skipped tests. Report what ran, what did not run, and why.
- Final reports should include: original version, result version, files changed, tests run, failures/skips, DB migration status, git status, and whether commit/push were performed.
- The canonical PowerShell entry point is `tools/pipeline/peacebypiece-auto-pipeline.ps1` and should be tracked in Git. Old version, patch, backup, temporary, and copied PowerShell variants remain ignored.
- When Git is directly connected, full ZIP uploads, repo-state files, and separate PowerShell uploads are unnecessary operating overhead unless the user asks for them. A separate PowerShell upload is only useful when a newer external script copy exists or the task is explicitly script-only.

## Communication And Reporting
- Answer in Korean by default for project work unless the user asks otherwise.
- Explain results in user-facing terms; do not return raw logs without summarizing what they mean.
- Ask questions only when the answer is truly needed. When asking, state the recommended option first and briefly explain why user judgment is required.
- Do not repeatedly ask the user to choose already-settled policies or purely technical implementation details.
- For normal completion reports, include original version, result version, development progress, Git status, what was checked, what changed, changed files, tests run, failures/skips, direct user-confirmation items, next work, DB migration status, PowerShell change status, whether ZIP/repo-state/PowerShell upload is needed, and what approval is needed next.
- For short intermediate updates, keep the report concise and focused on what changed or what was learned.
- When a version is marked as a checkpoint, report completion and wait. Do not automatically start the next version or follow-up task.

## Tool And Approval Settings
- Codex approval settings cannot be changed from this file, but the recommended operating posture is: auto-allow repository file reads, safe scoped edits, read-only Git commands, and safe validation; ask for network writes, Git index/history/remote changes, dependency changes, DB/R2 mutation, production access, and destructive commands.
