# Alpha.80 Stage 3 Public Share Security / Isolation Evidence

Checkpoint: `ALPHA80_STAGE3_PUBLIC_SHARE_SECURITY_ISOLATION_IPHONE_IPAD_QA_REQUIRED`

Owner actual Stage 2 physical QA is PASS on iPhone and iPad mini. This Stage 3 security checkpoint remains
`PHYSICAL_RESULT_NOT_INFERRED` until the short public-Viewer re-QA is completed.

## Canonical bearer boundary

- The public credential is a 43-character base64url HMAC-SHA256 cryptographic PRF output under the server signing
  secret. Its 256-bit output exceeds the 128-bit minimum, is domain separated, and is never persisted or logged raw.
  PostgreSQL stores only the exact SHA-256 token hash.
- Token redemption resolves one exact company and generated document through a hash-only `SECURITY DEFINER` function.
  Canonical Maker link creation separately fixes the current WorkOrder Revision, newest generation, and immutable object
  key/size/digest before the credential can exist. Public session and file routes accept no company, WorkOrder, Revision,
  document, generation, or storage-key selector.
- The signed HttpOnly session binds token id and generated-document id. Every PDF and attachment read re-enters the DB
  authorization owner, so revoke, expiry, document revoke, and document delete terminate access even when a browser still
  holds a session cookie. WAFL-controlled responses are private/no-store.

## Attack evidence

- The executable contract records 125 security findings spanning entropy, mutation denial, exact binding, terminal
  replay, enumeration concealment, cache authorization, Viewer minimization, headers, rate-limit decision, and retained
  Stage 1/2/lifecycle contracts.
- Sanitized DEV evidence uses only `VALID_A`, `MUTATED_A`, `REVOKED_A`, `EXPIRED_A`, and `VALID_B` classes. It proves the
  exact current `VALID_A` PDF bytes/digest, twelve invalid or duplicate-selector denial cases, seven terminal predecessor
  denials, and zero internal-id/token-hash/storage-key leakage. No safe second current-link artifact existed, so the B
  matrix is recorded as static selector-surface and service/SQL isolation evidence rather than fabricated data.
- Public bootstrap returned no Maker controls, private Recipe navigation, token/document internal ids, storage metadata,
  or debug payload. The unused internal access counter was removed from the public response and client DTO.
- No application rate-limit owner exists for this route. With a 256-bit secret-keyed credential, exact hash lookup,
  bounded 512-byte bootstrap body, generic fail-closed errors, and no unauthenticated generation/amplification path,
  operational edge throttling is deferred without adding Redis, a vendor, or a dependency.

## Boundary

- APP_VERSION: `2.0.0-alpha.79`
- migration: `22/22`; new/Production migration `0/0`
- dependency/native/config/EAS: `0/0/0/0`
- API/schema/billing/Factory delta: `0/0/0/0`
- Production/Owner/ambiguous business mutation: `0/0/0`
- token lifecycle/document/WorkOrder/Revision/R2 mutation: `0/0/0/0/0`
- commit/push/tag/release/finalization: `0/0/0/0/0`
- physical result: `PHYSICAL_RESULT_NOT_INFERRED`

## Verification

- Stage 3 focused contract: `125/125 PASS`
- retained Stage 1 `61/61`, Stage 2 lifecycle `68/68`, and current-link actions `51/51`: PASS
- Canonical Verify: `304/304 PASS`; FAIL/SKIP `0/0`
- root/mobile TypeScript, changed-source ESLint errors `0`, `git diff --check`, Next production build, and Expo SDK 55
  public config: PASS
- iOS HBC: `6,148,955` bytes, SHA-256 `08b01691…c4de6be`; Android HBC: `6,229,523` bytes, SHA-256
  `be6d8c63…6dca4dc`
- migration/data audit and strict external physical-QA runtime: PASS
