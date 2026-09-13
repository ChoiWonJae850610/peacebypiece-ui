# Alpha.80 Stage 2 Current Share Link Actions Evidence

Checkpoint: `ALPHA80_STAGE2_CURRENT_SHARE_LINK_ACTIONS_IPHONE_IPAD_REQA_REQUIRED`

This immutable record covers the current-link action reconciliation. Stage 1 Owner physical Share is PASS on iPhone and
iPad mini; the reconciled action surface remains `PHYSICAL_RESULT_NOT_INFERRED` until Owner re-QA.

## Canonical action owner

- The authenticated Maker workbench obtains the one active canonical target through read-only
  `GET /api/v2/work-orders/documents/{documentId}/access-tokens/current`. The route requires `workorder.update`, returns
  only the exact current healthy document/Revision/generation lineage head, and is private/no-store.
- One pure mobile model joins that target to the authoritative token list and current document projection. A mismatched
  company-owned token identity, document, WorkOrder, Revision, generation, terminal status, or non-current marker yields
  no current actions.
- `열기`, `링크 복사`, and `공유하기` consume the same current URL; `공유 링크 폐기` consumes the same token id. None of
  these read actions creates, rotates, or replaces a credential. After revoke and refresh the current action surface is
  absent while the healthy PDF remains unchanged; top-level Share remains the only explicit replacement entry point.
- Link copy reuses the installed React Native core clipboard surface, and native Share remains the existing system share
  owner. No dependency, native, Expo config, or EAS delta is introduced.

## Evidence boundary

The retained Stage 2 exact DEV evidence proves revoke/event once, public denial, replacement, expiry, concurrency, exact
PDF identity, and one final lineage head. The later Owner revoke left the fixture with no active current head. Therefore
the reconciliation run deliberately performed only authenticated read-only current/list/health requests, confirmed the
healthy PDF plus zero current actions, and made no token, document, DB, or R2 mutation. UI/server contracts execute both
the current-present action identity and current-absent post-revoke states; Owner re-QA will create a replacement only by
an explicit top-level Share.

## Boundary

- APP_VERSION: `2.0.0-alpha.79`
- migration: `22/22`; new/Production migration `0/0`
- dependency/native/config/EAS: `0/0/0/0`
- Production/Owner/ambiguous business mutation: `0/0/0`
- reconciliation runtime mutation: token/document/R2 `0/0/0`
- Stage 3: `0`; commit/push/tag/release/finalization: `0/0/0/0/0`
- physical result: `PHYSICAL_RESULT_NOT_INFERRED`

## Verification

- focused contracts: Stage 1 `61/61`, retained Stage 2 lifecycle `68/68`, current-link actions `51/51`
- Canonical Verify: `303/303 PASS`; FAIL/SKIP `0/0`; fingerprint `93f2b050…1721037c`
- root/mobile TypeScript, changed-source ESLint, `git diff --check`, Next production build, Expo SDK 55 public
  config, and iOS/Android HBC export: PASS
- iOS HBC: `6,148,955` bytes; SHA-256 `cc9f9ee96f0527e3f117bdf74f1683bf8d0716b2622cca4d48b3917b861d839b`
- Android HBC: `6,229,524` bytes; SHA-256 `86d82dff02a88ccd0ef1bc5998347dbc50b2fd03b23a1a05f26c8f4457d2c207`
- strict external physical-QA runtime: `READY=true`
