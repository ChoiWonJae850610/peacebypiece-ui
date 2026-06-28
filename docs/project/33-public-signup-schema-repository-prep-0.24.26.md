# 0.24.26 Public Signup Schema/Repository Preparation

Status: implementation preparation only
Version baseline: 0.24.25.4
Scope: source inspection, schema/repository design, migration draft notes, and guard design
Explicitly not included: product UI implementation, OAuth callback changes, DB migration file creation, DB execution, DB/R2 mutation, Worker changes, card registration, payment-method readiness, payment-reference storage, catalog provisioning, size provisioning, POM provisioning

No DB/R2 mutation. DB migration file creation/execution: none.

## Canonical Inputs Checked

- `AGENTS.md`
- `docs/codex-current-state.md`
- `docs/productization-roadmap.md`
- `docs/productization-backlog.md`
- `docs/project/26-final-policy-decisions-and-master-todo.md`
- `docs/project/31-pre-codex-integrated-master-plan.md`
- `lib/internal/roadmap/roadmap-0.24.26.ts`

## Public Website Source Location

Existing source exists in the current repository:

- `app/(public)/page.tsx`: root public entry currently renders `WaflLoginPage`.
- `app/(public)/login/page.tsx`: login route also renders `WaflLoginPage`.
- `components/auth/WaflLoginPage.tsx`: current landing/login card and Google login CTA.
- `components/public/ATypePublicFrame.tsx`: reusable WAFL public frame.
- `app/api/auth/google/start/route.ts`: Google OAuth entry.
- `app/api/auth/google/callback/route.ts`: Google OAuth callback.
- `app/(public)/pending/page.tsx`: pending approval lookup page.
- `app/(public)/invite/company/[token]/page.tsx` and `app/(public)/invite/member/[token]/page.tsx`: existing invitation flows.

Conclusion: do not create a duplicate public website source. Extend the existing `app/(public)` route group and public frame. The current public website is login-first, not a complete marketing/pricing/signup site.

## Google OAuth And Email Verification

Current state:

- `lib/auth/googleOAuth.ts` fetches Google userinfo from `https://openidconnect.googleapis.com/v1/userinfo`.
- The payload type includes `email_verified?: boolean`.
- `fetchGoogleUserProfile()` currently validates `sub` and normalized lowercase `email`, but drops `email_verified` from the returned `GoogleUserProfile`.
- `app/api/auth/google/callback/route.ts` passes the profile to login/invitation repositories and creates the WAFL session only after an existing system/customer account is authenticated.
- Raw OAuth access tokens are not logged in the inspected callback path.

Required 0.24.26 implementation:

- Add `emailVerified: boolean` to the internal `GoogleUserProfile`.
- Require `email_verified === true` before login, signup, member invitation, or company invitation flows continue.
- Redirect false/missing values to a safe public error state such as `GOOGLE_EMAIL_NOT_VERIFIED`.
- Do not log raw OAuth token, raw profile JSON, cookie payload, or secrets.
- Do not add a separate custom email-token verification flow in this step.

## Current Schema Facts

- `users.company_id` is created `NOT NULL`; no later schema statement drops this constraint.
- `users` already has `email_verified boolean NOT NULL DEFAULT false`, `auth_provider`, `provider_user_id`, `display_name`, and `status`.
- `system_users` is separate from `users`.
- `companies` has `business_registration_number`, `requested_plan_code`, onboarding/subscription/trial compatibility columns, storage/member snapshot columns, and owner user linkage.
- `company_subscriptions` exists with Trial defaults: 100MB and 3 members.
- `company_members` exists and is the membership/role boundary.
- `invitations` supports `system_to_company_admin` and `company_to_member`; current company invitation is token/code based.
- `join_requests` supports `request_type` company/member and pending/approved/rejected/cancelled, but currently depends on invitation for creation.
- `company_files` supports `business_registration`, but requires `company_id`; it is suitable after company creation or after a placeholder company exists, not for a pure pre-company application unless linked through a new application/file table.
- `company_account_requests` is for existing-company account changes/deactivation, not public signup.
- `audit_logs` and system audit helpers exist.

## Model Options

### A. Extend `join_requests`

Pros:

- Existing approval/rejection and invitation flows already use it.
- Existing system-admin company approval has partial provisioning code.
- Existing pending page and route handlers can be reused with less UI work.

Cons:

- Current creation requires invitation token and invitation scope.
- Status set is too small for draft/submitted/reviewing/changes_requested/provisioning_failed.
- It lacks consent evidence, intended paid plan, business validation payload, correction deadline, and provisioning idempotency fields.
- Public signup would overload invitation-based member join semantics.

Risk: medium-high. Reuse as a compatibility/reference boundary, not the primary public signup application model.

### B. New `signup_applications` / `onboarding_applications` table

Pros:

- Matches final policy: pre-approval application/request record, no service account until approval.
- Keeps `users.company_id NOT NULL`.
- Cleanly separates public company signup from invitation-based member joins.
- Can model draft/submitted/reviewing/changes_requested/approved/rejected/canceled/provisioning_failed directly.
- Can hold Google identity evidence, business validation evidence, requested plan, correction deadline, review state, and provisioning idempotency.
- Easier rollback and retry because provisioning is linked to one immutable application id.

Cons:

- Requires migration and new repository/API/UI.
- Existing join request approval code must be factored or adapted instead of reused directly.

Risk: medium, but best aligned with policy and future PG/email/business API integration.

Recommendation: choose B.

### C. Make `users.company_id` nullable

Pros:

- Authenticated signup identity could be represented as a user row before approval.

Cons:

- Changes a core tenant boundary across many queries and guards.
- Existing workspace/session assumptions depend on company membership and company_id.
- Higher IDOR and accidental workspace exposure risk.
- Conflicts with the preferred policy direction to create users during approval transaction.

Risk: high.

Recommendation: do not choose C for 0.24.26.

## Migration Draft Notes

Do not create or execute the migration in this preparation step.

Minimum core migration:

1. `signup_applications`
   - `id text primary key default gen_random_uuid()::text`
   - `status text not null`
   - status check: `draft`, `submitted`, `reviewing`, `changes_requested`, `approved`, `rejected`, `canceled`, `provisioning_failed`
   - Google identity evidence: `google_sub`, `email`, `email_verified`, `google_picture_url`, `applicant_name`
   - normalized email: store lowercase; add `email_normalized` only if generated columns are avoided
   - company fields: `requested_company_name`, `business_name`, `business_registration_number`
   - commercial fields: `requested_plan_code`
   - no raw card data, fake payment placeholders, fake payment references, PG-neutral payment references, or payment readiness state
   - business validation: `business_validation_status`, `business_validation_payload jsonb`, `business_validation_checked_at`
   - correction: `correction_requested_at`, `correction_due_at`, `correction_reason`, `correction_count`
   - review: `reviewed_by_system_user_id`, `reviewed_at`, `rejection_reason`
   - provisioning: `provisioning_status`, `provisioning_started_at`, `provisioning_completed_at`, `provisioning_error_code`, `provisioning_attempt_count`, `created_company_id`, `created_user_id`, `created_company_member_id`, `created_subscription_id`
   - timestamps: `submitted_at`, `approved_at`, `rejected_at`, `canceled_at`, `created_at`, `updated_at`

Separate review before inclusion:

2. `signup_application_consents`
   - application id FK
   - policy document/version references or immutable policy keys/version labels
   - consent timestamp, IP/request metadata, and evidence hash if needed
   - first inspect whether existing `policy_documents`, `policy_versions`, and `policy_agreements` can be reused without a new table

3. `signup_application_files`
   - application id FK
   - `file_type = business_registration`
   - original name, storage key, mime type, size bytes
   - uploaded/deleted timestamps
   - review metadata
   - later approval links or copies metadata to `company_files` only after company creation
   - first inspect whether existing `company_onboarding_files` or `company_files` can be reused with safe application ownership; do not create a new file table if the existing file model can support approval-only ownership without creating an active company

Recommended indexes/constraints:

- unique active/pending normalized email for statuses not final-deleted: submitted/reviewing/changes_requested/approved/provisioning_failed as policy requires one customer-admin email per company.
- unique active/pending business registration number where not null and status is not rejected/canceled after retention policy allows new cycle.
- index status/created_at for system-admin review queue.
- index correction_due_at for auto reject.
- unique `created_company_id` where not null.
- unique `google_sub` among non-final active application states.
- FK `reviewed_by_system_user_id -> system_users(id)`.

Rollback strategy:

- Migration rollback drops the new application tables only before production data exists.
- After data exists, rollback must be additive/compatibility-based and preserve application records.
- Provisioning retry must be idempotent, so partial company/user/member/subscription ids are stored and reused.

