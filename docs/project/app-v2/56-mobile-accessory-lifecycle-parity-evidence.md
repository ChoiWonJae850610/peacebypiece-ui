# 2.0.0-alpha.56 Mobile Accessory Lifecycle Parity Evidence

Status: `ALPHA56_ACCESSORY_LIFECYCLE_PARITY_COMPLETE`

## Baseline and scope

- Entry version/HEAD: `2.0.0-alpha.55` / `e36436293c3217f09555135149d9468e3fecf23a`.
- Result version: `2.0.0-alpha.56`.
- Scope: Maker mobile accessory Read/create/update/archive/restore and request/cancel/re-request/complete parity on the existing shared material boundary.
- Explicit exclusions: Factory/partner/supplier features, images/attachments/drawing/AI, Preview/PDF/R2, schema/migration, dependency, native/EAS, production mutation, hard delete, and unrelated UI/refactor.
- Candidate commit: `feat: WAFL v2 부자재 lifecycle parity 완성`.

## Product and architecture result

- `MaterialType` is the canonical mobile union `fabric | accessory`; response normalization rejects unknown types and preserves the requested type through page and command results.
- Material queries, controller calls, request de-duplication, bounded cache entries, active/archived pagination, snapshot refresh, create/edit sessions, and command-result checks are keyed by WorkOrder and material type.
- The previously disabled ProductionCard `부자재` tab now reuses the canonical material view/editor while keeping fabric and accessory cache and response state isolated.
- Customer copy changes by material type for loading, empty, error, add/edit, archive/restore, and validation states.
- Accessory lines reuse the existing shared calculation, readiness, permission, expectedVersion, receipt/event, archive lifecycle, current order cancellation, stock-covered zero-order, terminal completion, and hard-delete prohibition.
- The header remains `[bounded name][unit badge][status badge]`, quantity and unit remain on one baseline-aligned row, and memo compact/full disclosure plus native-text finalization are shared.
- The overlap-host proxy correction evaluates the tailnet-only Developer Auto Connect allowlist before the external Preview allowlist. Request `Host` remains authoritative and `x-forwarded-host` remains forbidden.

## Automated Runtime evidence

- Canonical internal mode: `accessory-lifecycle-parity`, using runner-owned Next, foreground Tailscale Serve, and Expo roles without Cloudflare Preview transport.
- Starting canonical entity-version baseline: WorkOrder/revision/material `109/109/87`, material rows `8`, Event/Receipt `142/54`, migration ledger `13/13`, legacy cancelled `2`.
- Automated delta: WorkOrder/revision/material `+16/+16/+16`, material rows `+3`, Event/Receipt `+16/+13`.
- Automated retained baseline: `125/125/103`, rows `11`, Event/Receipt `158/67`, ledger `13/13`, legacy cancelled `2`.
- Normal accessory fixture completed create, memo update, archive, restore, request, cancel to editing, post-cancel update, re-request, and completion at version `9`.
- Stock-covered zero-order fixture completed request, cancel, re-request, and completion at version `5` with amount `0.00`.
- The physical-device fixture was prepared as active `editing / 2`; a zero-demand request was rejected before mutation.
- Request ledger: `17` total, `16` successful; create `3`, PATCH `3`, archive/restore `1/1`, request attempts/successes `5/4`, cancel `2`, complete `2`.
- Hard DELETE, automatic, duplicate, unknown, fabric-target, legacy-cancelled, and production mutation: `0`.

## Physical-iPhone and memo acceptance

- The owner completed the instructed physical-iPhone Development Build flow on the retained accessory fixture.
- Exactly three PATCH actions, two requests, one cancel, and one completion produced WorkOrder/revision/material `+7/+7/+7`, Event/Receipt `+7/+4`, and material rows `0`.
- Final canonical entity-version baseline is WorkOrder/revision/material `132/132/110`, material rows `11`, Event/Receipt `165/71`, migration ledger `13/13`, and legacy cancelled `2`.
- The final device fixture is `completed / 9`; terminal/read-only state, fixed badge layout, quantity/unit row, card collapse/re-expansion, and background/re-entry passed.
- `V5_MEMO_EVIDENCE.md` is the authoritative memo handoff. It records expected/actual exact equality `true`, code-point difference `0`, and Unicode, whitespace, newline, and punctuation difference `0`.
- Finalization did not requery or correct the memo and did not use whole-database row counts as the `132/132/110` baseline.
- Product acceptance level: `LEVEL_4_PRODUCT_VERIFIED` within the alpha.56 accessory lifecycle scope.

## Runtime teardown and effects

- Finalization used the canonical safe stop exactly once for runner-owned roles.
- Ports `3000/3100/8081` are clear after stop, foreground Serve ownership is released, and structural `AllowFunnel: true` count is `0`.
- Tailscale and Chrome Remote Desktop remain running; unrelated-process impact is `0`.
- DB business/schema/migration, API business mutation during finalization, memo query/correction, R2/PDF/token, production, dependency, native, and EAS effects are `0`.

## Verification and delivery boundary

- Targeted alpha.45/47/48/50/51/52/55/56 contracts preserve historical behavior while extending the current accessory boundary.
- Root/mobile TypeScript, targeted ESLint, Expo/mobile checks, Next build, PowerShell parse/BOM, Unicode, `git diff --check`, version consistency, Canonical Verify, and mutation audit are required on the final changed fingerprint before commit.
- The tracked source cannot contain the hash of the commit that contains itself. Final commit/push identity, synchronized `master=origin/master`, final verification result, clean Git, and the pushed-HEAD Source ZIP/repo-state identities are owned by the matching post-push repo-state and V6 Result.
- Next candidate: `2.0.0-alpha.57` Maker WorkOrder image and representative-image foundation. AI image generation and Factory remain excluded.
