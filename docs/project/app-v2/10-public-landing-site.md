# WAFL v2 Public Landing Site - 2.0.0-alpha.2

## Purpose

This document defines the public web role for the App-first WAFL v2 line.

`www.wafl.co.kr` is not the customer production workspace. It is the public WAFL app landing site.

Canonical public identity:

- Project: `PeaceByPiece`.
- Planned Company: `Sanjin Works`.
- Brand: `WAFL`.
- Website: `https://www.wafl.co.kr`.
- App Bundle Identifier: `com.wafl.app`.

The public site presents the WAFL brand. Project Name and Company Name do not determine or rename the Bundle Identifier. Native identifier, Apple account, and EAS policy are defined in `06-expo-environment-setup.md`.

## Public site role

The public site should introduce the WAFL app and guide visitors to the right next step.

Required public sections:

- App introduction.
- Download link area.
- Pricing.
- Example screens and examples of usage.
- Instagram CTA.
- Inquiry.
- Trial request.
- Waitlist request.

Before public launch, use safe pre-launch CTAs:

- 출시 준비 중.
- 체험 신청.
- 문의하기.
- 대기자 신청.

Do not expose public links for:

- TestFlight.
- Google Play Internal Testing.
- Expo dev build.
- internal tester builds.
- private QA URLs.

## Public content boundary

Public examples may use demo/mock content only.

Do not expose:

- real customer data,
- real vendor or factory data,
- real workorder/production-card data,
- business registration certificates,
- private attachments,
- generated PDFs,
- raw R2 URLs,
- object keys,
- signed URLs,
- internal account IDs,
- production tokens or secrets.

## App and web split

Expo React Native is the customer-facing app direction.

Next.js remains for:

- `www.wafl.co.kr` public landing,
- API and server-side integration,
- auth server flows,
- file/PDF/R2/Worker integration,
- internal development check routes,
- remaining legacy/admin surfaces during transition.

`/ui`, `/roadmap`, and `/functions` are localhost-only development check routes. They must not be exposed on production domains, Vercel preview domains, or `www.wafl.co.kr`.

`/system` and `/workspace` are long-term removal targets in the App-first product direction. They are not physically deleted in alpha.2. Later removal must follow:

1. App replacement of required duties.
2. Deprecated state.
3. Hidden or guarded state.
4. Final deletion in a separate approved work order.

## Implementation boundary

This document does not authorize:

- public landing implementation,
- production domain/DNS changes,
- production OAuth changes,
- API route changes,
- DB migration,
- R2/Worker mutation,
- PDF generation changes,
- real customer data exposure,
- route deletion.
