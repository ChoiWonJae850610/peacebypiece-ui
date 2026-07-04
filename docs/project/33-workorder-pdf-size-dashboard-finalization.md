# 33. Workorder PDF, Size, Signup, and Dashboard Finalization Policy

Status: `CONFIRMED`
Target version: `0.24.34.5 continuation`
Boundary: this work must finish before `0.24.35 — Company-wide Export Execution` starts.

## 1. Purpose

This document records the owner-confirmed policy and execution order for the remaining `0.24.34.5` work. It converts the latest owner feedback into canonical scope before Codex implementation resumes.

The goal is to prevent implementation drift from fixture-only tests or temporary PDF layouts, and to keep the next implementation work split into small, verifiable continuations.

## 2. Factory-delivery workorder PDF policy

The factory-delivery workorder PDF is a production-execution document, not an internal costing document.

Confirmed included fields:

- workorder title and status,
- factory name,
- due date,
- order quantity,
- product/basic classification information needed by the factory,
- representative design image,
- factory instruction memo,
- fabric information limited to type/item/options, quantity, unit, and note,
- accessory information limited to type/item/options, quantity, unit, and note,
- additional process information limited to process name, description, and note,
- size specification pages only when measurement values or a selected size template exist.

Confirmed excluded from factory-delivery PDF:

- fabric unit price and amount,
- accessory unit price and amount,
- outsourcing/process price and amount,
- internal labor cost,
- loss cost,
- internal total cost,
- margin,
- any internal cost summary not needed for factory production.

The existing table-style document layout must be reused as the base. The temporary `serverWorkorderPdf.ts` style that shows English `Size specification` and technical/internal explanatory copy is not the final product PDF style.

The canonical source candidates to reuse or refactor are:

- `lib/workorder/presentation/orderRequestDocumentPrint.ts`,
- `lib/generated-documents/order-request/orderRequestHtmlDocument.ts`,
- `lib/generated-documents/order-request/orderRequestRepresentativeImage.ts`,
- `lib/workorder/serverOrderRequestPdf.ts`.

The workorder PDF implementation must keep the workorder PDF and supplier/order-request PDF as distinct document types. Layout primitives may be reused, but supplier-specific wording and supplier purchase-order semantics must not leak into the factory-delivery workorder PDF.

## 3. Incomplete and final PDF policy

Incomplete and final workorder PDFs use the same canonical template.

Incomplete PDF differences:

- shows `미완성 작업지시서`,
- shows a light `미완성` watermark,
- may show a compact missing-item notice,
- still renders all currently saved production information,
- may be generated for internal/factory draft review when allowed by current workflow policy.

Final PDF differences:

- shows `최종 작업지시서` or the confirmed factory-delivery label,
- does not show the incomplete watermark,
- does not show the missing-item notice,
- uses the final generated snapshot,
- remains the latest-only representative final PDF under the existing retention policy.

Generated incomplete and final PDFs must appear in the workorder attachment/generated-document area after generation. Generated documents should be visually separated from user-uploaded attachments, for example as `생성 문서` and `첨부파일`.

## 4. PDF page structure

Page 1 must use the table-style production layout:

- top basic workorder information,
- representative design image block,
- factory instruction memo block,
- fabric table,
- accessory table,
- additional process table,
- compact empty states for missing optional sections.

Size pages are appended only when size data exists or a size template has been selected for the workorder.

Size pages must be Korean-first:

- `사이즈·치수표`,
- `측정 항목`,
- `측정 방법`,
- `단위`,
- Korean POM display names from system reference data where available,
- cm and inch notation must remain understandable in print.

English fallback POM labels may remain only in internal data; they must not be the default rendered PDF labels when Korean display names exist.

## 5. Size reference data policy

Workorder size specifications must be based on system-admin maintained reference data.

Confirmed policy:

- system administrators maintain product-category size defaults, size sets, POM definitions, and measurement values,
- workorders load the relevant default by product type/category, gender or size family when available,
- applying defaults copies them into a workorder snapshot,
- later system reference-data changes must not silently change existing workorders,
- workorder-level edits modify the workorder snapshot only,
- PDF output uses the workorder snapshot and Korean display names.

If the required system-admin management UI or schema is missing, implementation must report the exact missing piece and mark that part `DEFERRED`; it must not block the PDF layout repair, workorder runtime repair, or dashboard cleanup.

## 6. Size input UI policy

The size input UI must use canonical WAFL components and be verified by import path and rendered screenshots.

Requirements:

- no raw screen-local input grid that only looks similar to WAFL,
- use `ModalShell`, `WaflButton`, `WaflNumberInput`, `WaflSelect`, `WaflDataTable*`, and any canonical form-field helpers where applicable,
- create or refactor toward a dedicated `WaflMeasurementInput` or equivalent shared measurement control,
- cm mode uses a compact numeric input,
- inch mode uses whole number plus 1/8 fraction selection,
- PC view must reduce visual clutter for inch input,
- tablet and mobile must be usable without tiny repeated square fields,
- sticky first column / horizontal scroll or card-style row editing must be verified on desktop, tablet, and mobile.