Seed/full reset/simulator impact:

- `full_reset.sql` and smoke tests must include the new tables after migration approval.
- Simulator can add non-mutating fixture plans first, then dev/test signup application fixtures later.
- Existing invitation/member fixtures should remain separate.

## Approval Provisioning Design

Recommended transaction boundary:

1. Lock the application row by id with status in `submitted`, `reviewing`, or `changes_requested` after resubmission.
2. Verify `email_verified = true`, required certificate metadata or ownership link, business validation/manual review state, duplicate constraints, and requested plan.
3. Mark provisioning started and increment attempt count.
4. Create company with onboarding active only when all required records can be created.
5. Create first admin user using Google identity and normalized email.
6. Create approved `company_member` with company admin role template and permissions.
7. Create `company_subscriptions` row with Trial 7 days, 100MB, 3 members, and trial start equal to approval time.
8. Link/copy business certificate metadata to company/application ownership without exposing download.
9. Record catalog/size/POM provisioning as pending 0.24.27 follow-up if needed; do not create catalog, size, or POM rows in 0.24.26.
10. Create audit events for application approval, company creation, first admin member creation, Trial creation, and certificate review.
11. Schedule immediate signup notice plus future 3-day and 1-day billing notices as pending notification jobs or explicit outbox records.
12. Mark application `approved` and store created entity ids.

Idempotency:

- The application id is the idempotency key.
- Reuse stored created ids on retry.
- Use unique constraints on application-created company/user/member/subscription linkage.
- If any step fails after partial creation, set `provisioning_failed`, preserve created ids, and allow system-admin retry/repair.
- Re-running the same approved application must not create duplicate company, user, member, subscription, audit linkage, or business-certificate ownership rows.

## Pending Route/API Guard Design

Pre-approval identity may access:

- signup/application status
- submitted application details
- correction request details
- edit/resubmit during changes_requested
- cancel
- logout
- help/policy pages

Must be blocked:

- `/workspace`
- workorders
- files
- members
- company settings
- subscription
- other company resources
- direct workspace/admin API calls

Required guard layers:

- server page guard: pending application session redirects workspace to pending/status page
- route handler/API guard: workspace/admin APIs return common permission denied/not found state
- repository scope: all customer data queries require approved company membership and company id
- UI: hide workspace navigation until approval, but do not rely on UI alone

Current implementation already blocks users with no workspace role from workspace if no WAFL session exists, but it has no first-class signup application session yet.

## Existing Company Join Policy

- Do not implement public company search.
- Reuse invitation link/code flow.
- Current `invitations` and `join_requests` support `company_to_member` member requests.
- Customer admin/member approver path uses workspace guard and must stay separate from system-admin signup approval.
- `system_to_company_admin` invitation exists but should not become public self-service signup by itself.

## Trial Linkage

Current confirmed alignment:

- `COMPANY_TRIAL_DAYS = 7`
- `TRIAL_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024`
- `TRIAL_MEMBER_LIMIT = 3`
- `company_subscriptions` default storage/member values are 100MB/3.

Implementation requirement:

- Trial start timestamp must be the system-admin approval timestamp.
- Store the same window in `company_subscriptions` and compatibility company snapshot if the snapshot remains used.
- Normal Trial completion has no post-Trial read-only grace period per document 26.
- 0.24.30 storage enforcement must not be implemented in 0.24.26.

## Historical Token Cleanup Judgment

`docs/productization-roadmap.md` contains mojibake historical tokens. They are currently compatibility tokens: `tests/roadmap-development-contract.mjs` still asserts several historical strings and page labels. Removing them in this preparation step would be a broader documentation/contract cleanup and risks hiding historical compatibility assumptions.

Decision for this step: keep the historical token area unchanged. A future narrow cleanup can replace the contract fixture with normal UTF-8 titles after proving no `/roadmap` compatibility dependency remains.

## User Decisions Or Separate Approval Still Required

- Migration file creation and DB execution require separate approval.
- Rate-limit/CAPTCHA mechanism is a technical implementation selection to finalize before public signup launch.
- Existing public route group should be reused; no new public website source decision is needed unless another repository/source is later provided.
- PG provider selection, card registration, payment-method readiness, and PG-neutral payment reference storage remain deferred to 0.24.31.
