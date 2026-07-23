# WAFL Codex Testing, Contracts and Failure Handoff

Document type: **Permanent Rules — Testing, Contracts and Failure Handoff**

Entry point: [09-codex-working-rules.md](09-codex-working-rules.md)

This document owns durable testing philosophy, historical/current contract maintenance, bounded failure behavior, and Failure Handoff contents.

## 1. Behavior and public contract first

- Test user-visible behavior, public controller/domain contracts, API request/result effects, state transitions, and mutation counts before implementation details.
- Source regex is appropriate only when source structure itself is the contract, such as forbidden imports, route guards, secret exposure, dependency direction, or a required registration point.
- Do not use line count, private symbol spelling, JSX position, or an implementation file location as a proxy for product behavior.
- Never make a failing test pass by deleting it, skipping it, weakening assertions, hiding type errors with broad casts, or increasing a timeout without evidence.

## 2. Historical and current contracts

Historical contracts preserve the product or safety meaning introduced by their version; they do not freeze every later implementation location or current-version literal.

- Distinguish historical facts from current compatibility assertions.
- When a canonical owner moves, update only the stale source-location assertion while preserving the original behavior, safety, and regression meaning.
- Do not reintroduce duplicated product logic merely to satisfy an old file-location assertion.
- Do not repeat a current alpha literal across historical tests. Use `tests/helpers/wafl-v2-current-version.mjs` or the canonical version source and verify current documentation/mobile consistency dynamically.
- Historical evidence/version/runtime-mode strings remain immutable unless an objectively proven typo is handled under the evidence policy.
- Current contracts own the current policy and extension boundary. Historical tests must not silently override them.

## 3. Node, React Native, and pure-module boundaries

Node-only contracts must not directly import React Native/Metro-only alias modules. A function needed by product Runtime and Node contracts is separated into an alias-free pure module when possible:

- no React, React Native, Expo, network, environment, filesystem, or side effect;
- deterministic JSON-safe input/output;
- no Metro-only aliases such as `@/domain`, `@/application`, or `@/features`;
- the product Runtime and Node test import the same implementation.

Do not change tsconfig, Babel, Metro, package exports, or dependency configuration merely to make a Node contract resolve a mobile alias.

## 4. Durable mobile data and edit-session contracts

These long-lived regression principles apply when their domain is in scope:

- UI supplies a bounded field patch; the controller owns the live canonical full draft and merges immediately before validation/save.
- A stale UI snapshot must not overwrite live sibling fields.
- Normalize optional values at the canonical boundary. Never call `.trim()` directly on an optional or unknown value.
- Validation returns structured failure instead of throwing on a valid absent optional field.
- Explicit save performs no more than one request, applies the canonical response, and fully ends the edit session.
- Cancel performs request `0` and fully ends the edit session.
- Async handlers contain thrown failures, release in-flight state in `finally`, preserve usable local state, and produce no unhandled rejection.
- A valid API response must not be classified as malformed; truly malformed responses remain rejected.

These rules do not authorize changing product behavior outside the active Delta.

## 5. Bounded validation and new failure

Run each validation step the number of times stated by the Delta. Do not automatically loop or repeat an identical failure. A read-only correction cycle is allowed only when explicitly authorized, target/fingerprint is unchanged, effects remain zero, and its bound is not exceeded.

On any new or repeated failure:

- stop before Runtime, commit, push, Finish, ZIP, or repo-state as applicable;
- do not roll back, reset, clean, stash, broadly kill, repair data, or conceal output;
- preserve source diff, validation output, Runtime markers/logs, process/config state, and observed effects;
- identify the smallest next authorization without expanding scope.

Failure artifacts never replace `4. Newest` and never count as completion.

## 6. Failure Handoff

A Failure Handoff records:

- actual KST and declared failure status;
- baseline repository, branch, HEAD, origin, ahead/behind, and full Git state;
- last successful checkpoint and exact failed checkpoint;
- expected and actual result;
- sanitized original error, file/line when applicable, and bounded cause analysis;
- changed files and commands/check counts already executed;
- Runtime marker, role ownership, ports, Serve/Funnel, and protected remote services when relevant;
- baseline and actual DB/object versions, row/event/receipt counts, expected delta, and observed delta;
- PC resource audit and remote-operation risk;
- source, Runtime, logs, data, and partial effects preserved;
- forbidden automatic actions confirmed not run;
- the smallest safe next action and exact owner decision/authority required.

A handoff reports facts and inference separately. It never declares completion or instructs the owner to retry the failed mutation/device action.
