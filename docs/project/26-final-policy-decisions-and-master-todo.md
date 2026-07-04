# Final Policy Decisions and Master TODO

Version: 0.24.21.16  
Status: Canonical product-policy decision log and consolidated implementation backlog  
Scope: all product, billing, export, PDF, deletion, signup, catalog, operational, legal-review, and Codex implementation decisions confirmed through 2026-06-24

## 1. Canonical precedence

This document is the highest-priority pre-1.0 product-policy source. Earlier specifications remain useful implementation references, but any conflicting provisional language is superseded by this file and by later committed canonical decisions.

Each requirement is classified as:

- `CONFIRMED`: product policy decided by the owner.
- `IMPLEMENTED`: confirmed and present in the current codebase.
- `TODO`: confirmed but not fully implemented.
- `DEFERRED`: intentionally postponed until after Codex Sprint A or a later launch phase.
- `LEGAL_REVIEW`: operational direction confirmed, but current Korean law, tax, PG, processor, or privacy requirements must be rechecked before production launch.

## 2. Brand, domain, public entry, and support

- `CONFIRMED` Final brand: `WAFL`.
- `CONFIRMED` Primary public domain: `www.wafl.co.kr`.
- `CONFIRMED` Root `wafl.co.kr` redirects to `www.wafl.co.kr`.
- `CONFIRMED` Public website contains signup and login entry points; authenticated users enter the customer application and can access workorder/workspace screens according to permissions.
- `CONFIRMED` Primary CTA: `7일 무료로 시작하기`.
- `CONFIRMED` Public pricing shows final VAT-included payment amounts, not a smaller pre-VAT headline price.
- `CONFIRMED` Customer support channel: email plus in-app inquiry intake.
- `CONFIRMED` Inquiry states visible to customers: `접수`, `처리 중`, `답변 완료`. No separate `종료` state.
- `CONFIRMED` Inquiry response target: within one business day.
- `CONFIRMED` Serious incidents are announced by email and in-app notice.
- `CONFIRMED` No public chatbot at initial launch.
- `DEFERRED` Instagram handle candidate: `wafl.co.kr`; video format, cadence, public screenshots, and masking rules remain post-Sprint TODO.
- `DEFERRED` External analytics and cookie banner/consent remain launch TODOs and must be reviewed together before any non-essential tracking is added.

## 3. Pricing, plans, Trial, and storage add-on

### 3.1 Plans

- `CONFIRMED` Trial: 7 days, 100MB, 3 members, limited company-wide export.
- `CONFIRMED` Lite: KRW 9,900/month, VAT included, 500MB, 3 members, one company-wide export per month.
- `CONFIRMED` Flow: KRW 19,900/month, VAT included, 1.5GB, 10 members, three company-wide exports per month.
- `CONFIRMED` Studio: KRW 39,900/month, VAT included, 5GB, 30 members, ten company-wide exports per month.
- `CONFIRMED` Custom: negotiated.
- `CONFIRMED` Additional storage: KRW 7,000 per 1GB/month, VAT included.
- `CONFIRMED` Additional storage is a permanent add-on for customers who need more storage without additional members or plan features. It is not merely a temporary bridge to an upper plan.

### 3.2 Trial and card registration

- `CONFIRMED` The customer selects the intended paid plan during signup.
- `CONFIRMED` Card registration is mandatory during signup before Trial approval.
- `CONFIRMED` WAFL stores no raw card data; only PG-managed tokens/billing keys or equivalent payment references may be stored.
- `CONFIRMED` Trial begins at the exact moment the system administrator approves the signup.
- `CONFIRMED` Trial storage remains 100MB.
- `CONFIRMED` Billing notice emails are sent immediately after signup, three days before billing, and one day before billing.
- `CONFIRMED` The notices show today's charge as zero during Trial, the scheduled billing date, scheduled amount, selected plan, and cancellation method.
- `CONFIRMED` Cancellation during Trial leaves service available until Trial end.
- `CONFIRMED` If not canceled, the selected plan activates and the registered card is charged at Trial end.
- `CONFIRMED` There is no post-Trial read-only grace period for a normally completed Trial.
- `DEFERRED` PG/provider selection occurs after business registration.

### 3.3 Refund and plan changes

