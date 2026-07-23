# WAFL Canonical Codex Working Rules Normalization Evidence

## Scope and baseline

- Work began at `2026-07-24 00:18:53 KST`.
- Repository: `C:\CWJ_Project\peacebypiece-2.0`, branch `master`.
- Baseline HEAD/origin: `335339e8168d98a3d6d471b49b59c3ca30c89a4e`.
- Baseline Git: HEAD equals origin, ahead/behind `0/0`, staged/unstaged/untracked `0/0/0`.
- APP_VERSION and mobile package version remain `2.0.0-alpha.54`.
- Baseline product artifact remains `peacebypiece-ui-2.0.0-alpha.54.zip`, SHA-256 `aa5eddef89ab636e48df120d89048c3efe227d97d55ac8911b5ce8bb87fe6e91`.
- Baseline repo-state remains `repo-state-2.0.0-alpha.54-20260723-234307.txt`.
- This is documentation-only maintenance. Product source, Runtime, API, DB/schema/migration, R2/PDF/token, dependency, native, and EAS behavior are outside scope.

## Audited authorities

The audit read:

- `AGENTS.md`;
- `docs/codex-current-state.md`;
- `docs/project/26-final-policy-decisions-and-master-todo.md`;
- `docs/project/31-pre-codex-integrated-master-plan.md`;
- `00-start-here.md`, the previous `09-codex-working-rules.md`, and `08-roadmap-2.0.md`;
- Unicode and API verification owners;
- alpha.49 canonical-instruction evidence and alpha.54 product evidence;
- document-link, current-version, historical canonical-instruction, internal-access, and Verify registration contracts.

The prior Permanent Rules were a 292-line monolith. Durable authority, security, scope, Runtime, ownership, Funnel, mutation, PC audit, testing, Git, artifacts, failure, QA, and Version Delta rules were valid but mixed in one owner. Repeated Deltas also copied those generic rules and accumulated one-off remediation detail.

## Normalized canonical structure

| Document | Single responsibility |
| --- | --- |
| `09-codex-working-rules.md` | entry point, precedence, mandatory read order, task classification, security summary, and responsibility routing |
| `09a-codex-execution-lifecycle.md` | preflight through implementation, static/Runtime/device gates, teardown, evidence, and completion |
| `09b-codex-runtime-data-pc-safety.md` | canonical runner, ownership, transport, mutation accounting, remote safety, and PC audits |
| `09c-codex-testing-contracts-handoff.md` | behavior contracts, historical/current maintenance, Node/RN boundary, bounded failure, and Failure Handoff |
| `09d-codex-version-delta-finalization.md` | standing Delta authority, exact-path Git delivery, product artifacts, and documentation-only maintenance |
| `09e-codex-version-delta-template.md` | concise self-executing file-only handoff for alpha.55 and later |

The core routing in `AGENTS.md` and `00-start-here.md` now requires the entry point plus `09a` through `09d`. The roadmap and Current Baseline route future work to the concise template and establish that the next product Delta uses the latest synchronized maintenance HEAD.

## Preserved and generalized rules

- Unexpected dirty state, origin mismatch, unknown ownership, unknown mutation, or remote risk remains a stop condition; reset/checkout/clean/stash, automatic retry/rollback/cleanup, broad kill, and failure-state delivery remain forbidden.
- Runtime uses only the canonical runner and exact process ownership. Funnel remains structurally disabled unless an active item has `AllowFunnel: true`.
- Every mutation has an advance baseline and effect budget; one Check issues at most one command; automatic, duplicate, and unknown mutation remain zero.
- PC/resource audits keep the five Runtime checkpoints and the start/pre-final two-checkpoint static exception with actual KST and measurements.
- Behavior/public contracts take precedence over file location and private implementation detail. Historical meaning is preserved when a current owner moves.
- Current alpha literals use the canonical version helper instead of repetition across historical tests.
- Node-only contracts do not import React Native/Metro aliases; shared pure normalizers use an alias-free boundary.
- UI patch/controller live-draft ownership, optional-string normalization, edit-session teardown, and valid-response classification are retained as durable regression principles without freezing alpha.54 implementation locations.
- Automated checks are not delegated back to the owner. Physical-device QA remains focused on native layout, keyboard, scrolling, haptics, and visual judgment.
- Final Verify precedes commit; product delivery is commit, push, origin equality, then matching artifact. Same-version artifact overwrite is forbidden.

One-off line numbers, CPU snapshots, resolved stack traces, fixture strings, temporary PIDs, and version-specific DB values were not promoted as generic rules.

