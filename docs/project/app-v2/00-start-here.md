# WAFL v2 App-first Canonical Start Here

Document role: canonical index, responsibility matrix, and task routing for the `2.0.x` App-first line.

This document tells Codex what to read. It does not own Permanent Rules, current Git/runtime facts, version scope, API semantics, or historical PASS/FAIL evidence.

## Four canonical document types

1. **Permanent Rules** — durable execution, safety, Git, Runtime, failure, QA, and delivery rules.
2. **Current Baseline** — one compact snapshot of the latest accepted repository/product state.
3. **Version Delta** — the current version's objective, inclusions, exclusions, effects, gates, and next boundary.
4. **Immutable Evidence** — numbered historical records of what actually happened.

Every fact or rule has one canonical owner. Other documents keep only the context needed for their specialist role and link to that owner.

## Responsibility matrix

| Area | Canonical owner | Main references | Change frequency | Evidence | Mutability | Task routing |
| --- | --- | --- | --- | --- | --- | --- |
| Repository routing | `AGENTS.md` | this index | rare | no | mutable | always |
| Permanent Rules | `09-codex-working-rules.md` | `AGENTS.md`, policy docs | rare | no | mutable | always |
| Current Baseline | `../../codex-current-state.md` | matching repo-state | each completed version | no | replace current snapshot | always |
| Current/next roadmap and Version Delta | `08-roadmap-2.0.md` | latest work order | each version | no | mutable | always |
| Product direction | `01-app-first-product-definition.md` | `02`, `03`, `04`, confirmed policy | policy change only | no | mutable | product/UI/auth |
| Device QA matrix | `05-device-test-plan.md` | UI evidence standard | device/support change | no | mutable | mobile/tablet/UI |
| Expo/native environment | `06-expo-environment-setup.md` | app config, EAS config | environment change | no | mutable | mobile/native/EAS |
| External Runtime operations | `41-external-mobile-qa-runbook.md` | runner source/contracts | operational change | no | mutable | external Runtime QA |
| WorkOrder API semantics | `16-workorder-api-command-read-model-contracts.md` | domain contracts | API contract change | no | mutable normative contract | API/read/command |
| Verification semantics | `17-v2-api-contract-test-plan.md` | tests and Verify profile | verification change | no | mutable | every implementation task |
| PDF/R2 lifecycle | applicable confirmed policy and routed evidence | PDF/R2 specialist docs | scoped change | mixed | owner-dependent | PDF/R2/document |
| Auth | `04-auth-google-apple.md` | `03`, security evidence | auth policy change | no | mutable | auth/session |
| Historical result | numbered `*-evidence.md` | matching repo-state/artifact | once at completion | yes | immutable | only relevant versions |

`docs/codex-current-state.md` resolves from this file as `../../codex-current-state.md`.

## Core read order

Read every item before modifying an App-first version:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. this document
6. `docs/project/app-v2/09-codex-working-rules.md`
7. `docs/project/app-v2/08-roadmap-2.0.md`

Then read the active owner-approved Version Delta and all task-routed specialist documents below. Core read order is never replaced by task routing.

## Conservative task-based additional routing

### Mobile UI or ProductionCard

Read:

- `01-app-first-product-definition.md`
- `02-mobile-tablet-ux-principles.md`
- `03-app-architecture.md`
- `05-device-test-plan.md`
- `06-expo-environment-setup.md`
- `docs/project/32-product-completion-and-ui-evidence-standard.md`
- relevant recent UI evidence and target components/contracts

### API Read

Read:

- `03-app-architecture.md`
- `15-v2-source-db-boundary-and-release-policy.md`
- `16-workorder-api-command-read-model-contracts.md`
- `17-v2-api-contract-test-plan.md`
- the latest relevant Read evidence and runtime guards

### Command or bounded dev/test mutation

Read the API Read set plus:

- relevant command evidence and command contracts
- current migration ledger/evidence when the command depends on applied schema
- tenant, permission, receipt, event, concurrency, and mutation-audit owners

An exact Version Delta must name the target, expected effects, and mutation budget. Production is never implied.

### Migration/schema

Read:

- `12-v1-db-api-performance-audit.md`
- `13-core-domain-schema-v2.md`
- `14-v2-schema-migration-and-performance-plan.md`
- `15-v2-source-db-boundary-and-release-policy.md`
- `18-v2-additive-migration-draft-and-schema-contract.md`
- `19-v2-dev-test-migration-and-performance-evidence.md`
- every later evidence on which the proposed migration depends

### External Runtime/mobile QA

Read:

- `03-app-architecture.md`
- `04-auth-google-apple.md`
- `05-device-test-plan.md`
- `06-expo-environment-setup.md`
- `40-external-mobile-qa-foundation-evidence.md`
- `41-external-mobile-qa-runbook.md`
- latest relevant Runtime/effect evidence

### PDF, R2, Viewer, or output/share

Read:

- normative PDF/R2 policy documents routed by the current Delta
- `16-workorder-api-command-read-model-contracts.md`
- relevant generated-document, Viewer security, Preview/output, and realistic PDF evidence
- Worker/storage source and contracts before any operation

### Auth/session

Read:

- `03-app-architecture.md`
- `04-auth-google-apple.md`
- current session/security implementation
- relevant mobile connection or Viewer security evidence

### Native, EAS, distribution, or deployment

Read:

- `05-device-test-plan.md`
- `06-expo-environment-setup.md`
- `42-ios-development-build-evidence.md`
- current app/EAS/native config and the separately approved Delta

### Canonical documentation/infrastructure

Read the full core set plus:

- `docs/project/25-korean-unicode-encoding-standard.md`
- `docs/project/32-product-completion-and-ui-evidence-standard.md`
- document/link/owner contracts
- only the evidence needed to verify links and immutability

## Immutable evidence policy

Numbered evidence records are historical and immutable after completion.

Forbidden:

- merging or deleting evidence;
- rewriting old PASS/FAIL, timestamps, hashes, QA outcomes, mutation counts, or status;
- replacing historical facts with the latest current state;
- renumbering evidence to fit a new index.

Allowed only when necessary:

- minimal broken-link repair;
- a clearly labeled correction note for an objectively proven typo;
- links from a current mutable owner to the evidence.

Prior evidence files remain byte-unchanged during ordinary canonical refactoring. New evidence uses the next actual available number.

## Authority and product identity

- Project: PeaceByPiece.
- Brand: WAFL (`Work Assignment FLow`).
- Planned company: Sanjin Works.
- Website: `https://www.wafl.co.kr`.
- iOS/Android identifier: `com.wafl.app`.
- Customer-facing product: Expo React Native mobile/tablet first.
- Next.js: public web, administration, operations, API, files, documents, and internal tooling.

`docs/project/v2/*` remains a preserved reference for the `0.30.x` Product/Sheet/Card and showroom line. It does not override current App-first platform direction.

## Future work-order rule

Future work orders should be short Version Deltas. Use this standard reference:

> 실행·보안·Git·Runtime·artifact·실패 정책은 `docs/project/app-v2/09-codex-working-rules.md`를 전부 따른다.

The Delta does not repeat Permanent Rules. Its required fields are owned by `08-roadmap-2.0.md` and `09-codex-working-rules.md`.
