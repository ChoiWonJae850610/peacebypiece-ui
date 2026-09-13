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

## 7. External handoff file hygiene

The Owner gives standing authorization for verified WAFL artifact publication between the canonical local artifact directory `C:\CWJ_Project\Patch\PeacebyPiece\4. Newest` and the designated synchronized directories `G:\내 드라이브\WAFL_Codex\INBOX` and `G:\내 드라이브\WAFL_Codex\RESULTS`. The authorized artifact classes are WAFL handoff ZIPs, whole-product current-source snapshots, final Source ZIPs, matching repo-state, Official Result/QA pairs, and their manifests or verification records. A whole-product source archive is expected and authorized in those exact destinations; do not request repeated egress approval solely because it contains ordinary WAFL repository source or because the destination is synchronized Google Drive storage.

This standing authorization never includes passwords, live credentials, API secrets, private keys, real `.env` contents, production database dumps, customer personal data, live-data backups, unrelated project material, another account/recipient/path, public-link creation, or sharing-permission expansion. Canonical source-only exclusions and secret scans remain mandatory. A failure in provenance, exclusion, secret, or destination verification is a stop for that artifact only.

Use this exact publication and replacement order:

1. create the new artifact;
2. run exclusion and secret checks;
3. publish only to an authorized exact destination;
4. re-read the published copy and verify filename, byte size, full SHA-256, archive entry count/full-read when applicable, and exclusion/secret/duplicate/read violations;
5. prove each predecessor's WAFL provenance, role, exact identity, and replacement relation;
6. delete each obsolete predecessor by exact literal path only, after confirming its exact filename plus verified byte size and SHA-256;
7. verify the final retained inventory.

For artifact hygiene, never use a wildcard or broad deletion. Prefix deletion, directory-wide cleanup, unrelated-file deletion, and deleting a baseline before its replacement is verified are also prohibited. If one file's provenance or replacement relation is unclear, preserve that file and record why while continuing other independently safe exact cleanup.

- `RESULTS` retains only the current task's official Result/QA pair after that latest pair is verified. Publish and verify both replacement files before deleting older WAFL Result/QA files individually. Intermediate logs and raw evidence do not belong in `RESULTS`.
- `INBOX` retains the handoff required for the active execution and the latest verified current-source snapshot. Delete a consumed handoff only after execution and successor evidence are verified.
- `4. Newest` retains the latest completed version's final Source ZIP plus matching repo-state. If the current workflow keeps an in-progress snapshot there, retain only its latest verified copy. A current in-progress snapshot never replaces or authorizes deletion of the most recent completed-version final Source ZIP/repo-state.
- A prior instruction to retain a current Result/QA, snapshot, handoff, final ZIP, or repo-state is a replacement barrier, not permanent retention. It expires when a verified artifact of the same role supersedes it. An explicit `permanent retention` or `retain after successor version` instruction remains authoritative.
- A failure preserves the active input and the previously verified Official Result/QA pair unless the active Delta explicitly requires a new verified failure pair.
- Artifact hygiene changes files only. It cannot mutate source behavior, Git history/state, DB, R2, PDF/token lifecycle, or fixtures.

## 8. Current-source GPT review snapshot

When an owner-approved Delta requires a GPT-reviewable current-source snapshot at a normal pre-finalization checkpoint, it is a diagnostic snapshot, not a release artifact. Create it only after the official Result/QA pair is verified, under `C:\CWJ_Project\Patch\PeacebyPiece\4. Newest`, with a timestamped `current-source-snapshot` filename. Include the current tracked and untracked source, current canonical docs and contracts, the current official Result/QA pair, and an index that states the checkpoint and collection scope.

Apply the canonical Source ZIP exclusions for Git metadata, dependencies, builds, caches, runtime/test artifacts, reports, coverage, env files, secrets, credentials, logs, existing generated ZIPs, and repo-state/build-result outputs. Verify archive open/test, entry count, byte size, SHA-256, exclusion violations, and secret/env hits. Snapshot creation must not modify repository source, Git state, DB/R2/PDF/token state, fixtures, or Runtime. It does not replace the canonical release Source ZIP or authorize version, commit, push, or finalization work.

Publish a verified current-source snapshot to the designated `INBOX` under the standing authorization in section 7 when the active Delta requires external handoff. Re-read the destination rather than trusting copy completion. Never overwrite an existing timestamped snapshot with different bytes. When policy or source changes after snapshot creation, create and verify a new timestamped snapshot, publish it, and only then remove the superseded snapshot by exact identity.

Because a ZIP cannot contain a Result file that also embeds that ZIP's own final SHA-256 without a self-reference, the snapshot may embed the verified pre-publication Official Result/QA pair identified by the index. After the ZIP identity is known, the externally published Official Result may record the full snapshot identity. The index and report must label this two-phase relationship explicitly; it is not permission to embed stale product/source evidence.