- `CONFIRMED` Ordinary mid-cycle cancellation does not produce a refund; service continues until the paid period ends and renewal is canceled.
- `CONFIRMED` No refund is granted merely because the customer did not use the service after payment.
- `CONFIRMED` Duplicate charges and system-caused erroneous charges are fully refunded.
- `CONFIRMED` Long WAFL-caused service outages are compensated primarily by extending the service period rather than refunding.
- `LEGAL_REVIEW` Mandatory statutory or PG refund rights override the product policy.
- `CONFIRMED` Upgrade: applies immediately; the remaining-period price difference is calculated and charged pro rata; the next renewal uses the new plan price.
- `CONFIRMED` Downgrade: applies immediately with a pro-rata refund of the remaining price difference, but only if current storage, member count, and other usage fit within the lower plan.
- `CONFIRMED` If lower-plan limits are exceeded, downgrade submission is blocked, the exact over-limit items are shown, and the current plan remains active until resolved.
- `CONFIRMED` Do not automatically deactivate members or delete files to force a downgrade.

## 4. System default catalog and size specification

### 4.1 Three-level category policy

- `CONFIRMED` Provide a broad three-level system catalog focused on apparel.
- `CONFIRMED` Core apparel categories are enabled by default for every new company.
- `CONFIRMED` Customers cannot rename or delete system categories.
- `CONFIRMED` Customers can enable or disable system categories and create their own custom categories.
- `CONFIRMED` No alias feature.
- `CONFIRMED` Underwear and accessories are included in the system catalog but disabled by default; customers may enable them when needed.

#### Underwear baseline — item-centered structure

- 브라 > 일반 > 풀컵, 하프컵, 노와이어
- 브라 > 기능성 > 스포츠, 수유, 보정
- 팬티 > 여성 > 삼각, 사각, 보정
- 팬티 > 남성 > 삼각, 드로즈, 트렁크
- 이너웨어 > 상의 > 캐미솔, 런닝, 발열상의
- 이너웨어 > 하의 > 내의하의, 속바지, 보정하의
- 잠옷 > 상의/하의/세트 > 세부 유형

#### Accessories baseline

- 가방 > 숄더/토트/기타 > 세부 유형
- 모자 > 캡/니트/기타 > 세부 유형
- 벨트 > 일반/장식 > 세부 유형
- 스카프·머플러 > 스카프/머플러 > 세부 유형
- 양말·레그웨어 > 양말/스타킹 > 세부 유형
- 주얼리 > 목걸이/귀걸이/팔찌/반지 > 세부 유형
- 기타 > 장갑/헤어 액세서리/키링/우산 > 세부 유형

### 4.2 Size and measurement model

- `CONFIRMED` System base size data is body-circumference based.
- `CONFIRMED` Pattern reference values may calculate one quarter of body circumference.
- `CONFIRMED` Workorder and final PDF size specs primarily use finished-garment flat measurements.
- `CONFIRMED` Length fields use actual length.
- `CONFIRMED` Measurement types: circumference, half-flat, quarter-pattern-reference, length.
- `CONFIRMED` Customers choose cm or inch.
- `CONFIRMED` Inch entry supports whole units plus 1/8, 1/4, 3/8, 1/2, 5/8, and 3/4.
- `CONFIRMED` Provide women 55/66/77, men 90/95/100/105, and XS/S/M/L/XL defaults in cm and inch.
- `CONFIRMED` Customers can load and edit defaults; system administrators maintain default systems and values.
- `CONFIRMED` PDF size tables include POM/measurement-position guidance.
- `CONFIRMED` Workorder size defaults are loaded from system-admin maintained reference data and copied into a workorder snapshot.
- `CONFIRMED` Later changes to system reference size data do not silently change existing workorders.
- `CONFIRMED` Inch entry UX should be whole-number plus 1/8-fraction selection and must be usable on PC, tablet, and mobile.

## 5. Signup, verification, approval, and business registration

