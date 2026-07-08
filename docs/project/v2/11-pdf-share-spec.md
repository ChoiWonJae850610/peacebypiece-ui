# WAFL v2 PDF / Share Spec - 0.30.0-alpha.7

## Purpose

This document defines the first WAFL v2 PDF/share baseline before implementation.

It is a design contract, not an implementation instruction. It does not authorize DB migration, API rewrites, R2 mutation, share-link creation in production, UI route changes, or package changes.

## Core rule

PDF/share is not a secondary export feature.

In WAFL v2, PDF/share is one of the main ways a WAFL Sheet becomes usable in the field.

```text
WAFL Sheet
-> PDF snapshot
-> share link / KakaoTalk message
-> view/download by external recipient
-> read/expiry/event tracking
```

The PDF must feel like the natural output of the Sheet, not a disconnected report generated from a hidden template.

## 0.30.0-alpha.26 output/share mock correction

The `/ui` showroom correction clarifies that PDF/share uses the current Sheet snapshot, including representative image and attachment inclusion state.

Planning rules:

- The representative image shown in the Sheet header should be the same image referenced by output/share preview.
- If a Sheet has no representative image, the output/share preview must show a clear no-image state instead of implying a hidden fallback upload.
- Attachments are separate assets. Only attachments marked as included in production documents should be listed in the output/share inclusion summary.
- Real upload/delete, R2 object mutation, PDF generation, and share-link creation remain out of scope for the `/ui` alpha.26 showroom.
- The alpha.26 output/share surface is a mock contract for later PDF snapshot behavior, not a Worker/API implementation.

## 0.30.0-alpha.27 output/share attachment and delivery-row correction

The `/ui` showroom correction moves production-document attachment choice into the output/share context.

Planning rules:

- Included attachments for a production document should be selected in the output/share tab, not in the image/attachment management tab.
- The output/share tab may show selected attachments as removable chips and open an attachment picker mock for selection changes.
- 작업지시서 and 공장 전달 작업지시서 rows can preview through row click/selection without a separate eye icon.
- The representative image should be shown as a thumbnail in output/share so the user sees what will be included in the document.
- Delivery-request rows should show compact origin/destination, item summary, and memo hint by default.
- Delivery-request detail should show the full item list and memo after row click in a panel, drawer, or bottom sheet.
- Mobile share/print/save actions for documents and delivery requests should be icon-only with accessible labels.
- Real file preview API calls, R2 mutation, delivery-request mutation, PDF generation, and share-link creation remain out of scope for the `/ui` alpha.27 showroom.

## Current infrastructure baseline

WAFL currently uses:

```text
Database:
- Neon PostgreSQL

Object storage:
- Cloudflare R2

Runtime/deployment:
- Next.js App Router
- Vercel
```

PDF/share v2 planning assumes:

- PDF snapshots are represented in Neon metadata tables.
- Generated PDF files are stored in R2.
- Representative image, sketch, attachment, and generated PDF files are R2 objects.
- Share links are stored in Neon and point to controlled viewer/download routes.
- No production share link or R2 object may be created by this document alone.

## Worker-controlled storage baseline

R2 must not be described as if the browser or user-facing app directly owns file upload/delete/view behavior.

Current repository baseline:

```text
cloudflare/r2-upload-worker.js
- active R2 upload/download/delete Worker baseline
- mediates signed/authorized PUT, GET, DELETE style access according to existing policy

cloudflare/pdf-generator-worker/
- current PDF Generator Worker deployment baseline
- uses the Worker package/Wrangler folder as the active deployment source

cloudflare/pdf-generator-worker.js
- deprecated/reference single-file PDF Worker entrypoint
- not the new deployment baseline unless a future audit changes that decision
```

Planning rule:

```text
User/browser
-> WAFL app/API or Worker-controlled request
-> permission check and company scope check
-> Neon metadata update
-> R2 object write/read/delete through controlled gateway
-> event/audit record
```

Do not expose raw R2 URLs, bucket names, object keys, signed URLs, upload secrets, Worker secrets, or internal tokens to normal users or external recipients.

Implementation may later choose a combination of Next.js API routes and Cloudflare Workers, but the business rule is fixed: R2 is a backend storage layer behind WAFL-controlled access.

## PDF lifecycle classes

WAFL v2 must distinguish PDF lifecycle classes. This is separate from the PDF type such as 작업지시서 PDF or 공장전달 PDF.

