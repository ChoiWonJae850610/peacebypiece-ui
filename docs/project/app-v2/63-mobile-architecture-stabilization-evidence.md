# 2.0.0-alpha.63 Mobile Architecture Stabilization Evidence

Status: `ALPHA63_FINALIZATION_COMPLETE`

## Result and boundary

- Result version: `2.0.0-alpha.63`.
- Alpha.63 entered from synchronized alpha.62 HEAD/origin
  `93833f4c39fcf42bd387952137fd518b3186bade` with a clean working tree.
- Completed scope: source/architecture-only stabilization of the Maker mobile experience,
  domain-split typed API modules, canonical shared-owner audit, import-cycle protection, and
  product-equivalent material revalidation measurement.
- User-facing product behavior remains the accepted alpha.62 behavior. Factory, mobile
  document/PDF, AI, production mutation, dependency/native/EAS expansion, and new
  migration/schema are excluded.

## Mobile experience responsibility boundary

- `MobileWorkOrderExperience.tsx` moved from 2,237 lines, 104,364 bytes, 40 imports,
  37 `useState`, 34 `useRef`, and 21 `useCallback` tokens to 1,127 lines, 54,918 bytes,
  30 imports, 26 `useState`, 19 `useRef`, and 14 `useCallback` tokens.
- The top-level experience retains composition, session/list/create/navigation, and overview
  coordination. Coherent feature controllers now own paired fabric/accessory authoring,
  image/attachment authoring, and size/spec top-level coordination.
- Existing size/spec controllers and shared inline, queue, pending, reel, sheet, placeholder,
  date, display, and semantic-copy owners are reused rather than copied.

## Mobile API and type ownership

- `apps/mobile/lib/apiClient.ts` changed from a 1,060-line, 45-export implementation to a
  seven-line compatibility barrel.
- `apiTransport.ts` remains the only low-level request, credential, header, timeout, and error
  owner. Typed modules own session/connect, WorkOrders, materials, size/color, measurements
  and templates, assets, validation, and size/color response normalization.
- Route, method, payload, response, authentication, and error semantics are unchanged.
- The new controller/API import graph has circular dependency count `0`.
- `mobileContract.ts` remains `INTENTIONALLY SHARED` at 555 lines and 52 exports. Splitting its
  cross-domain read-model graph would increase fan-out and cycle risk without improving
  lifecycle ownership, so no parallel type definitions were introduced.

## Shared-owner and bounded-debt decisions

- Request/session identity, inline changed/unchanged/nullable clear, picker lifecycle, Sheet
  X/V grammar, material semantic copy, date-only normalization, placeholder, and number/unit
  formatting reuse their canonical owners.
- Stale-response guards and size/spec projection-version reconciliation extend the existing
  typed feature boundaries. Route/command/status literals remain intentionally local to their
  typed domain or policy owner when a cross-domain registry would be speculative.
- `ProductionCardMock.tsx` has no normal Runtime caller but remains historical contract/test
  fixture debt. It was not deleted, moved, or rewritten.
- Node typeless-package and PostgreSQL future SSL-semantics warnings remain because changing
  package type or connection configuration merely to silence them is outside the Delta.

## Material revalidation evidence

- Product-equivalent isolated Runtime measured fabric/accessory create, unit-price patch,
  quantity patch, nullable clear, partner change, order request, cancel, delete, and stale
  conflict fallback.
- Each successful observation uses command `1`, detail GET `1`, material-list GET `1`, the
  exact returned next version, and authoritative detail plus lifecycle-filtered material-list
  projections. The stale conflict uses rejected command `1`, mutation `0`, detail GET `1`,
  and material-list GET `1`.
- The command response alone does not own every projection required by the current UI.
  Therefore the two bounded reads remain unchanged rather than being blanket-removed without
  an authoritative local-reconcile proof.

## Verification, Runtime, and owner acceptance

- Applicable historical and alpha.63 contracts, root/mobile TypeScript, changed-file ESLint,
  JavaScript/helper parse, `git diff --check`, Next production build, Expo public config and
  iOS bundle, import-cycle checks, mutation audit, and the canonical
  `automation-infrastructure` Verify profile pass with Node `24.14.0`.
- Isolated Maker authoring, size/color batch, and measurement/template Runtime suites passed
  with exact mutable-business residual `0`; append-only Event/Receipt evidence was preserved.
- DeveloperAutoConnect used the current dynamically resolved Tailscale IPv4 consistently for
  Metro advertisement, iOS manifest launch, and Development Client launch selection. Port
  `3000`, cloudflared, Quick Tunnel, and Funnel were absent for the final internal Runtime.
- The owner performed physical-iPhone regression QA and approved continuation with
  `다 잘되는거같다 다음진행하자`. Finalization does not repeat product or device QA.

## Owner fixture and delivery

- Finalization read-only audit preserved exactly one owner WorkOrder and one system template:
  WorkOrder/Revision `draft/draft` at `216/216`, one cm snapshot, four WorkOrder sizes, five
  colors, two measurement values, generated documents/public tokens `0/0`; system template
  active/version `1`, sizes/POM/values `3/3/0`.
- Migration ledger remains `15/15`. Owner fixture create, update, delete, cleanup, or other
  finalization mutation is `0`.
- `APP_VERSION`, mobile diagnostic version, mobile package metadata, and Expo diagnostic extra
  are synchronized to `2.0.0-alpha.63`; Expo public version remains `2.0.0` and the accepted
  Development Build remains reusable.
- Root package dependencies remain unchanged. Production mutation, force/history rewrite,
  and finalization-time migration/schema changes are `0`.
- This immutable evidence intentionally excludes its containing commit hash and final artifact
  identity. The matching post-push alpha.63 repo-state owns final HEAD/origin, Git cleanliness,
  Canonical Verify fingerprint, and release ZIP metadata.

## Later boundary

Alpha.64 is `NOT_STARTED`. Alpha.63 completion does not authorize product expansion,
Factory/PDF/AI, production, dependency/native/EAS, or migration/schema work.
