# Alpha.49 Canonical Codex Instruction Architecture Evidence

## Scope and baseline

- Baseline version: `2.0.0-alpha.48`.
- Baseline HEAD/origin: `800b5e6052b67134706d0a94a7743ca8ed608aff`.
- Baseline Git: `master`, ahead/behind `0/0`, clean.
- Result version: `2.0.0-alpha.49`.
- Target status: `ALPHA49_CANONICAL_CODEX_INSTRUCTION_ARCHITECTURE_COMPLETE`.
- Scope is canonical documentation and documentation-validation infrastructure only.

Mobile UI, API behavior, DB/schema, Runtime behavior, runner implementation, auth, R2/PDF/token, production, native configuration, and EAS are unchanged.

## Four document types

Alpha.49 establishes:

1. Permanent Rules;
2. Current Baseline;
3. Version Delta;
4. Immutable Evidence.

The structure reuses existing canonical owners instead of creating a parallel document stack.

## Canonical owners

| Responsibility | Owner |
| --- | --- |
| Repository routing | `AGENTS.md` |
| Canonical index and task routing | `00-start-here.md` |
| Permanent Rules | `09-codex-working-rules.md` |
| Current Baseline | `docs/codex-current-state.md` |
| Current/next roadmap and Version Delta | `08-roadmap-2.0.md` |
| Device QA matrix | `05-device-test-plan.md` |
| Expo/native environment | `06-expo-environment-setup.md` |
| External Runtime operations | `41-external-mobile-qa-runbook.md` |
| Normative WorkOrder API semantics | `16-workorder-api-command-read-model-contracts.md` |
| Verification semantics | `17-v2-api-contract-test-plan.md` |
| Historical implementation result | numbered `*-evidence.md` |

The full responsibility matrix, mutability, frequency, evidence classification, and task routing are in `00-start-here.md`.

## Permanent Rules result

`09-codex-working-rules.md` now owns actual-KST reporting, Git baseline and destructive-command prohibitions, authority precedence, secret/tenant/production boundaries, bounded dev/test effects, transport and process ownership, PID reuse, CIM/WMI fallback, semantic Funnel status, failure preservation, user/device QA, native/EAS approvals, verification, Git delivery, Source ZIP/repo-state, `4. Newest`, and completion declaration.

Other mutable canonical documents retain only their specialist context and a link to this owner.

## Current Baseline result

`docs/codex-current-state.md` is reduced from a multi-lineage history to one current snapshot. It contains current version/identity, entry Git baseline, current app/native metadata, delivery boundary, current transport/default-runner state, latest validation baseline, owner links, latest evidence, and next candidate.

Live PIDs, temporary origins, connection codes, sessions/cookies, process metadata, credentials, complete private identifiers, and full UUIDs are explicitly excluded. Self-referential final commit/artifact identities are delegated to the matching post-commit repo-state.

## Version Delta result

`08-roadmap-2.0.md` owns the current result, next candidate, and compact Delta schema. Future Deltas include execution settings, baseline/result/status, objective, inclusions, non-goals, exact effect budget, UI/API/DB/security boundaries, Runtime/QA, contracts, completion gates, commit candidate, next boundary, and this standard reference:

> 실행·보안·Git·Runtime·artifact·실패 정책은 `docs/project/app-v2/09-codex-working-rules.md`를 전부 따른다.

Permanent Rules are no longer repeated in each work order. Omitted exceptional authority remains forbidden.

## Standing authorization

An owner-approved exact Version Delta is standing authorization for scoped repository edits, tests/build/Verify, canonical runner operations, read-only approved dev/test audits, exact bounded dev/test mutation or migration explicitly named by the Delta, version evidence, ordinary Git delivery, and matching artifacts.

This does not authorize an unnamed target/effect or production. Production deploy/mutation, accounts/credentials/certificates, EAS Build/Update, native dependencies/plugins/manifests/identity, dependency changes outside the Delta, force/history rewrite, broad process kill, wildcard cleanup/delete, and non-exact operations remain separately approved.

## Core read order and task routing

The mandatory core set is reduced to routing, current state, final policy, integrated plan, index, Permanent Rules, and roadmap Delta. `00-start-here.md` then conservatively routes mobile UI, API Read, Command, migration/schema, external Runtime, PDF/R2/Viewer, auth, native/EAS, and documentation/infrastructure tasks to their specialist owners and relevant evidence.

The core is not removed. Task routing adds required cross-domain documents and avoids indiscriminate full-evidence reading.

## Immutable evidence protection

All evidence files that existed at the alpha.48 baseline remain unmodified. They are not merged, deleted, renumbered, or rewritten. Historical PASS/FAIL, timestamps, hashes, QA, mutation counts, and status remain authoritative for their declared scope.

The policy permits only minimal broken-link repair or an explicit correction note for an objectively proven typo. Neither exception was needed for the pre-alpha.49 evidence set.

## Duplicate reduction

- `AGENTS.md` now routes rather than reproducing all evidence summaries and App-first execution rules.
- `current-state` no longer archives every prior version.
- `08-roadmap-2.0.md` uses current/next boundaries and evidence links instead of a complete duplicated history.
- `05`, `06`, and `41` own device judgment, environment setup, and Runtime operations respectively; shared safety/delivery rules point to `09`.
- `16` explicitly owns API meaning and `17` owns its verification.

No numbered historical evidence was used as a mutable current-state store.

## Verification and effects

The alpha.49 document architecture contract checks owner declarations, matrix/routing, Delta fields/reference, standing-authorization limits, immutable evidence policy, specialist separation, prohibited volatile current-state values, owner links, and current version. Historical current-version assertions are compatibility-only and do not rewrite their feature contracts.

Final targeted checks, canonical Verify fingerprint, contract count, mutation-audit result, commit, push, ZIP, and repo-state identities are recorded by the final Verify output and matching alpha.49 repo-state.

Effect boundary:

- business/DB/schema/migration/fixture: `0`;
- R2 PUT/GET/DELETE: `0/0/0`;
- PDF/token/production: `0`;
- mobile/API/Runtime behavior: unchanged;
- native dependency/plugin/config: `0`;
- EAS Build/Update: `0/0`;
- physical-device QA: not required for this documentation/infrastructure version.

## Follow-up

The broader canonical-document analysis remains a reference, but alpha.49 does not delete or renumber documents. Future refinements should use the owner matrix and contracts rather than another broad rewrite.

The next feature candidate is alpha.50 draft material basic editing with explicit save, version/conflict, and dirty-state protection. Material order Commands remain separately scoped.