```text
임시 PDF(temporary_preview)
- generated for preview while the Sheet is still being edited
- not an official external delivery artifact by default
- may have short retention
- may be automatically cleaned up
- should not be treated as final business evidence

검토용 PDF(review)
- generated for internal review before external share
- can be downloaded internally if permission allows
- not external by default

공유용 PDF(shared_snapshot)
- generated or selected for external share
- connected to share link metadata
- must create event/audit records
- must not be silently overwritten

최종 PDF(final_snapshot)
- official retained version for field delivery, dispute prevention, or history
- stored as a PDF snapshot
- retained according to customer/storage policy
- regeneration creates a new version/snapshot

폐기/만료 PDF(revoked_or_expired)
- no longer active for external access
- underlying object retention or purge follows storage policy
```

A user may generate many 임시 PDFs while editing. That must not produce many official final documents. A PDF becomes a stronger business artifact when it is shared externally, marked final, or tied to a retained snapshot.

Recommended metadata addition:

```text
pdf_snapshots.lifecycle_kind
- temporary_preview
- review
- shared_snapshot
- final_snapshot
- revoked_or_expired
```

## Korean-first language rule

User-facing labels should be Korean first.

Internal code may stay English for stability.

Examples:

```text
작업지시서 PDF(workorder_pdf)
발주요청 PDF(order_request_pdf)
공장전달 PDF(factory_instruction_pdf)
공유 링크(share_link)
만료됨(expired)
열람됨(viewed)
```

The UI may show `PDF` because that is already a field-understood term.

## PDF types

### 1. WAFL 작업지시서 PDF

Purpose:

- Full Sheet output.
- Used as the main garment production document.
- Can include image, sketch, base info, size/color, fabric, accessory, factory/process, memo, and summary.

Recommended Korean label:

```text
WAFL 작업지시서 PDF
```

Internal code:

```text
workorder_pdf
```

Primary users:

- 고객사 관리자
- 디자이너
- 시스템관리자 only for support/operation context

External recipients:

- Factory, supplier, or partner through controlled link.

### 2. 발주요청 PDF

Purpose:

- Material/accessory-specific order request.
- Should be generated from Sheet card context, not from a separate order screen as the main flow.

Recommended Korean label:

```text
발주요청 PDF
```

Internal code:

```text
order_request_pdf
```

Primary card sources:

- 원단 카드
- 부자재 카드

### 3. 공장전달 PDF

Purpose:

- Factory-facing production instruction.
- Should include only the information needed by the factory, not necessarily full cost or internal admin data.

Recommended Korean label:

```text
공장전달 PDF
```

Internal code:

```text
factory_instruction_pdf
```

Primary card sources:

- 공장 카드
- 공정 카드
- 이미지/스케치 카드
- 사이즈/컬러 정보

### 4. 내부 보관 PDF snapshot

Purpose:

- Snapshot of what was shared or generated at a specific time.
- Used for audit, history, and dispute prevention.

Recommended Korean label:

```text
PDF 스냅샷
```

Internal code:

```text
pdf_snapshot
```

## Snapshot principle

WAFL v2 must distinguish the live Sheet from a generated PDF snapshot.

```text
Live Sheet:
- current editable data

PDF snapshot:
- generated output at a specific time
- should not silently change after sharing
```

Required snapshot metadata:

```text
pdf_snapshots
- id
- company_id
- product_id
- sheet_id
- snapshot_type
- snapshot_version
- source_data_hash
- r2_object_key
- file_name
- file_size_bytes
- generated_by_membership_id
- generated_at
- expires_at nullable
- revoked_at nullable
- status
```

Recommended snapshot status:

```text
생성중(generating)
임시생성됨(temporary_generated)
검토용(review_ready)
공유됨(shared)
최종보관(finalized)
생성실패(failed)
폐기됨(revoked)
만료됨(expired)
```

## Share-link principle

A share link is not a raw R2 URL.

Required rule:

```text
외부 공유는 WAFL controlled route를 통해 제공한다.
R2 object key, bucket name, signed URL, internal token은 화면/메시지에 노출하지 않는다.
```

Share-link metadata:

```text
share_links
- id
- company_id
- product_id
- sheet_id
- pdf_snapshot_id nullable
- card_id nullable
- recipient_type
- recipient_name nullable
- recipient_contact nullable
- channel
- token_hash
- expires_at
- revoked_at nullable
- first_viewed_at nullable
- last_viewed_at nullable
- view_count
- created_by_membership_id
- created_at
- status
```

Recommended share-link status:

```text
활성(active)
열람됨(viewed)
만료됨(expired)
폐기됨(revoked)
```

Recommended channel codes:

```text
kakao
link_copy
download
email_later
```

`email_later` is a future placeholder. Do not implement email sending unless explicitly planned.

## KakaoTalk sharing