- `CONFIRMED` Email verification is mandatory.
- `CONFIRMED` Phone verification is not used.
- `CONFIRMED` Business registration certificate is required in production signup, but not forced during current dev/test work.
- `CONFIRMED` One customer-admin email belongs to only one company.
- `CONFIRMED` Signup approval is performed by one system administrator; no mandatory dual approval.
- `CONFIRMED` Approval target: within one business day.
- `CONFIRMED` Signup includes business registration number and certificate image.
- `CONFIRMED` The business registration number is validated through an external API, and the result is displayed to the system administrator.
- `CONFIRMED` The system administrator manually compares the API result, entered company data, and uploaded certificate.
- `CONFIRMED` API failure does not prevent manual review.
- `CONFIRMED` If validation fails or entered information does not match the certificate, the administrator may reject or send a correction request email.
- `CONFIRMED` A correction request has a three-day deadline. If not completed by the deadline, the request is automatically rejected.
- `CONFIRMED` Correction request is sent once for that review cycle; there is no repeated reminder loop.
- `CONFIRMED` Business certificate access is limited to the dedicated approval viewer and cannot be downloaded by the system administrator.
- `CONFIRMED` General workorders, customer attachments, partner/factory/material details, and PDFs remain inaccessible to the system administrator.
- `CONFIRMED` The certificate is retained while the company is active and is deleted with customer data after termination plus the 30-day recovery period.
- `LEGAL_REVIEW` Validate the certificate retention basis, processor disclosure, and access-log requirements before launch.
- `CONFIRMED` Rejected/canceled initial requests create no service account; uploaded certificate files are deleted after 30 days; minimal request/rejection records remain for 90 days, then are deleted.
- `CONFIRMED` A returning applicant who already submitted a signup application sees the current application state, not the new application form again.
- `CONFIRMED` Returning applicant states include draft, review pending, under review, revision requested, approved, rejected, and cancelled.
- `CONFIRMED` Signup terms/privacy viewers reuse the canonical policy viewer and the same policy document/version/effective-date source used by settings/admin policy views.
- `CONFIRMED` Free-trial expiration alone does not require full terms/privacy re-consent; paid conversion uses separate paid-plan and recurring-payment confirmation.

## 6. Payment failure and service restrictions

- `CONFIRMED` Retry milestones: payment day, day 3, day 7, day 14, day 21, day 30, adapted only as required by the PG's billing mechanism.
- `CONFIRMED` Day 0 normal service plus failure email.
- `CONFIRMED` Day 3 retry plus warning.
- `CONFIRMED` Day 7 restriction begins.
- `CONFIRMED` Day 30 final failure terminates the account, followed by a 30-day view/export/recovery period.
- `CONFIRMED` At 100% storage, existing data may be viewed and existing text content may be edited.
- `CONFIRMED` At 100% storage, deletion, attachment deletion, trash emptying, and permanent purge remain allowed so the customer can free space.
- `CONFIRMED` At 100% storage, block new workorder creation, reorder, new uploads, attachment replacement, drawing edits that create a new file, PDF regeneration, and workflow transitions such as review request, review completion, purchase request, and purchase completion.
- `CONFIRMED` Stage changes that may create documents or new stored artifacts remain blocked until usage is below the limit or capacity is increased.

## 7. Company-wide Export

- `CONFIRMED` Everyday workorder/PDF download is not an Export and is never counted against the plan's company-wide Export allowance.
- `CONFIRMED` Company-wide Export means a comprehensive backup of customer-owned data.
- `CONFIRMED` Export package contains:
  - CSV tables for Excel-friendly review.
  - JSON data preserving structured relationships for migration or restoration.
  - Original attachments.
  - Current final workorder PDFs and relevant supplier/order PDFs.
  - Folder-structured ZIP output.
- `CONFIRMED` Export includes necessary business records, but not every detailed event log.
- `CONFIRMED` History may include actor names, but excludes actor email addresses, deleted-item history, and detailed personal-information history.
- `CONFIRMED` Export is generated asynchronously on the server.
- `CONFIRMED` Completion email contains no attachment; it provides a login-required download link.
- `CONFIRMED` Download link expires after seven days.
- `CONFIRMED` The generated ZIP is deleted immediately when the link expires. A later request creates a new package.
- `CONFIRMED` Large exports are split into ZIP parts of at most 500MB each.
- `CONFIRMED` Export allowance is consumed only after successful generation; failed jobs do not consume a count.
- `CONFIRMED` During the 30-day post-termination period, one final company-wide Export is guaranteed outside the plan's normal monthly allowance.
- `TODO` Define export-job schema, status, encryption/checksum, signed-link delivery, retry, partial failure, and R2 lifecycle.

