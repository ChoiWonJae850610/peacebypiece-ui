# WAFL Codex Version Delta and Finalization

Document type: **Permanent Rules — Version Delta and Finalization**

Entry point: [09-codex-working-rules.md](09-codex-working-rules.md)

This document owns standing Version Delta authority, Git delivery, documentation-only maintenance, and product artifact finalization.

## 1. Self-executing Version Delta

Alpha.55 and later use [09e-codex-version-delta-template.md](09e-codex-version-delta-template.md). An owner-attached or owner-pasted `SELF-EXECUTING HANDOFF` is approval to begin its stated scope at preflight without waiting for a second message.

A Delta names:

- execution setting and canonical rule reference;
- baseline version, exact HEAD/origin, branch, and expected Git state;
- result version and target status;
- objective, included scope, and non-goals;
- exact DB/business/R2/PDF/token/schema/native/EAS effect budget;
- version-specific boundaries, tests, Runtime, automated QA, and physical-device QA;
- completion state, candidate commit, next boundary, and any current minimal remediation.

Do not repeat generic PC-audit prose, runner internals, Failure Handoff fields, Git/artifact mechanics, or generic prohibitions. Link these Permanent Rules. Omitted exceptional authority remains forbidden.

## 2. Standing authorization and exceptions

An exact owner-approved Delta authorizes scoped repository reads/edits, tests/build/Verify, canonical runner operations, read-only approved dev/test audits, exact named dev/test effects, evidence/version changes, exact-path stage, one ordinary commit, normal push, and product artifacts only when its completion gates permit them.

It is not blanket mutation authority. Stop before any unnamed target/effect, target or fingerprint change, unknown/partial write, schema drift, tenant leak, RLS bypass, integrity mismatch, dependency/native/account need, or effect outside budget.

The separate approval boundaries in `09` always apply.

## 3. Git delivery

- Start and finish on the branch named by the Delta, normally `master`.
- Do not stage or commit before required Runtime/user gates and final Verify.
- Stage only approved explicit paths; never `git add .`, `git add -A`, or `git commit -am`.
- Use one clear commit unless canonical tooling documents an unavoidable self-reference boundary.
- Push normally to the named origin branch. Never force, amend, rebase, reset, clean, or rewrite history.
- Push failure preserves state and stops before Finish/artifacts.
- After push, source is frozen. Completion requires HEAD equals the origin branch, ahead/behind `0/0`, and staged/unstaged/untracked `0/0/0`.

## 4. Product version artifacts

For a product/version delivery that explicitly requires artifacts:

1. finish source/evidence/version and Final Verify;
2. commit;
3. push and confirm origin equality;
4. create the Source ZIP from the final pushed HEAD with canonical Finish tooling;
5. validate filename, SHA-256, bytes, entries, exclusions, versions, identities, and clean Git;
6. generate the matching repo-state truthfully;
7. keep exactly the current matching pair in `4. Newest` through exact bounded replacement.

The Source ZIP excludes Git, dependencies, builds, caches, test/runtime artifacts, reports, coverage, env files, storage state, HAR/video, generated ZIP/repo-state/build-result, backups, process/config/identity audits, and OS temporary files. If source changes after ZIP creation, the pair is invalid and must not be published as matching.

Do not falsify an unsupported `Manual QA Status`; explain generator limitations in evidence and the final report.

## 5. Documentation-only maintenance

Documentation-only maintenance is a distinct delivery type when its Delta establishes:

- APP_VERSION and mobile/package versions unchanged;
- product source and behavior unchanged;
- Runtime `NOT_REQUIRED`;
- DB/business/schema/migration/R2/PDF/token/native/EAS effects `0`;
- targeted docs/contracts and Canonical Verify required.

For this type:

- write maintenance evidence;
- commit and push the approved documentation/validation paths;
- finish with synchronized clean Git;
- preserve the existing product release ZIP and repo-state byte-for-byte;
- do not create, replace, or overwrite an artifact with the same APP_VERSION;
- do not publish a new product artifact merely because the maintenance HEAD changed;
- use the new synchronized maintenance commit HEAD as the baseline for the next product Version Delta.

The tracked evidence cannot contain the hash of the commit that contains itself. Record the candidate message and verification facts in evidence; report the final commit/push/HEAD from Git after delivery.

## 6. Completion declaration

Declare completion only when every applicable Delta and Permanent Rule gate passes. Product completion requires matching artifacts when named. Documentation-only maintenance completes without new product artifacts when its exception conditions pass. Anything not executed is reported as `NOT_RUN`.
