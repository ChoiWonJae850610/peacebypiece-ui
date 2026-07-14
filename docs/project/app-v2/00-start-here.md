# WAFL v2 App-first Start Here - 2.0.0-alpha.1

## Purpose

This document starts the WAFL v2 App-first line.

Previous baseline: `0.30.0-alpha.27`.
Current baseline: `2.0.0-alpha.36`.

Alpha.36 keeps the Expo surface mock-only, corrects the final order summary and empty-field display, and adds subtle separation between fabric/accessory cards without increasing compact body height. Preview rendering and generated-document/PDF/R2 lifecycle are unchanged and remain a separate alpha.37 boundary.

The customer-facing product direction moves from a Next.js-first web showroom implementation path to an Expo React Native mobile/tablet app-first path.

## 2.0.0-alpha.2 checkpoint

This checkpoint turns the App-first direction into the first repository structure.

- `www.wafl.co.kr` is the public WAFL app landing site for product introduction, launch/download information, pricing, examples, Instagram CTA, trial request, inquiry, and waitlist.
- Before launch, public CTAs must use wording such as `출시 준비 중`, `체험 신청`, `문의하기`, and `대기자 신청`.
- Do not expose TestFlight, Google Play Internal Testing, Expo dev build, or internal tester links on the public landing site.
- `/ui`, `/roadmap`, and `/functions` are localhost-only development check routes.
- `/system` and `/workspace` are long-term removal targets in the product direction, but they are not deleted in this checkpoint.
- `apps/mobile` contains the first Expo React Native skeleton and mock-only 제작 카드 navigation.
- Root package metadata and root lockfiles remain untouched.

## Product direction

WAFL remains a clothing-production workspace:

```text
WAFL v2 = 옷 하나를 만들기 위한 모바일/태블릿 우선 제작 워크스페이스
```

Customer-facing use is now prioritized for:

- iPhone.
- iPad mini.
- iPad Pro.
- Galaxy Tab.

The app must feel comfortable for image capture, image selection, size/color confirmation, material/accessory entry, process/factory instruction, output/share, and quick delivery request work.

## Platform roles

Expo React Native is the priority target for customer field work and everyday production-card use.

Next.js remains active for:

- public app landing site,
- operations and internal diagnostics,
- API routes and server integration,
- file/PDF/R2/Worker integration,
- `/ui`, `/roadmap`, and `/functions` localhost-only development check routes,
- internal documents,
- test console.

`/ui` remains the implementation-baseline design showroom. It is not the customer-facing app target.

## Boundary for this version

This version creates the App-first skeleton and aligns the app display version.

It does not create:

```text
DB migration
API change
R2/Worker/PDF integration change
.env file
production auth
real camera/file/share/PDF behavior
```

Expo dependencies are scoped to `apps/mobile` only.

## Active document set

```text
docs/project/app-v2/
  00-start-here.md
  01-app-first-product-definition.md
  02-mobile-tablet-ux-principles.md
  03-app-architecture.md
  04-auth-google-apple.md
  05-device-test-plan.md
  06-expo-environment-setup.md
  07-feature-map-from-ui-alpha27.md
  08-roadmap-2.0.md
  09-codex-working-rules.md
  10-public-landing-site.md
  11-app-design-theme-v1.md
  12-v1-db-api-performance-audit.md
  13-core-domain-schema-v2.md
  14-v2-schema-migration-and-performance-plan.md
  15-v2-source-db-boundary-and-release-policy.md
  16-workorder-api-command-read-model-contracts.md
  17-v2-api-contract-test-plan.md
  18-v2-additive-migration-draft-and-schema-contract.md
  19-v2-dev-test-migration-and-performance-evidence.md
  20-workorder-list-read-api-evidence.md
  21-workorder-detail-lazy-read-api-evidence.md
  22-workorder-create-basic-update-command-evidence.md
  23-workorder-material-order-command-evidence.md
  24-workorder-revision-issue-command-evidence.md
  25-workorder-issued-revision-preview-evidence.md
  26-mobile-issued-preview-entry-evidence.md
  27-factory-workorder-input-and-preview-evidence.md
  28-inline-input-and-preview-layout-evidence.md
  29-inline-density-and-realistic-sample-evidence.md
  30-realistic-preview-entry-and-material-card-flow-evidence.md
  31-mobile-preview-sample-and-material-footer-evidence.md
  32-mobile-material-compact-input-evidence.md
  33-mobile-material-card-separation-and-summary-evidence.md
```

The alpha.19 documents are design and read-only audit authority. They do not authorize schema migration, API replacement, seed execution, DB/R2 mutation, or PDF Worker changes.

The alpha.20 documents and `lib/domain/work-orders/contracts/` define source/DB boundaries and type-only API contracts. `db/v2/` is a README-only workspace in alpha.20; no migration, full reset, seed, API route, or runtime DB integration is authorized.

The alpha.21 checkpoint adds ordered additive migration SQL drafts and a static schema contract under `db/v2/migrations/`. The drafts are not applied. Neon access, constraint validation, RLS runtime proof, seed, benchmark, API implementation, and production mutation remain forbidden until a separately approved alpha.22 work order.

Alpha.22 applied the six reviewed migrations and synthetic performance fixtures only to the approved dev/test target. Alpha.23 adopts the first bounded runtime read path, `GET /api/v2/work-orders`, behind authenticated company scope, `workorder.read`, an expiring signed cursor, the `NOBYPASSRLS` tenant role, and a dev/test fingerprint guard. The mobile app remains disconnected, and production/API writes/schema mutation remain forbidden.

Alpha.24 adds only the WorkOrder core detail and seven tab-specific lazy Read endpoints on the same approved dev/test target. It reuses ledger 7, index 007, and the alpha.22 synthetic seed without schema/data mutation; the mobile app remains disconnected.

Alpha.25 introduces the source and static/read-only preflight boundary for draft WorkOrder create and basic-info update Commands. Valid POST/PATCH dev/test mutation remains blocked until a separate explicit owner approval; production, mobile, migration/schema, material/process, document, R2, Worker, and PDF paths remain disconnected.

Alpha.26 extends the same guarded Command architecture to fabric/accessory line create and patch plus order request, cancel, and completion. Valid material/order mutation remains separately approval-gated; no migration, delete lifecycle, mobile connection, R2/Worker/PDF, business-data, or production path is added.

## Relationship to 0.30.x documents

`docs/project/v2/*` remains the 0.30.x Product/Sheet/Card and `/ui` showroom design baseline.

For App-first `2.0.x` work, `docs/project/app-v2/*` has priority for customer-facing platform direction. Existing v2 documents remain active references for business policy, Product/Sheet/Card concepts, Korean labels, Neon/R2/Worker safety, PDF/share rules, and QA evidence.
