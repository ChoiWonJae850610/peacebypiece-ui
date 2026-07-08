# WAFL v2 App-first Start Here - 2.0.0-alpha.1

## Purpose

This document starts the WAFL v2 App-first line.

Previous baseline: `0.30.0-alpha.27`.
Current baseline: `2.0.0-alpha.1`.

The customer-facing product direction moves from a Next.js-first web showroom implementation path to an Expo React Native mobile/tablet app-first path.

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

- system administrator screens,
- customer administrator advanced settings,
- operations and internal diagnostics,
- API routes and server integration,
- file/PDF/R2/Worker integration,
- `/ui` design showroom,
- internal documents,
- test console.

`/ui` remains the implementation-baseline design showroom. It is not the customer-facing app target.

## Boundary for this version

This version creates the App-first baseline documents and aligns the app display version.

It does not create:

```text
mobile/
apps/mobile/
Expo project
React Native screens
DB migration
API change
R2/Worker/PDF integration change
package dependency change
lockfile change
.env file
```

Expo skeleton creation is planned for `2.0.0-alpha.2`.

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
```

## Relationship to 0.30.x documents

`docs/project/v2/*` remains the 0.30.x Product/Sheet/Card and `/ui` showroom design baseline.

For App-first `2.0.x` work, `docs/project/app-v2/*` has priority for customer-facing platform direction. Existing v2 documents remain active references for business policy, Product/Sheet/Card concepts, Korean labels, Neon/R2/Worker safety, PDF/share rules, and QA evidence.