The right-side workorder panel order remains:

1. design/representative image,
2. attachments/generated documents,
3. factory instructions,
4. size summary and size edit action.

## 7. Customer workspace dashboard policy

The customer workspace main dashboard must prioritize work.

The large standalone `PLAN AND STORAGE` block must be removed from the main dashboard or reduced to a compact summary. Plan, storage, and member-limit information remains available but should not dominate the main operational screen.

Confirmed direction:

- show plan/storage/member status as compact badges or a one-row summary,
- move detailed plan/storage management to settings/subscription/file screens,
- place work queues and recent workorders above subscription detail,
- avoid the tablet-landscape two-column side block shown in the current Galaxy Tab landscape capture,
- remove nested/internal scroll when the page itself should scroll,
- verify Galaxy Tab landscape, mobile, desktop, and iPad layouts.

## 8. Signup returning-applicant policy

A user who submitted a signup application must not see the company/business-information application form again when logging in with the same Google account.

Expected routing:

- no application: show new signup form,
- draft: continue draft,
- submitted: show review-pending screen,
- under review: show review-in-progress screen,
- needs revision: show revision request and resubmission path,
- approved: enter workspace,
- rejected: show rejection reason,
- cancelled: show cancellation state and allowed next action.

The lookup must consider provider subject, normalized email, applicant ID, latest valid application, and company/member link state. Duplicate submitted applications for the same applicant must be prevented.

## 9. Policy viewer and consent policy

Signup terms and privacy viewers must reuse the canonical policy viewer used by system/customer settings.

Requirements:

- same policy ID,
- same full policy content,
- version,
- effective date,
- document hash when available,
- canonical modal/sheet behavior,
- no signup-only hardcoded summary as the legal text.

A free-trial expiration alone must not trigger full terms/privacy re-consent. Paid conversion requires a separate explicit paid-plan/amount/billing-cycle/recurring-payment confirmation. Material terms changes or expanded personal-data processing may require re-consent by policy version.

## 10. System-admin UX policy

`/system/signup-applications` must be operationally simple.

Primary actions should be:

- approve,
- request revision,
- reject,
- more.

Manual `검토 시작` should not be a primary CTA. It may be recorded automatically on first detail view or moved to a lower-priority internal action.

Raw enum/internal English terms must not be rendered in operator-facing UI.

`/system/companies` must not be deleted. Its role is approved-customer operations, while `/system/signup-applications` remains pre-approval review.

`/system` must combine confirmation-needed counts, signup review, trial/billing/storage risk, plan distribution, and customer operations into a compact operational dashboard with search, filters, pagination/more, and responsive cards/tables.

## 11. Work sequence before 0.24.35

`0.24.34.5` must continue in smaller implementation segments:

A. PDF template replacement

- replace the temporary workorder PDF layout with the existing table-style production layout,
- remove internal cost fields from factory-delivery PDF,
- add representative image, factory instructions, fabric/accessory/process tables,
- add Korean size pages only when applicable,
- ensure generated PDFs appear in generated-document/attachment UI,
- render PDF page PNG evidence.

B. Size reference and input UI

- verify system reference-data linkage,
- fix Korean display names in PDF and UI,
- refactor measurement inputs toward canonical WAFL measurement controls,
- simplify inch input,
- verify desktop/tablet/mobile.

C. Live workorder runtime confirmation

- confirm existing workorder selection,
- confirm factory save and reload persistence,
- confirm PDF generation and viewer from real dev/test data,
- keep loading/error states separated.

D. Signup returning-applicant and policy viewer

- fix same-Google returning-applicant state routing,
- unify policy viewer,
- record consent version/hash only if the existing schema supports it; otherwise report additive schema need.

E. Dashboard/system UX

- compact the customer workspace dashboard,
- simplify system signup review,
- integrate `/system` dashboard summaries,
- keep `/system/companies` as approved-customer operations.

F. Final checkpoint

- generate evidence ZIP,
- user visual review,
- final fixes,
- then commit/push only after approval and final verification.

## 12. Completion criteria

Do not report `LEVEL_4_PRODUCT_VERIFIED` until all applicable user-visible items have live evidence and user review where required.

Minimum checkpoint evidence before user review:

- PDF page PNGs for incomplete/final workorder PDFs,
- screenshots of workorder detail, attachment/generated document area, size editor, and PDF viewer,
- screenshots of returning-applicant pending state,
- screenshots of policy viewer,
- screenshots of customer workspace dashboard in desktop/tablet/mobile,
- screenshots of system signup review and system dashboard,
- requirements matrix,
- console/network summary,
- source ZIP and matching repo-state,
- separate QA evidence ZIP outside `4. Newest`.
