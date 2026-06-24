# Final Policy Decisions and Master TODO

Version: 0.24.21.9  
Status: Canonical product-policy decision log and consolidated implementation backlog  
Scope: decisions confirmed in the 2026-06-24 productization review, unresolved TODO, and repository-wide undeveloped product work

## 1. Canonical precedence

This document supersedes conflicting provisional language in earlier productization specs. Earlier documents remain implementation references, but when they conflict with this file, this file wins until a later committed decision replaces it.

## 2. Brand, domain, pricing, and public entry

- Final brand: `WAFL`.
- Primary public domain: `www.wafl.co.kr`.
- Root domain `wafl.co.kr` should redirect to `www.wafl.co.kr`.
- Public primary CTA: `7일 무료로 시작하기`.
- Public pricing uses final customer charge amounts including VAT.
- Lite: KRW 9,900/month, VAT included.
- Flow: KRW 19,900/month, VAT included.
- Studio: KRW 39,900/month, VAT included.
- Additional storage: KRW 7,000 per 1GB/month, VAT included.
- Do not market by showing a lower supply price with VAT added later.
- Customer support channel: email only.
- The app should provide a common inquiry entry and inquiry categories such as standards addition request, account change, feature suggestion, and other inquiry.
- No marketing email program. Email is used only for authentication, approval, billing, security, policy, incident, and operational notices.
- Instagram handle candidate: `wafl.co.kr`, subject to actual availability when the account is created.
- No public chatbot in the initial launch scope.

## 3. System default catalog and size specification

### 3.1 Product categories

- Provide a broad three-level system catalog focused on apparel, including common market forms under tops, bottoms, and outerwear.
- All new companies receive the system catalog enabled by default.
- Customers cannot delete or rename system categories.
- Customers can disable system categories.
- Customers can create and enable their own categories.
- No alias feature.
- Whether underwear and accessories belong in the default enabled catalog remains TODO.

### 3.2 Size and measurement model

- System base size data is body-circumference based.
- Pattern reference values may automatically calculate one quarter of body circumference.
- Workorder and final PDF size specs primarily store finished-garment flat measurements.
- Linear measurements such as body length, shoulder, and sleeve are stored as actual lengths.
- Each measurement item declares a type: circumference, half-flat, quarter-pattern-reference, or length.
- Customers select `cm` or `inch`.
- Inch input supports an integer part plus fraction options: `1/8`, `1/4`, `3/8`, `1/2`, `5/8`, `3/4`, and whole units.
- Provide women 55/66/77, men 90/95/100/105, and XS/S/M/L/XL base systems with editable default actual measurements.
- Provide both cm and inch defaults.
- Customers can load defaults and adjust ease and final measurements.
- System administrators can maintain and revise the default size systems and values.
- PDF size tables include measurement-position illustrations/POM guidance.

## 4. Signup, approval, Trial, billing, and cancellation

### 4.1 Signup and approval

- Email verification is mandatory before approval.
- Phone verification is not used.
- Business registration certificate is required in production signup, but not forced during the current test period.
- One customer-admin email belongs to only one company; one person cannot be customer administrator for multiple companies.
- Company signup approval is performed by one system administrator. No dual approval.
- Rejected or canceled initial signup requests do not create service accounts.
- Their uploaded business-registration files are deleted after 30 days.
- Minimal request records such as email, company name, and rejection reason are retained for 90 days, then deleted.

### 4.2 Trial and payment

- The user selects a paid plan at initial signup.
- Card registration is mandatory before the Trial begins.
- The Trial lasts seven days.
- Signup confirmation email is sent immediately and includes Trial length, selected plan, expected automatic billing date and amount, and cancellation method.
- If the user cancels during the Trial, access remains until the Trial end date.
- Unless canceled, the selected plan activates after seven days and the registered card is charged automatically.
- There is no separate read-only grace period after a normally completed Trial.
- Payment provider/PG selection is deferred until business registration is completed.

### 4.3 Payment failure

- Payment day: one attempt, normal use continues, failure email sent.
- Day 3: retry and warning.
- Day 7: retry; block new file upload and new workorder creation while allowing view, export, and payment-method update.
- Day 14: retry.
- Day 21: retry.
- Day 30: final retry, then terminate the account if still unpaid.
- After termination, allow view and export for 30 additional days.
- After those 30 days, the account becomes eligible for permanent deletion.
- Actual retry orchestration may use the PG provider's supported billing mechanism while preserving these business milestones.

