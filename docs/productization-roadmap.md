# Productization Roadmap Authority

> Active baseline: `0.24.29`. Current implementation candidate: `0.24.29` Integrated Productization Checkpoint.
> Structured canonical source: `lib/internal/roadmap/`.
> Runtime roadmap index: `lib/internal/roadmap/index.ts`.

## Status

- Roadmap checkpoint version: `0.24.29`
- APP_VERSION: `0.24.29`
- Feature implementation progress: about `95%`
- Productization readiness: about `88%`
- Current-state handoff: `docs/codex-current-state.md`
- System-admin screen: `/roadmap`
- Manual QA status: `PENDING_USER_QA`
- Current planning policy: before 1.0, `master` remains the single development/QA branch and Vercel deployment is used for real-device QA.

## Active Sprint Sequence

1. `0.24.22` - DB Foundation and Authority Alignment
2. `0.24.23` - Source Architecture Cleanup
3. `0.24.24` - WAFL UI Foundation
4. `0.24.24.1` - Simulator Attachment/R2 Lifecycle Integration
5. `0.24.25` - Authorization, Runtime Boundary, and Opaque Routing
6. `0.24.25.1` - /id-control Read-only Account List Regression Fix
7. `0.24.25.2` - /id-control Production QA Impersonation Allowlist
8. `0.24.25.3` - /id-control Runtime-independent System-admin Impersonation
9. `0.24.25.4` - Policy Mismatch Correction for System-admin Boundary, Certificate Viewer, and Trial
10. `0.24.26` - Public Signup, Verification, Approval, and Trial
11. `0.24.27` - System Catalog, Sizes, and POM
12. `0.24.28` - PDF and R2 Lifecycle
13. `0.24.29` - Integrated Productization Checkpoint
14. `0.24.30` - Storage Capacity Profiles
15. `0.24.31` - PG Billing and Subscription Operations

## 0.24.29 - Integrated Productization Checkpoint

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.29.ts`.
- This checkpoint verifies the integrated flow from public signup to system-admin review, approval provisioning, new-company catalog, workspace access, workorder PDF generation, inline viewer, and PDF/R2 lifecycle regression.
- It is not a Company-wide Export sprint. The older 0.24.29 export label is superseded by the user-confirmed checkpoint scope.
- Manual QA checklist: `docs/qa/0.24.29-integrated-productization-checkpoint.md`.
- Production DB/R2/Worker mutation, new DB migration, storage capacity enforcement, PG/billing, notification sending, Kakao sending, dashboard redesign, and `/workers` density redesign remain excluded.

## Completed Foundation

### 0.24.26 - Public Signup, Verification, Approval, and Trial

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.26.ts`.
- Signup schema, repository/API/session foundation, Google email_verified handling, pending guard, public signup UI, consent evidence, certificate R2 integration, system-admin review, approval provisioning, Trial 7 days/100MB/3 members, and guarded dev/test approval provisioning integration are complete for the committed foundation scope.

### 0.24.27 - System Catalog, Sizes, and POM

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.27.ts`.
- System catalog schema, apparel defaults, underwear/accessory default-inactive entries, size set, POM foundation, company activation rows, company-admin activation UI/API, signup approval provisioning linkage, and guarded dev/test provisioning integration are complete.
- Existing companies are not automatically changed by migration or background backfill.

### 0.24.28 - PDF and R2 Lifecycle

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.28.ts`.
- Canonical PDF model, field visibility, due-date guard, canonical PDF R2 key, Worker 0.13.71 policy, server proxy inline viewer, lifecycle integration, reconciliation, exact cleanup, and residual DB/R2 0 evidence are complete.

## Next Version

### 0.24.30 - Storage Capacity Profiles

- Planned scope: usage profiles 0%, <1%, 10%, 20%, 30%, 50%, 70%, 90%, 99%, 100%, 110%, Trial 100MB linkage, plan limits, upload enforcement, quota race, warning, grace, termination, deletion, apply/verify/restore, and H/I/J fixture mismatch cleanup.
- 0.24.30 must not be started inside the 0.24.29 checkpoint.