## Self-executing and documentation-maintenance policy

An owner-attached or owner-pasted `SELF-EXECUTING HANDOFF` is approval to start its stated scope at preflight. The concise template carries only version-specific baseline, target, scope, exclusions, effect budget, validation, physical-device QA, completion, remediation, and new-failure fields. Generic mechanics remain linked to the Permanent Rules.

Documentation-only maintenance keeps APP_VERSION and product source unchanged, does not run Runtime or mutate DB, preserves the existing release ZIP/repo-state, prohibits same-version artifact regeneration, performs targeted documentation/contracts plus Canonical Verify, commits and pushes the documentation result, and makes that maintenance commit the next product Delta baseline.

## Start PC resource and remote-operation audit

- Checkpoint: start-of-work preflight.
- Actual KST: `2026-07-24 00:18:53 KST`.
- CPU samples: `11.68% / 14.17% / 5.55%`; average `10.47%`, range `5.55-14.17%`.
- Sustained/cumulative top consumers observed: Windows service hosts, System, services, and the installed ASUS service; no unexplained sustained WAFL load.
- Physical memory: `31.12 GB` total / `10.90 GB` used / `20.22 GB` available.
- System and repository drive: `C:` with `1,198.22 GB` free.
- Disk active samples: `0.733% / 0.582% / 1.051%`; queue `0 / 0 / 1`, with one transient sample and no sustained abnormal I/O.
- Runner-owned process: `0`; ports `3000/3100/8081`: `0/0/0`.
- Tailscale and Chrome Remote Desktop: Running. Funnel `AllowFunnel: true`: `0`.
- `Temperature: unavailable with approved read-only tooling`.
- Abnormal finding: `0`; remote-operation risk: `0`; result: `PASS`.

## Data, Runtime, product, and artifact effects

- Read-only baseline: WorkOrder/revision/material `42/42/20`, event/receipt `75/26`, migration ledger `13/13`.
- Business, automatic, duplicate, and unknown mutation: `0`.
- Runtime: `NOT_RUN` because this maintenance changes only canonical documents and validation infrastructure.
- APP_VERSION delta: `0`.
- Product source delta: `0`.
- Product release ZIP/repo-state delta: `0`; the alpha.54 pair remains the immutable product snapshot of its original release HEAD.

## Final pre-Verify PC resource and remote-operation audit

- Checkpoint: immediately before final Canonical Verify.
- Actual KST: `2026-07-24 00:28:44 KST`.
- CPU samples: `8.65% / 12.59% / 15.57%`; average `12.27%`, range `8.65-15.57%`.
- Cumulative top consumers: `svchost` PID `3408` (`50,951.08` CPU seconds / `44.4 MB`), System PID `4` (`17,343.86` / `38.2 MB`), services PID `1180` (`7,786.97` / `14.7 MB`), and ASDSvc PID `5052` (`6,761.25` / `27.3 MB`). The three total-CPU samples showed no sustained abnormal load.
- Physical memory: `31.12 GB` total / `10.83 GB` used / `20.29 GB` available.
- System and repository drive: `C:` with `1,198.19 GB` free of `1,906.79 GB`.
- Disk active samples: `0.589% / 0.166% / 0.691%`; queue `0 / 0 / 0`; abnormal I/O `0`.
- Runner-owned process: `0`; ports `3000/3100/8081`: `0/0/0`.
- Tailscale and Chrome Remote Desktop: Running. Funnel `AllowFunnel: true`: `0`.
- `Temperature: unavailable with approved read-only tooling`.
- Abnormal finding: `0`; remote-operation risk: `0`; result: `PASS`.

## Verification and delivery ownership

The normalization contract verifies the entry point, valid child links, mandatory read order, concise self-executing template, documentation-only maintenance, PC/runtime/mutation/testing/finalization ownership, dynamic current-version rule, historical/current distinction, source-location limitation, Node/RN alias boundary, and Failure Handoff route.

Targeted document links, Unicode, normalization contract, diff, Node, ESLint, root TypeScript, and Canonical Verify are required before delivery. The final pre-Verify PC audit is recorded in this evidence before Canonical Verify. The final Verify fingerprint/result and maintenance commit/push/HEAD are reported by canonical workflow output and the final report because tracked evidence cannot contain its own commit hash.

Candidate commit: `docs: WAFL Codex canonical 실행 규칙 정규화`.

No alpha.54 ZIP or repo-state is generated. Alpha.55 uses the synchronized maintenance commit HEAD as its baseline and the `09e` self-executing template.