WAFL should support KakaoTalk-friendly sharing, but v2 alpha should not assume full Kakao API integration.

Recommended staged plan:

```text
Stage 1:
- Generate PDF snapshot.
- Generate controlled share link.
- Copy message text.
- User pastes into KakaoTalk manually.

Stage 2:
- Improve mobile share sheet behavior where browser/device allows it.

Stage 3:
- Consider Kakao API integration only after product flow is stable.
```

Recommended message shape:

```text
[WAFL] {제품명} 작업지시서
- 수량: {수량}
- 납기: {납기 또는 미입력}
- 상태: {상태}
- 보기: {controlled_share_link}
```

Do not include secrets, raw R2 URLs, internal IDs, or long unfiltered memo text in the message body.

## Access and permission rules

PDF/share actions must use action codes.

Required action-code examples:

```text
pdf.generate
pdf.regenerate
pdf.view
pdf.download
pdf.share
pdf.revoke_share
pdf.view_history
```

Default planning permissions:

```text
시스템관리자(system_admin)
- support/operation context only
- can inspect metadata/audit where allowed by production guard
- should not casually create customer business PDFs

고객사 관리자(customer_admin)
- can generate, regenerate, download, share, revoke, and view share history for company Sheets

디자이너(designer)
- can generate/download/share depending on company setting
- default: can generate and request/share if customer admin allows it

재고관리(inventory_manager)
- can view/download relevant PDFs needed for inbound/inspection
- default: cannot create external share links unless customer admin allows it
```

External recipients are not login roles in alpha.

They are controlled-link viewers.

## Assistant behavior

The Assistant should summarize whether a Sheet is share-ready.

Readiness levels:

```text
공유 가능(ready)
- required information exists
- no blocking issue

확인 필요(confirm_required)
- some non-blocking information is missing
- user can still share after confirmation

차단(blocked)
- required recipient, file, permission, or security requirement is missing
```

Examples:

```text
원단 단가가 없습니다. 그래도 발주요청 PDF를 만들까요?
-> confirm_required

공장 거래처가 없습니다. 공장전달 PDF를 만들 수 없습니다.
-> blocked

대표 이미지가 없습니다. 작업지시서 PDF는 만들 수 있지만 현장 전달력이 떨어질 수 있습니다.
-> warning / confirm_required

공유 링크 만료일이 없습니다. 기본 7일 만료로 생성합니다.
-> info / default behavior
```

## Data visibility rules

PDFs must not leak internal-only data.

Recommended visibility scopes:

```text
full_internal
- customer admin / permitted internal users
- can include cost if allowed

factory_external
- factory recipient
- no internal margin/profit information
- only production-relevant instructions

supplier_external
- fabric/accessory supplier recipient
- only order-relevant item, quantity, delivery, contact, memo

inventory_internal
- 재고관리 role
- inbound/inspection quantity and relevant item details
```

Cost visibility must follow `cost.view`.

Do not include cost fields in external PDFs unless a later explicit policy allows it.

## Worker/R2 access rule

R2 object keys are backend implementation details. Normal screens and external links should never show them.

Required access principle:

```text
Upload: WAFL app/API -> signed/authorized Worker/API flow -> R2
View/download: WAFL controlled route -> permission/share check -> Worker/API-backed object access
Delete: WAFL app/API -> permission/storage policy check -> Worker/API delete or trash flow
Restore: WAFL app/API -> metadata/object policy check -> controlled restore flow
Purge: system/admin guarded flow only, never casual user action
```

The current active Worker baseline for R2 upload/download/delete is `cloudflare/r2-upload-worker.js`. Any v2 implementation must inspect and reconcile that Worker before changing storage behavior.

The current PDF Generator Worker baseline is `cloudflare/pdf-generator-worker/`. Generated PDF bytes may be produced through that Worker and then stored through the controlled R2 path, depending on implementation design.

## R2 object-key rule

R2 object keys should remain tenant-scoped and non-guessable.

Recommended conceptual shape:

```text
companies/{company_id}/sheets/{sheet_id}/pdf/{snapshot_id}.pdf
companies/{company_id}/products/{product_id}/images/{file_id}
companies/{company_id}/sheets/{sheet_id}/attachments/{file_id}
```

This is a conceptual planning shape only. It must be reconciled with the existing R2 policy document before implementation.

## Event/audit rules

PDF/share actions must create events.

Recommended events:

```text
pdf.generated
pdf.generation_failed
pdf.regenerated
pdf.downloaded
pdf.shared
pdf.share_viewed
pdf.share_expired
pdf.share_revoked
```

Event data should include:

```text
- actor membership id
- company id
- product id
- sheet id
- card id if relevant
- snapshot id if relevant
- share link id if relevant
- action code
- timestamp
- safe recipient metadata
```

Do not log raw token values.

## Screen behavior

### Sheet-level PDF/share card

The Sheet should have a PDF/share card or Assistant section with:

```text
- 작업지시서 PDF 생성
- 발주요청 PDF 생성
- 공장전달 PDF 생성
- 공유 링크 만들기
- 카톡용 문구 복사
- 최근 공유 이력
- 만료/폐기 상태
```

### Card-level action

Material/accessory/factory cards can expose PDF/share actions in context:

```text
원단 카드:
- 발주요청 PDF
- 거래처에 공유

부자재 카드:
- 발주요청 PDF
- 거래처에 공유

공장 카드:
- 공장전달 PDF
- 공장에 공유
```

### Mobile behavior

Mobile should prioritize quick sharing:

```text
1. Sheet open
2. Assistant says PDF/share is available or needs confirmation
3. User taps 공유
4. Selects PDF type
5. Confirms missing/risk info if needed
6. Link/message is created
7. User copies or uses device share sheet
```

## Version and regeneration rules

A generated PDF should have a clear version relationship.

Recommended rule:

```text
If the Sheet changes after PDF generation, show:
"Sheet가 PDF 생성 후 변경되었습니다."
```

Available actions:

```text
- 기존 PDF 보기
- 새 PDF 다시 생성
- 변경사항 비교는 later
```

Do not silently overwrite an already-shared PDF snapshot.

Regeneration should create a new snapshot. For temporary preview PDFs, implementation may replace or clean up temporary artifacts if metadata and events make it clear they were not external/final business records.

## Failure rules

PDF generation failure must be visible and recoverable.

Examples:

```text
- 이미지 로딩 실패
- R2 Worker/API upload 실패
- PDF renderer 실패
- 권한 없음
- share link 생성 실패
```

Required user-facing response:

```text
PDF 생성에 실패했습니다.
다시 시도하거나, 문제가 계속되면 시스템관리자에게 문의하세요.
```

Internal logs should include enough metadata for support without exposing secrets.

## Do / Don't

### Do

- Treat PDF/share as part of the Sheet workflow.
- Store generated PDFs as snapshots.
- Use controlled share links.
- Use Korean-first labels.
- Keep R2 and Worker access details hidden from users.
- Track generation/share/view/revoke events.
- Let Assistant warn/confirm/block by risk.

### Don't

- Do not expose raw R2 URLs.
- Do not silently mutate shared PDF snapshots.
- Do not include internal cost fields in external PDFs by default.
- Do not force a full form completion before every PDF.
- Do not bypass the Worker/API-controlled storage path with direct raw R2 access.
- Do not build Kakao API integration before the basic share-link workflow is stable.
- Do not let external recipients become full app roles during alpha unless explicitly decided.

## Alpha implementation boundary

This document authorizes only planning.

For implementation, create a later Codex work order with:

```text
- allowed files
- DB migration scope
- API route scope
- R2 scope
- permission action-code updates
- tests
- production guard
- rollback plan
```

Until then, no DB migration, R2 mutation, API behavior change, or production share behavior change is allowed.

## 0.30.0-alpha.18 user-facing current PDF correction

The internal data model may still keep snapshot/version concepts, but user-facing Sheet screens should be organized around the current PDF.

User-facing rules:

- Use "현재 PDF" as the primary label.
- Use "PDF 보기", "공유", and "다운로드" as the primary actions.
- Do not rely on "snapshot", "STEP", "preview mock", or temporary/review/final button splits in normal Sheet content.
- Interpret the current PDF by Sheet status:
  - 초안/작성중: 미완성 PDF
  - 발주 가능: 발주용 PDF
  - 공장 전달/제작중: 제작중 PDF
  - 완료: 완성 PDF
- The PDF/share tab should show included information such as product, fabric, accessory, factory, delivery address, and supplier contacts.
- Share should be represented as a simple share action or icon-centered control, while still remaining a WAFL-controlled link concept in future implementation.

PDF purpose rules:

- 작업지시 PDF focuses on product and production information.
- 공장 전달용 PDF focuses on factory, process, fabric/accessory use, and production request information.
- 퀵 전달용 PDF focuses on delivery address, recipient factory/supplier, material/accessory list, quantity, contact, and delivery memo.
- These purposes should feel selected by Sheet status and delivery target. Do not turn them into a confusing set of unrelated buttons.

This section is a screen/spec correction only. It does not authorize PDF generation, share-link creation, API route changes, R2 mutation, Worker changes, DB migration, or production behavior changes.