## 8. PDF policy

- `CONFIRMED` Workorder PDFs may be incomplete or final.
- `CONFIRMED` Incomplete PDF shows all three: a prominent `미완성` watermark, status badge, and missing-item list.
- `CONFIRMED` Only the latest final PDF file is kept.
- `CONFIRMED` Previous PDF files and their generation timestamp, actor, revision, replacement, or superseded metadata are not retained.
- `CONFIRMED` If PDF generation fails and a previous valid PDF exists, keep serving the previous valid PDF.
- `CONFIRMED` Show generation failure status and a customer retry action.
- `CONFIRMED` Notify the operator immediately on the first PDF generation failure.
- `CONFIRMED` If no fabric/accessory orders exist, final workorder PDF may be generated immediately.
- `CONFIRMED` If related orders exist, final workorder PDF may be generated only after all related purchase orders reach ordering completion.
- `CONFIRMED` Supplier purchase-order PDF is generated at purchase request.
- `CONFIRMED` No separate actual-result PDF.
- `CONFIRMED` Page 1 contains basic information, design, and memo/data summary; later pages contain size specs and details, including POM guidance.
- `CONFIRMED` Factory-delivery workorder PDF is a production-execution document and excludes internal cost fields: unit price, amount, labor cost, loss cost, total cost, and margin.
- `CONFIRMED` Factory-delivery workorder PDF includes representative design image, factory instructions, fabric/accessory production information, and additional process information.
- `CONFIRMED` Fabric and accessory rows in factory-delivery PDF show production information such as type/item/options, quantity, unit, and note, not cost information.
- `CONFIRMED` Additional process rows in factory-delivery PDF show process name, description, and note, not process cost.
- `CONFIRMED` Incomplete and final workorder PDFs use the same canonical template; only status, watermark, and missing-item display differ.
- `CONFIRMED` Generated incomplete/final workorder PDFs appear in the workorder generated-document/attachment area.
- `CONFIRMED` Workorder size/POM PDF pages must render Korean display names from system reference data where available.
- `TODO` Select one canonical production renderer and remove or production-block legacy fallbacks after verification.

## 9. Account termination, recovery, and automatic deletion

- `CONFIRMED` Normal termination and nonpayment termination provide 30 days of view, Export, and recovery.
- `CONFIRMED` The customer may cancel termination at any time during that period and is restored immediately without operator approval.
- `CONFIRMED` A nonpayment-terminated customer is restored immediately if payment is completed during the 30-day period.
- `CONFIRMED` Recovery ends at 00:00 KST on the 30th day after the termination date.
- `CONFIRMED` A final deletion-warning email is sent one day before deletion.
- `CONFIRMED` Automatic customer-data deletion is ON by default from launch.
- `CONFIRMED` At the deletion time, legally retained evidence is separated and customer content/personal data is deleted immediately without an additional grace period.
- `CONFIRMED` If automatic deletion fails, retry every hour.
- `CONFIRMED` Notify the operator as a critical incident on the first deletion failure.
- `CONFIRMED` Send deletion-completion email after successful deletion.
- `CONFIRMED` Delete company data, user personal data, business certificate, workorders, purchase orders, partners/factories/materials/processes, attachments, images, PDFs, customer categories/settings, customer-specific activity logs, and identifiable customer statistics.
- `CONFIRMED` Retain only legally required transaction/tax evidence and fully anonymized aggregate service statistics.
- `LEGAL_REVIEW` Revalidate all retention periods and the exact KST deadline calculation before launch.

## 10. Log, privacy, and system-administrator access

- `CONFIRMED` General error logs: 90 days.
- `CONFIRMED` Security/access logs: 1 year.
- `CONFIRMED` Payment/refund/account-termination/deletion logs: 5 years.
- `CONFIRMED` Inquiry/dispute records: 3 years.
- `CONFIRMED` Fully anonymized aggregate statistics: no fixed expiry.
- `CONFIRMED` Retained logs remove direct identifiers and tenant mappings after deletion and may keep only non-reversible references.
- `CONFIRMED` Do not log workorder text, memo, file/PDF bodies, detailed partner data, secrets, tokens, passwords, or card data.
- `CONFIRMED` Customers receive outcome notices rather than raw operational logs.
- `TODO` Centralize structured logging, allowed metadata, correlation IDs, redaction, retention class, and operator alerts.

