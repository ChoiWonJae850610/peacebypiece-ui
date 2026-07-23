# WAFL v2 App-first Permanent Rules

Document type: **Permanent Rules**

Canonical owner: `docs/project/app-v2/09-codex-working-rules.md`

This document owns durable execution, security, Git, Runtime, failure, QA, and delivery rules for App-first `2.0.x`. Version-specific goals and effect budgets belong to the active Version Delta in `08-roadmap-2.0.md`; historical outcomes belong to numbered immutable evidence.

## 1. Standard reference

Every future Version Delta uses this line instead of copying this document:

> 실행·보안·Git·Runtime·artifact·실패 정책은 `docs/project/app-v2/09-codex-working-rules.md`를 전부 따른다.

The Delta may strengthen or narrow a rule. It cannot silently weaken a Permanent Rule, confirmed policy, tenant boundary, or production guard.

## 2. Actual KST reporting

- Intermediate, approval, and failure handoff messages begin with `작업 확인 시각: YYYY-MM-DD HH:mm KST`.
- Final delivery begins with `작업 종료 시각: YYYY-MM-DD HH:mm KST`.
- Query actual Asia/Seoul time at the reporting point.
- Do not reuse an earlier timestamp, infer KST from UTC, or use commit/file time as whole-task completion time.
- Final time is recorded only after all required validation, runtime teardown, Git, push, artifacts, and clean-state checks complete.

## 3. Start-of-work baseline

Before edits, verify:

- repository path and branch;
- HEAD and origin/master;
- ahead/behind;
- staged, unstaged, and untracked paths;
- APP_VERSION and scoped package/public/native versions;
- baseline handoff pair when the Delta names one;
- required current runtime/process state when Runtime is in scope.

Unexpected dirty state, wrong branch/HEAD/origin, artifact mismatch, or unknown ownership is a stop condition. Do not reset, checkout, restore, clean, stash, pull, or rebase to force the expected baseline.

## 3A. Mandatory PC Resource and Remote-Operation Audit

Until the owner explicitly changes this rule, every WAFL Codex Version Delta and task includes a read-only PC resource and remote-operation audit. The audit must not interfere with the active Runtime or remote connection.

Required checkpoints for Runtime work are:

1. start-of-work preflight;
2. immediately before Runtime start;
3. after automated Runtime QA;
4. immediately before requesting physical-device QA;
5. after runner stop and before final verification.

Documentation-only or static-only work requires the audit at start and immediately before final verification. If device QA is delayed materially or resumes on another calendar day, measure again immediately before resuming QA.

Each checkpoint records actual KST and, when available through approved read-only tooling:

- three short-interval total CPU samples, their average/range, and sustained top CPU consumers;
- total, used, and available physical memory;
- system-drive and repository-drive free space;
- disk active time, queue, throughput, or another bounded abnormal-I/O indicator;
- every runner-owned role's PID, ownership result, CPU use, and memory use, including Next, Metro, Tailscale Serve, and runner-owned cloudflared when present;
- Tailscale and Chrome Remote Desktop service state;
- structural Funnel status with `AllowFunnel: true` count;
- unexpected duplicate or unowned Next, Metro, Node, Serve, or cloudflared processes;
- remote-access stability risk;
- reliable CPU, GPU, or system temperature and thermal-throttling state only when available from Windows or an already-installed approved read-only tool.

Do not infer temperature. When no reliable approved sensor path is available, record exactly `Temperature: unavailable with approved read-only tooling`. Do not install a driver, monitoring service, native/BIOS utility, or external program to obtain it.

Do not judge one transient CPU spike in isolation. Use at least three short samples where practical and distinguish a build/test spike from sustained idle or QA-wait load. The audit itself must not run a stress test or benchmark, change fan or power settings, alter process priority, restart a service, kill a process, clear caches/memory, optimize a disk, edit the registry, manipulate Windows Update, or install software.

Investigate conservatively when repeated samples show unexplained excessive idle CPU, abnormally low available memory or disk capacity, sustained abnormal I/O, duplicate or ownership-mismatched WAFL processes, unexpected Node/Next/Metro/cloudflared activity, stopped remote services, enabled Funnel, confirmed thermal throttling, remote-access instability, or an unexplained material change from the prior checkpoint. Fixed thresholds alone do not decide failure; consider the active phase, recent build/test load, process ownership, and repeated samples.

