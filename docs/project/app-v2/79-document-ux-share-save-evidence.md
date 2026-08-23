# 79. Alpha.67 Document UX, Share, and Save evidence

Status: current alpha.67 implementation evidence. Owner physical PASS is not inferred.

## Bounded remediation

- The existing `react-native-pdf 7.0.4` owner remains the only native renderer. Its current page is
  updated by both vertical-scroll callbacks and explicit previous/next renderer jumps; first/last
  controls are disabled and the existing zoom/download instance is retained.
- Basic Process `in_progress` is the requested state. It exposes canonical cancellation only. The
  separate mobile complete action is removed; successful WorkOrder issue remains the idempotent
  Basic completion owner. Additional Process is unchanged.
- Document Save no longer opens the workspace file URL in Safari. It reuses the authenticated
  internal PDF transport, verifies HTTP/PDF MIME, bounded nonzero bytes, `%PDF-` signature, and
  source/copied SHA-256, then gives a temporary local PDF to the native file/save surface and removes
  it after handoff. It creates no public share token and exposes no R2 or query-string secret.
- Share and embedded-QR metadata present creation, expiry, last access, and access count as separate
  rows. Native share copy uses restrained business wording and contains its controlled viewer URL
  exactly once.
- Public `/v` retains token exchange, cookie session, expiry/revoke/access accounting, and generic
  unavailable states. The actual PDF is mounted inline immediately; Download remains secondary and
  the internal workspace file route remains session-protected.

## Branded origin boundary

The live owner derives the public viewer origin from the validated current request/Serve origin.
No separately verified `wafl.co.kr` production viewer deployment owner is active in this Delta.
`BRANDED_PUBLIC_VIEWER_DOMAIN_DEFERRED` therefore remains explicit; no short-link or token redesign
was introduced.

## Verification boundary

The permanent contract inventory is `170/170` with FAIL `0` and SKIP `0`; migration ledger remains
`20/20`, migration `021` is absent, production/owner-fixture mutation is `0/0`, APP_VERSION remains
`2.0.0-alpha.66`, and commit/push/release remain `0/0/0`.

`PHYSICAL_RESULT_NOT_INFERRED`