## 5. Account termination, retention, deletion, and logs

### 5.1 Customer data lifecycle

- Normal termination and nonpayment termination both allow 30 days of view/export after account termination.
- After 30 days, permanently delete customer content and personal identifiers.
- Delete: company account, user personal information, business registration data, workorders, purchase orders, partner/factory/material/process data, attachments, images, PDFs, customer-created categories/settings, customer-specific activity logs, and identifiable customer-level statistics.
- Retain only legally required transaction/tax evidence and fully anonymized aggregate service statistics.

### 5.2 Deletion operation

- Provide automatic deletion capability with default setting `OFF`.
- System-admin UI must show deletion candidates, termination date, elapsed days, scheduled deletion date, manual delete action, and automatic deletion ON/OFF.
- Send a deletion-complete email after successful deletion.

### 5.3 Legal/operational retention baseline

- Books and tax evidence: 5 years.
- Payment and refund transaction records: 5 years.
- Tax invoice and receipt issue records: 5 years.
- Customer inquiry and dispute records: 3 years.
- Security/access logs: 1 year.
- Deletion execution logs: 5 years.
- General application error logs: 90 days.
- Fully anonymized aggregate statistics: no fixed expiration.
- Revalidate these periods against current Korean law, tax advice, and the actual business model before public launch.

### 5.4 Log privacy

- System administrators cannot view customer content.
- Keep enough non-content metadata to diagnose incidents: error code, timestamp, feature/screen/API path, internal company reference, app version, browser/device/OS, request status, processing stage, file size/type, storage state, and billing state.
- Do not log workorder contents, memo contents, image/attachment/PDF bodies, detailed partner data, secrets, tokens, card data, or passwords.
- On customer deletion, remove direct identifiers and customer mapping tables from retained logs.
- Retained logs may keep only non-reversible hashes or random references that cannot be used to re-identify the customer.
- Customers do not receive raw operational logs. Notify only customer-impacting outcomes such as payment success/failure, retry schedule, account termination/deletion schedule, deletion completion, major incidents, and security anomalies.

## 6. Workorder URL and sharing

- Do not add screen sharing, share buttons, or shared links.
- Workorders are delivered as complete or incomplete PDF files.
- Browser workorder URLs use a stable opaque URL identifier.
- The URL identifier is not an access grant.
- Every request requires login, tenant membership, and resource permission checks.
- Copying the URL to an unauthorized person must never expose the workorder.
- The URL identifier follows the workorder lifecycle and is deleted when the workorder is permanently deleted.

## 7. PDF policy

- Customers can generate and send incomplete or final workorder PDFs.
- Only the newest final workorder PDF is retained and available for view/download.
- Superseded final PDF versions are not retained.
- PDFs remain while the customer account and customer data remain, then are deleted with customer data after the termination retention period.
- If a workorder has no fabric/accessory orders, the final workorder PDF may be generated immediately.
- If it has fabric/accessory orders, the final workorder PDF may be generated only after all related purchase orders reach completed ordering status.
- Supplier purchase-order PDF is generated when the purchase order is requested.
- Do not create a separate actual-result/completion PDF.
- Page 1 contains basic information, design, and memo/data summary.
- Following pages contain size specifications and other details in tables, with measurement-position illustrations.

## 8. Runtime, deployment, and operations

- Before 1.0, keep `master` as the single development/QA branch.
- Keep the current Vercel URL as the development/QA deployment.
- After Codex implementation is completed, create a separate production Vercel project for `www.wafl.co.kr`.
- Production and development must use separate DB, R2, secrets, and environment variables.
- A separate GitHub repository is not required; one repository with separated deployments/environments is preferred.
- Final incident/security response owner: WAFL operator.
- Root-cause remediation may require coordination with Vercel, Cloudflare, PG, email, domain, or other vendors.

## 9. Consolidated implementation TODO

### A. Immediate Codex implementation queue

1. Sprint A Productization UI Foundation
   - PB-005 administrator screen WAFL commonization.
   - PB-006 `/worker`, `/workspace`, and administrator dashboard density cleanup.
   - PB-010 Functions pre-run environment/profile/safety/dry-run UX.
   - Storage cylindrical usage visualization.
   - Company representative-image/business-registration duplicate label cleanup.
   - Empty/loading/error/permission/responsive states.
