# Productization Roadmap Authority

> Active baseline: `0.24.30`. Current implementation candidate: `0.24.30` Storage Capacity Profiles.
> Structured canonical source: `lib/internal/roadmap/`.
> Runtime roadmap index: `lib/internal/roadmap/index.ts`.

## Status

- Roadmap checkpoint version: `0.24.30`
- APP_VERSION: `0.24.30`
- Feature implementation progress: about `94%`
- Productization readiness: about `86%`
- Current-state handoff: `docs/codex-current-state.md`
- System-admin screen: `/roadmap`
- Manual QA status: `PENDING_USER_QA`
- Current planning policy: before 1.0, `master` remains the single development/QA branch and Vercel deployment is used for real-device QA.

## Internal Access Boundary

- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`.
- `/id-control` test account switching is allowed for active allowlisted system-admin users and remains unrelated to destructive Seed/Reset/Cleanup operations.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- Regression contract: system-admin-internal-access.

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

## 0.24.30 - Storage Capacity Profiles

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.30.ts`.
- Trial remains 7 days, 100MB, 3 members.
- Lite, Flow, and Studio storage/member limits are synchronized to the final policy.
- Storage usage includes active attachments, recoverable trash, company files, onboarding files, and approved signup certificates that were not already promoted to company files.
- Growth paths are guarded before storage writes: workorder attachment upload request, attachment completion, and generated PDF storage.
- Usage data keeps actual percent separate from display-clamped percent for 0%-110% profile QA.
- DB migration, production mutation, Worker source change, and Worker deployment are not part of this version.

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

### 0.24.29 - Integrated Productization Checkpoint

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.29.ts`.
- The integrated signup, provisioning, catalog, workorder PDF, and PDF/R2 lifecycle checkpoint is complete.
- Manual QA checklist: `docs/qa/0.24.29-integrated-productization-checkpoint.md`.

## Next Version

### 0.24.31 - PG Billing and Subscription Operations

- Planned boundary: real PG provider integration, payment method registration, billing key/reference handling, subscription operation flow, and raw card data exclusion.
- Do not start 0.24.31 work inside the 0.24.30 storage capacity checkpoint.