For a clear resource anomaly or remote-operation risk:

1. do not request device QA or restart Runtime;
2. keep Tailscale and Chrome Remote Desktop running;
3. preserve source, Runtime, marker, logs, and data;
4. perform read-only cause analysis;
5. declare `PC_RESOURCE_OR_REMOTE_OPERATION_RISK_HANDOFF_REQUIRED` and provide a Failure Handoff;
6. do not clean, kill, reboot, shut down, log off, or otherwise remediate without owner approval.

Version evidence records checkpoint, actual KST, CPU samples and average/range, top CPU consumers, memory totals, drive capacity, disk-I/O assessment, runner role resources and ownership, remote-service/Funnel state, temperature availability, abnormal-finding count, remote-operation risk, and `PASS` or `HANDOFF REQUIRED`. Intermediate and final reports summarize the actual measurements. The final report includes start, pre-Runtime, post-automated-QA, pre-device-QA, and post-stop audits when applicable, peak or notable CPU/memory, final disk capacity, unexpected-process count, remote-operation risk, remote-service preservation, and unrelated-process impact.

## 4. Canonical authority

Use the precedence in `AGENTS.md`. Read the core set in `00-start-here.md`, then its conservative task routing. Existing `CONFIRMED` policy is not re-asked. If implementation and current policy conflict, report the mismatch; do not rewrite historical evidence to resolve it.

Canonical document responsibilities:

- `AGENTS.md`: repository routing and universal safeguards.
- `00-start-here.md`: index, owner matrix, and task routing.
- this document: Permanent Rules.
- `docs/codex-current-state.md`: Current Baseline only.
- `08-roadmap-2.0.md`: current/next roadmap and Version Delta.
- specialist owner: normative domain or operational details.
- numbered evidence: immutable historical result.

## 5. Scope discipline

- Implement only the active owner-approved Version Delta.
- Prefer the smallest reversible change and existing shared primitives/services/contracts.
- Do not refactor adjacent code, add a dependency, change schema, or broaden routes merely because it would be convenient.
- Analysis-only requests authorize no edits.
- A feature version does not inherit mutation, deployment, native, or external-account authority from a previous version.

## 6. Security and sensitive information

Never expose in source, tracked docs, logs, screenshots, artifacts, repo-state, or chat:

- credentials, tokens, cookies, connection codes, auth material, DB URLs, or private keys;
- full user email/login, full identity hash, internal user/company/member IDs, or complete WorkOrder UUIDs;
- full DB fingerprint, temporary external hostname, signed URL, object key, or raw form payload;
- Apple team/certificate/device identifiers or other account material.

Use sanitized counts, booleans, aliases, host type, and short approved hash prefix only. Raw customer content never enters general operational logs.

## 7. Tenant, company, permission, and production boundaries

- Tenant/company scope is server-derived from authenticated membership or an exact audited dev/test effective context, never trusted from a client body.
- Enforce permission in server handlers and repositories; UI affordances are not authorization.
- Cross-tenant opaque identities use the canonical non-enumerating response.
- RLS/customer paths use the approved tenant role and claims; privileged paths remain separate and audited.
- Production access, deploy, DB/R2/API mutation, account binding, and production secrets require a separate exact approval.
- A dev/test identity or Tailscale identity never implies production or mutation authority.

Internal access compatibility:

- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`.
- `/id-control` test account switching is allowed while its exact session, impersonation restore, and audit contracts pass.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- The canonical verification profile for this boundary remains `system-admin-internal-access`.

## 8. Standing authorization for an exact Version Delta

Once the owner approves a Version Delta with exact repository, dev/test target, scope, effects, and completion gates, Codex may proceed without repeated intermediate approval for:

- repository reads and scoped source/document edits;
- tests, TypeScript, ESLint, build, Expo checks, and canonical Verify;
- canonical runner start/status/stop inside the named mode;
- read-only DB/API audits against the approved dev/test target;
- an exact bounded dev/test mutation explicitly named in the Delta, including its declared rows/events/receipts budget;
- an exact dev/test migration explicitly named in the Delta with its fingerprint, ledger, guard, and effect budget;
- evidence, version metadata explicitly approved by the Delta, exact-path stage, one ordinary commit, normal push, Source ZIP, matching repo-state, and exact `4. Newest` replacement.

This is not blanket mutation authority. If the Delta does not state the target and effect exactly, the action is not authorized. Stop before any target/fingerprint change, unexpected write, partial mutation continuation, schema drift, tenant leak, RLS bypass, integrity mismatch, or effect outside budget.

Separate owner approval is always required for:

- production deploy, access, or mutation;
- credentials, certificates, accounts, teams, devices, or signing changes;
- EAS Build or EAS Update;
- native dependency/plugin, Info.plist, AndroidManifest, bundle/package/signing identity changes;
- dependency/package-manager/root lockfile changes not explicitly named;
- force push, amend, history rewrite, reset, checkout, restore, rebase, merge, or branch deletion;
- broad process kill, wildcard cleanup/delete, reset, purge, or any operation whose exact target cannot be stated.

## 9. Data and mutation safety

- Default runtime is read-only unless the active Delta explicitly names a bounded dev/test mutation.
- Never modify production DB or production R2.
- Migration, seed, fixture, cleanup, reset, rollback, destructive SQL, R2 PUT/DELETE, PDF/token lifecycle, and business writes stay at zero unless exact Delta authority exists.
- Do not auto-retry a mutation or compensate with automatic rollback/cleanup/delete.
- Unknown or partial effects are preserved and audited before any continuation.
- Read-only audits must not touch timestamps, versions, sequences, events, receipts, documents, or object state.

## 10. Runtime transport

Current external-development roles are stable unless a separately approved Delta changes them:

- Metro: private Tailscale LAN HTTP under Development-only ATS.
- Developer authentication and business API: tailnet-only Tailscale Serve HTTPS.
- Preview/Viewer: process-owned Cloudflare Quick Tunnel HTTPS.
- Next DeveloperAutoConnect backend: `127.0.0.1`, never `0.0.0.0` or a public/LAN bind.
- Tailscale Funnel: forbidden.
- Cloudflare and Tailscale host/path allowlists are exact; request `Host` is authority and `x-forwarded-host` is not.
- Default runner: read-only. A previous mutation switch is not persistent authority.

Environment and setup details belong to `06-expo-environment-setup.md`; commands and operational sequence belong to `41-external-mobile-qa-runbook.md`.

## 11. Process ownership and stop safety

Canonical start/stop manages only runner-owned processes/configuration.

Ownership requires the marker role and run identity plus exact PID, normalized StartTime/CreationDate, executable, CommandLine, and expected backend. PID or process name alone is never ownership.

- If exact CIM metadata is available, use the strict path.
- If the exact marker-owned Serve PID's initial CIM process object is unavailable, one bounded exact-PID Windows/WMI metadata fallback is allowed only when the active runner contract permits it.
- The fallback must reproduce PID, owner/run identity, time, canonical executable, exact Serve command, localhost backend, and Funnel-disabled state. Missing or mismatched metadata blocks termination.
- When marker/current StartTime differs, treat the current process as protected PID reuse. Send no termination signal and classify the original runner process as already stopped.
- A same-StartTime executable/command mismatch is an ownership failure, not PID reuse.
- Never use broad Node/cloudflared/Tailscale termination, wildcard taskkill, `tailscale down`, unconditional Serve reset, Funnel reset, service stop, or reboot.

## 12. Funnel semantic status

Parse Tailscale status/config structurally.

- Funnel is enabled only when an active item explicitly has `AllowFunnel: true`.
- Empty JSON or Serve objects whose values are false, null, or missing are Funnel-disabled.
- A non-empty Serve object does not itself mean Funnel.
- Parse failure or an unknown schema is not disabled PASS.
- Normal teardown does not change Funnel configuration.

## 13. Retry, correction, and failure preservation

- No automatic retry loop, rollback, cleanup, delete, broad port cleanup, or state erasure.
- A read-only correction loop is allowed only when the active Delta permits it, target/fingerprint is unchanged, effects remain zero, and the bounded cycle limit is not exceeded.
- Stop immediately on repeated identical failure, unknown ownership, target change, mutation mismatch, tenant/security failure, or out-of-scope change.
- Preserve source diff, validation output, runtime marker/logs, process/config state, and observed effects.
- Failure artifacts never replace `4. Newest` and never count as completion.

A Failure Handoff records actual KST, state, failed stage, expected/actual result, last success, sanitized errors, Git state, effects, process/port ownership when relevant, and the smallest next authorization. It confirms that forbidden automatic actions were not run.

## 14. User and device QA

- Static, Runtime, and product/visual acceptance are distinct.
- User-visible work is complete only at the required level in `docs/project/32-product-completion-and-ui-evidence-standard.md` and `05-device-test-plan.md`.
- Do not infer physical-device PASS from source, simulator, manifest, or bundle reachability.
- Record unrun iPad/Galaxy/tablet checks as `NOT_RUN`, never PASS.
- User-reported PASS covers only the procedure actually requested and performed.
- Visual judgment versions stop before commit until the owner provides the required acceptance.
- Documentation/infrastructure-only versions require no device QA unless their Delta says otherwise.

## 15. Native and EAS

- Reuse an installed Development Build while native dependencies/configuration and runtime compatibility remain unchanged.
- Expo public version, build number, bundle/package identifiers, project/owner, ATS, plugins, and EAS profiles change only under an exact approved native/EAS Delta.
- Do not run EAS Build/Update, alter credentials, register devices, or modify native manifests automatically.
- A native requirement discovered in a non-native version is a stop condition with a minimum-scope handoff.

## 16. Verification

Follow the verification owner `17-v2-api-contract-test-plan.md` and the active Delta.

Minimum delivery gates include, as applicable:

- parser/PowerShell parser;
- targeted contract and regressions;
- TypeScript and targeted ESLint;
- Next build and Expo config/install/Doctor;
- Unicode, secret, temporary-origin, and tracked-env scans;
- migration guard and mutation audit;
- `git diff --check` and cached diff check before commit;
- canonical `approved-workflow.ps1 -Action Verify` on the final changed fingerprint.

Do not skip tests, delete assertions, weaken conditions, hide type errors with broad casts, or increase timeout without evidence. Reuse a matching PASS only when profile, HEAD, changed paths, and fingerprint all match.

## 17. Git

- Start and finish on the branch named by the Delta, normally `master`.
- Do not stage or commit before required Runtime/user gates and final Verify.
- Stage only approved explicit paths.
- One version uses one clear commit unless an unavoidable self-referential artifact boundary is handled by the canonical pipeline.
- Push only normally to the named origin branch. No force, amend, rebase, reset, clean, or history rewrite.
- Push failure preserves state and stops before Finish/artifacts.
- Completion requires local HEAD = origin branch, ahead/behind `0/0`, and staged/unstaged/untracked zero.

## 18. Source ZIP, repo-state, and `4. Newest`

- Use canonical Finish/handoff tooling.
- Source ZIP excludes Git, dependencies, builds, test/runtime artifacts, reports, coverage, env files, storage state, HAR/video, generated ZIP/repo-state/build-result, backups, process/config/identity audits, and OS temporary files.
- Verify filename, SHA-256, bytes, entry count, exclusion violations, final HEAD, versions, identities, and Git cleanliness.
- The matching repo-state records repository/Git/version/artifact/Verify/test/mutation facts without secrets.
- Do not falsify a Manual QA field unsupported by the generator; explain the limitation in evidence/final report.
- `4. Newest` contains exactly the current matching Source ZIP and repo-state pair. Exact bounded replacement only; no wildcard deletion.
- If source changes after ZIP generation, regenerate a matching pair.

## 19. Completion declaration

Declare the target status only when every active Delta condition passes: implementation, required Runtime/user QA, effect audit, canonical stop, documents/version, final Verify, commit, push, matching artifacts, and clean Git.

Anything not executed is reported as `NOT_RUN`. A partial or failed gate cannot be converted to completion by documentation wording.

## 20. Version Delta contract

A future Delta should be approximately 10–20% of the old cumulative FULL instruction and include:

1. model, reasoning, and speed;
2. baseline version and HEAD;
3. result version;
4. target status;
5. objective;
6. included scope;
7. non-goals;
8. allowed mutation/effect budget;
9. UI/API/DB/security boundaries;
10. required Runtime and QA;
11. required contracts and verification;
12. completion conditions;
13. candidate commit message;
14. next-version boundary;
15. the standard Permanent Rules reference.

The Delta must name exact exceptional authority. Omitted mutation, production, native/EAS, dependency, destructive, or external-account authority remains forbidden.