## 11. Workorder URL and sharing

- `CONFIRMED` No screen sharing, share buttons, anonymous links, or internal share links.
- `CONFIRMED` Browser workorder URLs use a stable opaque URL identifier separate from the DB technical primary key.
- `CONFIRMED` Every request requires login, tenant membership, and resource permission.
- `CONFIRMED` Copying a URL never grants access.
- `CONFIRMED` The opaque ID is deleted with the workorder at permanent deletion.

## 12. Runtime, deployment, and operational ownership

- `CONFIRMED` Before 1.0, `master` remains the single development/QA branch.
- `CONFIRMED` The current Vercel URL remains the dev/QA deployment.
- `CONFIRMED` After Codex implementation, create a separate production Vercel project for `www.wafl.co.kr`.
- `CONFIRMED` Production and dev/test use separate DB, R2, secrets, and environment variables.
- `CONFIRMED` One GitHub repository is sufficient.
- `CONFIRMED` Final incident/security-response owner: WAFL operator, with vendor escalation to Vercel, Cloudflare, PG, email, domain, or other providers as appropriate.
- `TODO` Add monitoring for Vercel deploy, API 5xx, DB, R2, email, payment webhook, PDF generation, deletion jobs, and reconciliation mismatches.
- `TODO` Define backup/restore, RPO/RTO, and run a restoration exercise before launch.

## 13. Implementation status and Master TODO

### 13.1 Integrated Codex execution plan

- `docs/project/31-pre-codex-integrated-master-plan.md` is the active implementation sequence.
- 0.24.22 begins with DB Foundation and authority alignment, not UI-first implementation.
- Source Architecture Cleanup follows before WAFL UI Foundation.
- Authorization/routing, signup, catalog/size, PDF/R2, Export, deletion/quota, PG billing, and launch hardening follow in dependency order.
- Every Sprint has migration, test, stop, commit/push, and Vercel QA boundaries.

### 13.2 Confirmed implementation queue

1. System catalog, sizes, underwear/accessory disabled defaults, provisioning, seed, dry-run backfill.
2. Public signup, email verification, certificate/API/manual review, correction deadline, one-day approval target.
3. Plan selection, card setup, Trial, scheduled notices, payment retry, upgrade/downgrade proration, refund exceptions.
4. Company-wide Export job, split ZIP, seven-day signed access, expiry deletion, final termination Export.
5. Opaque workorder URL and tenant/permission regression tests.
6. Incomplete/final workorder PDF, supplier PDF, latest-only retention, first-failure alert, R2 lifecycle.
7. Termination recovery, auto-delete scheduler, hourly retry, first-failure critical alert, legal-record separation.
8. Public website, production Vercel, separate DB/R2/env, domain/DNS, email provider, PG.
9. Monitoring, operator queues, CI, E2E, accessibility, performance, device QA, backup/restore.
10. Repository cleanup: oversized files, duplicate services, dead routes/components, mock/fallback production paths, deprecated PDF Worker candidates, docs consistency.

### 13.3 Deferred TODO

- `DEFERRED` External analytics selection.
- `DEFERRED` Cookie banner and non-essential tracking consent.
- `DEFERRED` Instagram video/content strategy and final public screenshots.
- `DEFERRED` Exact PG/provider selection until business registration.

## 14. Legal and production-launch review gate

Before public launch, verify against current law and actual provider contracts:

- automatic billing disclosures and cancellation UX;
- refund exceptions and proration behavior;
- privacy collection basis and consent separation;
- business certificate purpose, access, retention, and deletion;
- processing outsourcing and international transfers for Vercel, Cloudflare, Google, email, and PG;
- statutory record retention;
- cookie/analytics requirements if added;
- privacy officer/contact information;
- terms, privacy policy, billing/refund policy, storage/deletion policy, and actual runtime behavior consistency.

## 15. DB and safety boundary

- `docs/project/27-database-schema-query-permission-audit.md` and `docs/project/28-database-source-of-truth-safe-migration-design.md` remain the DB audit basis.
- DB read-only menus 30–32 are the pre-implementation verification gate.
- Schema, migration, seed, backfill, production DB/R2, PG, secret, and destructive actions remain separately approved work.
- No DB migration in 0.24.21.16.