## 0.30.0-alpha.20 PDF-friendly screen structure

The `/ui` Sheet screen should be easy to map to a future PDF without visually becoming a PDF generator.

User-facing rules:

- Continue to use "현재 PDF", "PDF 보기", "공유", and "다운로드".
- Do not reintroduce snapshot/STEP/developer-preview wording in the working Sheet UI.
- Represent the current PDF as a Sheet output state, not as several unrelated cards.
- Use row/list/definition structures for product summary, included information, delivery data, supplier contacts, and PDF purpose.
- The screen can show a PDF-friendly layout, but it must not call a real PDF Worker, write R2 objects, generate real share links, or mutate database state.
- A future PDF renderer should be able to consume the same Sheet sections: product, fabric, accessory, process/factory, delivery, memo, and current PDF status.

## 0.30.0-alpha.21 document names and quick delivery request wording

The user-facing output/share screen should use business document names first. PDF remains the technical output format behind view/share/print actions.

User-facing document names:

```text
작업지시서
공장 전달 작업지시서
퀵 전달 메모
```

Rules:

- Do not repeat `PDF` in every document title.
- Use short actions: `보기`, `공유`, `인쇄`, and optionally `저장`.
- It is acceptable that view/share/print produces or uses a PDF later, but the title should read like a business document, not a file format list.
- Quick delivery memo is connected to a delivery-request flow.
- A delivery request should include origin, destination, selected items, contact information, and delivery memo.
- One delivery request should represent one origin and one destination. When several suppliers are involved, show several delivery request groups.
- This `/ui` correction is mock-only. It does not create real PDF files, share links, delivery requests, R2 objects, Worker calls, API mutations, or database records.

## 0.30.0-alpha.22 output/share row-action simplification

The output/share section should avoid duplicate global actions when each document or delivery-request row already has its own action controls.

User-facing rules:

- Do not place a generic top-level `보기`, `공유`, `인쇄` button group above the document rows when the same actions appear on rows.
- `작업지시서` and `공장 전달 작업지시서` rows may each expose their own view/share/print actions.
- A quick delivery memo should be understood as part of a delivery request, not as an independent default document row.
- Delivery-request rows should include origin, destination, selected items, delivery memo, and row-level share/print/save actions.
- A delivery request still means one origin and one destination. Multiple origins imply multiple request rows.
- This `/ui` correction is mock-only. It does not create real PDF files, share links, delivery requests, R2 objects, Worker calls, API mutations, or database records.

## 0.30.0-alpha.23 output/share simplification follow-up

The output/share tab should stay compact after the production card moves to fixed work regions.

User-facing rules:

- The default output/share tab should show only the main business rows: `작업지시서`, `공장 전달 작업지시서`, and `배송요청서 만들기`.
- Do not repeat factory name, fabric supplier, accessory supplier, or contact tables in the output/share tab when those details already belong to production/process or delivery-request rows.
- `배송요청 추가하기` is a mock creation entry point. Delivery-request rows still expose `공유`, `인쇄`, and `저장` row actions.
- No top-level duplicate detail/view/share/print action group should be added above the rows.
- This `/ui` correction is mock-only. It does not create real PDF files, share links, delivery requests, R2 objects, Worker calls, API mutations, or database records.

## 0.30.0-alpha.24 output/share retained compact behavior

The output/share tab remains compact after the overview and action grammar correction.

User-facing rules:

- Keep `작업지시서`, `공장 전달 작업지시서`, `배송요청서 만들기`, and `배송요청 추가하기` as the visible business-document flow.
- Do not re-add overview shortcut buttons for output/share.
- Do not re-add duplicate output/share status rows to the overview summary.
- Delivery-request rows continue to own `공유`, `인쇄`, and `저장` actions.
- This `/ui` correction is mock-only. It does not create real PDF files, share links, delivery requests, R2 objects, Worker calls, API mutations, or database records.

## 0.30.0-alpha.25 output/share inclusion clarification

The output/share tab should make the future document scope obvious without becoming a real PDF generator in `/ui`.

User-facing rules:

- `작업지시서` and `공장 전달 작업지시서` may state that they include representative image, size/color, fabric/accessory rows, process/factory rows, and memo data.
- Representative-image selection in the image/attachment section should be reflected in the output/share mock.
- Size/color information should be described as document content, not as a separate file or hidden admin setting.
- Confirmation-first order/delete flows do not create final documents, share links, or order PDFs.
- Keep row-level `보기`, `공유`, `인쇄`, and `저장` actions mock-only.
- This `/ui` correction is mock-only. It does not create real PDF files, share links, delivery requests, R2 objects, Worker calls, API mutations, or database records.
