# Pre-Codex Authority and Document Consistency Gate

Version: 0.24.21.17  
Status: Active pre-implementation gate  
Next implementation: 0.24.22 DB Foundation

## 1. Decision

Codex may start 0.24.22 only after the repository uses one unambiguous active execution authority. This version completes that document-authority cleanup.

## 2. Active authority order

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. target Sprint topic specifications and DB audit/design documents
6. release engineering and QA documents

When historical documents conflict with the items above, the active authority order wins.

## 3. Superseded planning statements

The following statements are historical only:

- 0.24.22 is UI Foundation or Productization Sprint #2.
- 0.24.22 prioritizes PB-005/006/010.
- 0.24.22 must not examine DB authority because it is UI-only.
- underwear/accessories are still owner-decision blockers.
- final PDF lifecycle, Export package, deletion timing, or Trial/card policy remain undecided.

They may remain in version history but must be marked historical or superseded and must not be copied into new prompts.

## 4. Verified inclusion in the active plan

- final commercial and operational policy,
- DB schema/query/permission audit and source-of-truth design,
- source architecture cleanup and oversized-file targets,
- WAFL common UI and responsive cleanup,
- authorization, IDOR, RLS, opaque routing, and production boundaries,
- public website, signup, approval, Trial, and PG-neutral card reference,
- system catalog, sizes, POM, PDF/R2, Export, quota, termination, deletion, billing, operations, security, CI, and real-device QA,
- `/id-control` preservation for dev/test and production blocking,
- PowerShell follow-up registry requirements.

## 5. 0.24.22 GO conditions

- current docs and roadmap identify 0.24.22 as DB Foundation,
- no active manifest identifies UI-first 0.24.22,
- repository and deployed dev/test schema can be compared without mutation,
- read-only reconciliation and menu 30–32 evidence are available,
- migration execution is not bundled with unrelated changes.

## 6. STOP conditions

- production mutation is required,
- reconciliation reveals unresolved conflicting ownership,
- deployed schema materially differs from repository and cannot be explained,
- destructive cleanup or backfill lacks mapping and rollback,
- the requested task expands beyond DB Foundation into unrelated UI or commercial workflows.

## 7. Result

After local build and contract verification of 0.24.21.17, the project may proceed to 0.24.22 using document 31 without another planning rewrite. Newly discovered dependencies must be recorded as Sprint findings and handled by the stop conditions rather than silently expanding scope.