## 13. Workspace and system operations dashboard policy

- `CONFIRMED` Customer workspace main dashboard prioritizes operational work queues and recent workorders over subscription/storage detail.
- `CONFIRMED` The large standalone `PLAN AND STORAGE` block is removed from the main dashboard or compacted into a small summary; detailed management belongs in subscription/settings/file screens.
- `CONFIRMED` Tablet landscape, mobile, desktop, and iPad layouts must be verified for the compact workspace dashboard.
- `CONFIRMED` `/system/signup-applications` primary actions are approve, request revision, reject, and more; manual review-start is not a primary CTA.
- `CONFIRMED` `/system/companies` is not deleted; it remains approved-customer operations, while `/system/signup-applications` remains pre-approval review.
- `CONFIRMED` `/system` combines confirmation-needed counts, signup review, trial/billing/storage risk, plan distribution, and customer operations into a compact dashboard.
- `TODO` Implement the 0.24.34.5 continuation sequence recorded in `docs/project/33-workorder-pdf-size-dashboard-finalization.md` before starting 0.24.35 unless the owner explicitly re-prioritizes.



## 0.24.34.6 Route-level screen gap audit update

Status: `CONFIRMED_AUDIT`
Scope: documentation and roadmap alignment before `0.24.35`.

The following audit documents are canonical TODO references for remaining pre-export work:

- `docs/audits/0.24.34.6-system-admin-screen-gap-audit.md`
- `docs/audits/0.24.34.6-customer-workspace-screen-gap-audit.md`

Confirmed implications:

- `0.24.35 — Company-wide Export Execution` must not start until the `0.24.34.5` continuation split is clearly staged against these audits.
- `/system/companies` is not deleted. It remains approved-customer operations management.
- `/system/signup-applications` remains pre-approval review and must be simplified around approve, revision request, reject, and more-menu actions.
- `/system` must consolidate attention-needed, signup review, Trial, storage-risk, plan distribution, and customer operations into a compact operator dashboard.
- Customer `/workspace` main must remove or collapse the large `PLAN AND STORAGE` block and prioritize work queues and recent workorders.
- Factory-delivery workorder PDFs must use the confirmed table-style production document policy: no internal costs, representative design image, factory instruction memo, production materials/process information, and Korean size page when applicable.
- System size/POM standards must supply Korean display names and snapshot-based workorder size specs.
- Same Google returning-applicant signup flow must restore the existing application state instead of showing the business-information form again.

This update is an audit and planning record. It does not mark the route-level work as implemented.


## 99. 0.24.34.6 Codex Prompt Documents and Continuation Order

Status: `CONFIRMED`

Before `0.24.35 — Company-wide Export Execution` starts, the remaining `0.24.34.5` implementation must be executed through the prepared prompt documents. These prompt documents are canonical operational instructions and are linked from current-state and productization roadmap.

Prompt order:

- `docs/codex-prompts/0.24.34.5-continuation-a-workorder-pdf-template.md`
- `docs/codex-prompts/0.24.34.5-continuation-b-size-standards-ui.md`
- `docs/codex-prompts/0.24.34.5-continuation-c-live-workorder-runtime.md`
- `docs/codex-prompts/0.24.34.5-continuation-d-signup-return-policy-modal.md`
- `docs/codex-prompts/0.24.34.5-continuation-e-dashboard-system-admin.md`
- `docs/codex-prompts/0.24.34.5-final-review-and-commit.md`

Rules:

- Execute one continuation at a time.
- Continuation A must settle the factory-delivery workorder PDF template before final PDF visual review.
- Continuation B must settle system size standards and measurement UI usability before size/PDF completion is claimed.
- Continuation C must verify real dev/test workorder selection, factory save, generated-document attachment refresh, and PDF viewer behavior.
- Continuation D must verify the returning signup applicant flow and shared policy viewer/consent evidence.
- Continuation E must clean up the customer dashboard, system-admin dashboard, signup review UX, and company operations route roles.
- Final review and commit must not run until owner visual review and required evidence are complete.
- `0.24.35` remains blocked until this sequence is either completed or explicitly re-scoped by the owner.
