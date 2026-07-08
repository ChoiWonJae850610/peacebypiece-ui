# WAFL v2 App Architecture - 2.0.0-alpha.1

## Platform split

Expo React Native is the customer-facing app target.

Next.js remains active for:

- public marketing/download/pricing/examples landing site at `www.wafl.co.kr`,
- operations,
- API and server-side integration,
- file/PDF/R2/Worker integration,
- `/ui`, `/roadmap`, and `/functions` localhost-only development check routes,
- documents and test console.

`/system` and `/workspace` remain in the repository during transition, but they are long-term removal targets for the App-first product direction. Do not physically delete them until a separate work order completes replacement, deprecation, hidden/guarded state, and final removal.

## Infrastructure baseline

The App-first line preserves the existing infrastructure direction:

- Neon DB remains the metadata and business-state source of truth.
- Cloudflare R2 remains object storage.
- PDF generation and file access remain controlled by app/API/Worker flow.
- R2 raw URLs and object keys must not be exposed to normal users or external recipients.
- Upload, delete, view, restore, purge, and PDF flows must stay behind WAFL-controlled permission and event boundaries.

## Permission model

The app must use action-code based permission decisions.

Do not implement behavior by direct role-name branching.

Preferred shape:

```ts
can(user, "sheet.update", sheet)
can(user, "pdf.share", sheet)
can(user, "file.upload", sheet)
```

User-facing Korean roles remain:

- 시스템관리자
- 고객사 관리자
- 디자이너
- 재고관리

## Audit and safety

The App-first architecture must preserve:

- event and audit logging,
- tenant isolation,
- production guards,
- dev/test seed guards,
- destructive action confirmations,
- controlled support/impersonation boundaries.

## Future Expo choices

The `2.0.0-alpha.2` skeleton chooses:

- Expo Router.
- Expo SDK 55.
- `apps/mobile` as a standalone app folder, not a root workspace.

The following remain candidates for later phases:

- EAS Build.
- development builds for native auth/camera/file features.
- App Store and Google Play testing flows.

This architecture checkpoint still does not authorize DB migration, API route changes, R2/Worker mutation, real upload, real PDF generation, native auth, or production app-store deployment.
