# WAFL Self-Executing Version Delta Template

Use this concise template for alpha.55 and later. Read the Permanent Rules entry point and its mandatory child documents; do not copy their generic details into a Delta.

```text
SELF-EXECUTING HANDOFF — WAFL <version and objective>

Canonical rules
- Read and apply docs/project/app-v2/09-codex-working-rules.md and its mandatory 09a-09d read set.
- This attached/pasted handoff is execution approval. Start at preflight without another confirmation.

Baseline
- Repository:
- Branch:
- Completed version:
- HEAD/origin:
- Expected ahead/behind and working tree:

Target
- Result version:
- Target status:
- Objective:

Approved scope
- Included:
- Version-specific owner modules/docs:

Explicit exclusions
- Non-goals:
- Any exceptional production/schema/dependency/native/account/destructive authority: none unless listed here.

Data and effects
- Version-specific DB/object baseline:
- Expected mutation/effect:
- Maximum request/Check count:

Verification
- Version-specific targeted tests:
- Canonical Verify profile:
- Runtime requirement or NOT_REQUIRED:
- Automated Runtime QA:

Physical-device QA
- Minimum owner-only visual/native checks:
- Exact save count and expected delta, or save 0:

Completion
- Completion gates:
- Candidate commit:
- Final status:
- Next-version boundary:

Current remediation, if any
- Exact failed checkpoint:
- Approved minimum correction:

New failure
- Stop and use the Failure Handoff in 09c. Do not retry, roll back, commit, push, or create artifacts.
```

The template intentionally omits the full PC audit method, runner internals, generic Git/artifact sequence, reset/cleanup prohibitions, test philosophy, and Failure Handoff field list. Those remain single-owned by `09a` through `09d`.