2. System default catalog and size specification
   - Three-level apparel catalog.
   - Company enable/disable and customer-created category behavior.
   - Body/quarter/flat measurement model.
   - cm/inch fraction input.
   - Base size systems and system-admin editor.
   - Idempotent provisioning/seed and safe dry-run backfill.
3. Customer signup, consent, approval, Trial, and billing foundation
   - Email verification and one-company admin uniqueness.
   - Production business-registration requirement with test-mode exception.
   - Plan selection, mandatory card setup, seven-day Trial, automatic conversion.
   - Single-admin approval Queue and idempotent provisioning.
   - Rejected/canceled retention jobs.
   - Payment failure schedule and service restriction states.
4. Workorder opaque URL identifier
   - Stable URL ID and authorization on direct/refresh/back navigation.
   - Existing data backfill plan if a new DB column is needed.
   - No share-link implementation.
5. PDF/R2 productization
   - Incomplete/final workorder PDF renderer.
   - Supplier-order PDF at request time.
   - Latest-final-only replacement policy.
   - Private R2 lifecycle, quota reservation, signed download, trash/purge, and audit metadata.
   - Size-table and POM illustration layout.
6. Account termination and deletion operations
   - 30-day view/export mode.
   - Candidate queue, manual delete, auto-delete OFF default, notification email.
   - Customer-data deletion and legal-record separation.
   - Log anonymization and retention jobs.
7. Public website and commercial onboarding
   - WAFL brand, `www.wafl.co.kr`, pricing with VAT, additional-storage display.
   - Primary CTA `7일 무료로 시작하기`.
   - Email inquiry path, no chatbot, no marketing email.
   - Public policy pages and launch-safe wording.
8. Production separation and launch preparation
   - Separate Vercel production project.
   - Separate production DB/R2/environment variables.
   - Domain/DNS configuration.
   - Production email provider and PG integration after business registration.

### B. Repository-wide undeveloped or incomplete productization work

- PB-001 route/API permission meaning audit.
- PB-003 mock/demo/fallback removal from production paths.
- PB-004 integrated iPad mini, Galaxy Tab, mobile, and PC QA.
- PB-007 split very large screen/domain files.
- PB-008 expand common save-lock/toast/sequence/revision contracts.
- PB-009 public/signup/policy i18n cleanup.
- PB-011 R2 usage fixtures, cleanup preview, and reconciliation dry-run.
- PB-012 decide whether deprecated Cloudflare PDF Worker entrypoints can be removed.
- PB-013 reduce render scope of large catalog/settings/admin screens.
- PB-014 productization audit regression contracts.
- PB-016 production console/debug output policy and cleanup.
- Simulator DB seed/cleanup adapters and R2 upload/delete adapters.
- Functions/Simulator/PowerShell menu and report integration.
- Policy re-agreement end-to-end blocking and evidence verification.
- Company file upload/download/preview and business-registration review workflow.
- Billing, refund, tax invoice/receipt, payment-failure, and account-state operational screens.
- Public legal-document placeholders: business entity, representative, address, registration number, privacy officer, support email, PG/vendor names, effective dates.
- Performance, accessibility, responsive, permission, tenant-isolation, mutation, and release regression validation.
- Repository cleanup: generated artifacts, package-manager policy, oversized files, dead code, docs canonical/archive consistency, deprecated worker candidates.
- Final consolidated manual QA and pre-customer launch checklist.

### C. Deferred decision/TODO list

- Include underwear in the default enabled system catalog.
- Include accessories in the default enabled system catalog.
- Select the PG/payment provider after business registration.
- Confirm Instagram account availability and define video format, cadence, and content plan after product completion.
- Select public screenshots and promotional content after product completion.
- Decide whether external analytics is needed.
- If non-essential tracking is introduced, determine cookie-consent/banner requirements.

## 10. Implementation order after 0.24.21.9

- Next code version: `0.24.22`.
- Start with Sprint A Productization UI Foundation.
- After Codex implementation and validation, proceed through the dependency order in section 9 rather than treating all TODOs as parallel work.
- Any schema, migration, production DB/R2, PG, secret, or destructive deletion execution still requires the existing explicit safety boundary.

## 11. DB Migration

None in 0.24.21.9. Future implementation items may require schema/migration approval.
