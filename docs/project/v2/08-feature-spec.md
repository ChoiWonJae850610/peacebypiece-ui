# WAFL v2 Feature Spec - Role and Workflow Baseline - 0.30.0-alpha.2

## Purpose

This document defines the second WAFL v2 GPT-side design baseline: user roles, role behavior, and core workflow scenarios.

It is not a database schema and not an implementation instruction. Permission action codes, status definitions, and DB tables will be formalized in later v2 documents.

## 0.30.0-alpha.26 image asset, representative image, attachment inclusion, and summary feature direction

The production-card feature direction should treat images and attachments as Sheet assets with different business meaning.

Feature principles:

- A Sheet can have many image assets, including uploaded image, camera photo, sketch result, and reference image types.
- Representative image selection is stateful: the first image can become representative when none exists; deleting the representative image should fall back to the first remaining image; deleting the last image leaves no representative image.
- Attachments are not representative images. They can be previewed and marked for inclusion in production documents.
- Output/share should read the current representative image and included-attachment state from the Sheet, not from a separate document-only form.
- Fabric/accessory order request and completion are row-level state transitions and should live near the row status/action cluster.
- Overview 제작 요약 should separate cost structure into 한벌 단가, 총 예상, 원단 총액, 부자재 총액, and 공정 총액.
- 로스/여유 cost is included through order quantity times unit price; the main Sheet should not show a separate loss-cost accounting line unless a future accounting feature explicitly requires it.
- Inch size entry can use a helper for integer plus common apparel fractions without adding a real size-management API in this prototype.
- This `/ui` correction does not add persistence, real upload/delete, camera capture, image editing/drawing, order mutation, share-link creation, PDF generation, R2/Worker integration, or API integration.

## 0.30.0-alpha.27 compressed image list, output attachment picker, and delivery-request feature direction

The feature direction should separate visual picking from document composition.

Feature principles:

- Image/photo/sketch/reference results are managed in the image list.
- Representative image selection happens in the image list through a crown selector.
- The default image list should be thumbnail-first and should not require reading filenames to choose a representative image.
- Attachment files are not representative images.
- Production-document attachment inclusion should be selected in output/share, where the user is composing the document snapshot.
- Output/share can show selected attachments and allow removing them from the included list.
- 작업지시서 and 공장 전달 작업지시서 can use row selection for preview instead of a separate preview icon.
- Delivery requests should show compressed rows by default and reveal origin, destination, full items, and memo in a detail drawer, panel, or bottom sheet.
- This `/ui` correction does not add persistence, real upload/delete, file preview API, camera capture, image editing/drawing, delivery-request mutation, share-link creation, PDF generation, R2/Worker integration, or API integration.

## 0.30.0-alpha.20 Sheet data as input/order/PDF document flow

The Sheet feature direction should support both editing and review without forcing the screen into many small cards.

Feature principles:

- Fabric/accessory/process data may be numerous, but the Sheet should expose summary plus row/list entry points first.
- A section card can represent many rows. One item does not need one large card on desktop/tablet.
- Input, order-readiness, and current PDF output should share the same Sheet data shape in the prototype.
- PDF-friendly structure means the same labels and values can later feed a generated PDF without copying a separate form.
- Detail editing can happen in drawer, side panel, bottom sheet, or full-screen sheet by device size.
- This `/ui` correction does not add real persistence, order mutation, share-link creation, PDF generation, basis-data management, or API integration.

## 0.30.0-alpha.21 ordering allowance and delivery-request feature direction

Fabric/accessory ordering must reflect real garment-production quantity handling.

Feature principles:

- Order quantity can be explained as `required quantity + loss/allowance quantity - stock used`, with optional over-order handling.
- The UI should show required quantity, loss/allowance, stock used, order quantity, leftover/over-order quantity, and handling meaning.
- Over-order handling may be represented as factory allowance, loss included, leftover converted to stock, or all used in current production.
- Stock use and leftover stock conversion are planning states in the `/ui` showroom. This patch does not implement inventory movement creation.
- Unit and process catalogs can retain internal standard/company ownership, but the working screen can present one unified selector with a small origin label.
- Fabric/accessory order flow and quick delivery request flow should feel connected inside the production card.
- A delivery request should group selected items with one origin, one destination, contact information, and delivery memo. Multiple origins should create multiple request groups.
- This `/ui` correction does not add real delivery-request persistence, real order mutation, inventory movement, share-link creation, PDF generation, or API integration.

## 0.30.0-alpha.22 simplified default flow and factory/process direction

The production-card default view should show the workflow before the helper tools.

Feature principles:

- Fabric and accessory default views center on item confirmation, quantity calculation, and order request readiness.
- Assistive features such as previous-record copy, stock import/reference, supplier history, and input-source selection belong inside editor/drawer flows.
- Accessory category grouping is useful metadata, but the item row remains the primary operating surface.
- Delivery request creation should group one origin, one destination, multiple items, and delivery memo. A delivery memo is not a separate default document row.
- If multiple origins are needed, the UI should imply multiple delivery-request groups.
- Factory/process work is easiest to understand as representative production factory plus additional process rows.
- Sewing is normally the representative production-factory work. Special sewing can still be represented as an additional process when it uses a separate partner or cost line.
- This `/ui` correction does not add persistence, real delivery requests, process/unit catalog mutation, order mutation, inventory movement, share-link creation, PDF generation, or API integration.

## 0.30.0-alpha.23 fixed work hub and reduced action surface

The production-card feature direction should scale to many items without making every section fully expanded or action-heavy.

Feature principles:

- PC/tablet users should be able to keep product navigation, the current production card, and Assistant visible as separate work regions.
- Tablet portrait and mobile should prioritize the active production-card section and reveal product selection or edit/detail surfaces only when needed.
- Material order state should narrow possible actions: orderable items can request order, requested items can be marked order-complete, and completed/received items are treated as locked/read-only in the main prototype.
- Delete remains a visible row action only for editable draft/orderable rows in the mock surface.
- Process management is represented as representative factory plus additional process rows; additional rows are reorderable/copyable/deletable but do not need workflow status badges in the main list.
- Output/share is a small set of business document and delivery-request rows, not a repeated contact/factory data dashboard.
- This `/ui` correction does not add persistence, real delivery requests, process/unit catalog mutation, order mutation, inventory movement, share-link creation, PDF generation, or API integration.

## 0.30.0-alpha.19 basis-data use in Sheet entry

Sheet entry should use existing basis information where possible while still allowing lightweight temporary input.

Feature principles:

- Fabric/accessory supplier names, units, and process names should prefer system basis data or company basis data when available.
- A customer administrator may later add company-specific units/processes or request a system-standard addition, but this `/ui` showroom patch does not implement those settings flows.
- Sheet input should support both basis selection and temporary input so a user can continue drafting when a standard is missing.
- Unit flows should distinguish base/system unit, company unit, and unit-add request.
- Process flows should distinguish base process, company process, process-add request, and temporary process input.
- Receiving, inbound, and inventory reflection belong to inventory/inbound flows and should not overload the basic designer Sheet input surface.

This is a feature-direction note only. It does not authorize DB migration, API route changes, system-admin settings changes, customer-admin settings changes, R2/Worker changes, or package changes.

## Role model principle

WAFL v2 may have human-readable roles, but implementation must not hardcode UI and API behavior by role name.

Planning roles describe default work patterns.

Implementation should use action codes:

```text
can(user, "sheet.update", sheet)
can(user, "fabric.order", sheet)
can(user, "inspection.update", sheet)
can(user, "pdf.share", sheet)
```

## Default planning roles

### Company owner / admin

Meaning:

- Company-level decision maker or manager.
- Can oversee all WAFL Sheets, members, settings, cost visibility, partner data, and workflow exceptions.

Primary actions:

- Create and manage Products/Styles and Sheets.
- Review incomplete or risky Sheets.
- Approve or correct order/share/production decisions when needed.
- Manage members and default permissions.
- View cost and production progress.
- Access company settings, catalogs, units, partners, and subscription/storage areas.

UI emphasis:

- Overview.
- Exceptions.
- Missing information.
- Cost and schedule risk.
- Member/permission management.

### Designer / product creator

Meaning:

- Creates and updates garment/product production content.
- Owns image/sketch, basic information, material intent, notes, and reorder initiation.

Primary actions:

- Create Product/Style.
- Create WAFL Sheet.
- Add or update image/sketch.
- Fill base information.
- Add fabric/accessory cards.
- Add notes and production intent.
- Generate draft PDF when allowed.
- Request order/share/production actions when allowed.
- Start reorder from existing Product/Style.

Default restrictions:

- Should not directly mutate inventory unless explicitly permitted.
- Should not manage company-wide member permissions by default.
- Cost visibility should be configurable by company policy.

UI emphasis:

- Fast creation.
- Visual Sheet editing.
- Missing information guidance.
- PDF/share draft preview.
- Reorder.

### Production manager

Meaning:

- Coordinates material readiness, factory assignment, process instructions, and production progress.

Primary actions:

- Review fabric/accessory readiness.
- Request or confirm material orders if allowed.
- Assign factory/process cards.
- Send factory instruction/PDF/share link.
- Update making/hold/issue states.
- Coordinate due date and schedule risk.

Default restrictions:

- Cost visibility should be configurable.
- Member/company settings access is not default.

UI emphasis:

- Ready-to-order status.
- Factory/process cards.
- Due date risk.
- Missing production information.
- Recent changes.

### Inbound / inspection manager

Meaning:

- Handles receiving, inspection, issue recording, and inventory reflection.

Primary actions:

- See Sheets ready for receiving/inspection.
- Update received quantity.
- Record defects/issues.
- Confirm inspection progress.
- Trigger or record inventory movement when allowed.
- Add inspection notes and photos if needed.

Default restrictions:

- Should not edit core design intent by default.
- Should not manage company settings by default.
- Cost visibility should be configurable.

UI emphasis:

- Quantity.
- Inspection status.
- Issues/defects.
- Received/done events.
- Recent changes.

### System admin

Meaning:

- PeaceByPiece operator/admin, not a customer company member.

Primary actions:

- Manage customer companies.
- Review signup/onboarding state.
- Manage plan/billing/storage operations.
- View system audit logs.
- Manage system standards and seed status.
- Support customer issues through controlled tools.

Hard boundary:

- Must not casually mutate customer production data.
- Must remain separated from customer workspace permissions.
- Dev/test impersonation tools must remain blocked in production.

UI emphasis:

- Customer account state.
- Provisioning and plan readiness.
- Storage/R2 usage.
- System standards.
- Auditability.

### External partner / factory / supplier

Default v2 alpha position:

- Not a full account member by default.
- Receives PDF/share link, order note, or factory instruction.
- May become a future portal role only after customer-side v2 core stabilizes.

Reason:

- Adding external partner accounts too early increases permission, link security, onboarding, and UI scope.
- WAFL v2 should first make PDF/share link flow strong.

## Core workflow scenarios

### 1. New Product/Style and Sheet creation

Goal:

- Create a usable WAFL Sheet quickly without requiring every production detail.

Flow:

```text
Product Explorer / New Sheet
→ enter Product/Style name
→ enter quantity
→ add image/sketch if available
→ optionally add category/season/color/size/due date
→ create WAFL Sheet
→ Assistant lists missing cards/information
```

Minimum creation baseline:

- Product/Style name.
- Quantity.

Strongly recommended:

- Main image/sketch.

Do not block creation because fabric, accessory, factory, unit price, or due date is missing.

### 2. Fabric card workflow

Goal:

- Keep fabric information and fabric order action inside the Sheet context.

Flow:

```text
WAFL Sheet
→ add fabric card
→ select existing supplier or create temporary supplier note
→ enter fabric name/color/spec/usage/quantity/unit price if known
→ Assistant evaluates readiness
→ request/order fabric or save as draft
→ record ordered/received/issue events
```

Rules:

- Fabric order is a card action first.
- Independent material/order screens are secondary inquiry/batch-management views.
- Missing unit price should usually be warning/confirmation, not always blocking.
- Missing supplier may be blocking for an actual external order, but not for saving draft fabric intent.

### 3. Accessory card workflow

Goal:

- Keep accessory information and order action inside the Sheet context.

Flow:

```text
WAFL Sheet
→ add accessory card
→ enter accessory type/name/spec/quantity
→ select supplier if known
→ Assistant evaluates readiness
→ request/order accessory or save as draft
→ record ordered/received/issue events
```

Rules:

- Accessory cards should not feel like a separate purchasing module.
- Multiple accessory cards must be easy to scan.
- Missing optional detail should not stop Sheet progress.

### 4. Factory/process instruction workflow

Goal:

- Let production users send or prepare factory instructions from the Sheet.

Flow:

```text
WAFL Sheet
→ add/select factory card
→ add process notes and due date
→ confirm fabric/accessory readiness if needed
→ generate factory instruction PDF/share output
→ send or copy share link
→ update making/issue/done progress
```

Rules:

- Factory output should exclude internal-only cost fields unless explicitly permitted.
- Factory instruction should be connected to Sheet/PDF data, not a disconnected document.
- Missing readiness should be shown by Assistant before sending.

### 5. Inspection / inbound / completion workflow

Goal:

- Record what arrived, what passed, what failed, and whether the Sheet can be completed.

Flow:

```text
Inspection queue or WAFL Sheet
→ open Sheet
→ record received quantity
→ record defect/issue quantity and notes
→ attach issue photo if needed
→ update inspection status
→ reflect inventory movement if allowed
→ mark Sheet completed when production is done
```

Rules:

- Inspection should focus on quantities and issues.
- Inspection manager should not need to edit design/fabric intent unless explicitly allowed.
- Inventory movement should be action-permission controlled.

### 6. Reorder workflow

Goal:

- Make reorder faster than paper/chat search.

Flow:

```text
Product/Style
→ latest or selected WAFL Sheet
→ Reorder
→ confirm quantity/due date/minor changes
→ create new Sheet version
→ Assistant highlights reused and missing information
```

Target:

```text
리오더 10초
```

Rules:

- Reorder should duplicate useful cards but preserve version/history separation.
- Old Sheet should remain immutable enough for audit/reference.
- New Sheet should clearly show it came from a previous Sheet.

### 7. PDF/share workflow

Goal:

- Make PDF and KakaoTalk/link sharing a natural Sheet action.

Flow:

```text
WAFL Sheet
→ Assistant checks share readiness
→ generate 임시 PDF preview if needed
→ generate 검토용/공유용/최종 PDF snapshot when confirmed
→ route PDF rendering/storage through WAFL-controlled API/Worker flow
→ create controlled share link if needed
→ share by KakaoTalk/copy link/download
→ record event
→ track expiry/view state when supported
```

Rules:

- PDF is Sheet output, not an unrelated export module.
- Share permissions must be action-code controlled.
- Expiry and access policy are required before real external launch.
- R2 object access must be mediated by WAFL-controlled app/API/Worker gateway, not direct raw R2 exposure.
- 임시 PDF and 최종/공유 PDF snapshot must be separated so preview artifacts do not become official records by accident.

### 8. Mobile field workflow

Goal:

- Let users view, update, capture, and share from mobile without PC layout compression.

Flow:

```text
Open mobile workspace
→ search/select Product/Style
→ view image and Assistant summary
→ open relevant card
→ capture photo or update quantity/note
→ generate/share PDF or copy link if allowed
```

Rules:

- Use card stack and bottom sheets.
- Keep camera/upload/share actions prominent.
- Do not require horizontal table interaction for core field work.

## Feature priority for early v2

### Must be core

- Product/Style creation.
- WAFL Sheet creation.
- Image/sketch as first-class data.
- Base info card.
- Fabric/accessory/factory cards.
- Assistant missing-info/readiness logic.
- PDF/share flow.
- Reorder.
- History/events.
- Action-code permission foundation.

### Secondary during v2 core

- Independent material-order screens.
- Advanced statistics.
- Complex system-admin optimization.
- External partner portal accounts.
- Advanced billing operation UI.
- Large document archive movement.

These are not unimportant. They are secondary because the v2 core product must first stop feeling like a patched v1.

## Owner decision candidates for next checkpoint

These items should be reviewed before DB/action-code finalization:

1. Should `Company owner` and `Admin` remain one default planning role or split into separate defaults?
2. Should `Production manager` and `Inspection manager` be separate default roles in seeded companies?
3. Should external partners remain share-link-only for v2 alpha, with portal accounts deferred?
4. Should cost visibility be default-on only for owner/admin and configurable for others?
5. Should due date be optional at creation but warning-level before factory instruction?

Recommended defaults:

1. Owner/Admin combined as the first default planning role.
2. Production manager and Inspection manager separated.
3. External partners share-link-only for v2 alpha.
4. Cost visibility default-on for owner/admin only, configurable for others.
5. Due date optional at creation, warning before factory instruction, not always blocking.

## Implementation boundary

This document does not authorize implementation.

Do not use this patch to perform:

- DB migration.
- API implementation.
- UI route replacement.
- Production mutation.
- R2 mutation.
- Existing v1 route deletion.
- External partner account implementation.

Later implementation must use a Codex prompt with explicit allowed files, forbidden files, migration status, tests, and completion criteria.


## PDF/share workflow baseline - 0.30.0-alpha.6

Detailed PDF/share rules are defined in `docs/project/v2/11-pdf-share-spec.md`.

Feature-level baseline:

```text
WAFL Sheet
-> PDF snapshot
-> controlled share link
-> KakaoTalk-friendly message/copy/share action
-> event/audit record
```

Required user-facing PDF types:

```text
- WAFL 작업지시서 PDF
- 발주요청 PDF
- 공장전달 PDF
```

Default ownership:

```text
고객사 관리자:
- generate/share/revoke/view history by default

디자이너:
- generate/share depending on company permission setting

재고관리:
- view/download relevant inbound/inspection PDFs by default
- external sharing only if allowed

시스템관리자:
- operation/support visibility only, subject to production guard
```

Alpha external-recipient rule:

```text
공장/거래처는 alpha 단계에서 로그인 계정이 아니다.
공장/거래처는 controlled share link 수신자다.
```

Implementation boundary:

```text
이 문서는 PDF/share 기능 명세 기준이다.
DB migration, API route, R2 mutation, Kakao API integration, production share behavior change는 별도 Codex 작업지시문 없이는 금지한다.
```

## 0.30.0-alpha.7 file/PDF storage feature clarification

File and PDF behavior should be described as business features, not raw storage operations.

Business feature names:

```text
이미지 업로드
스케치 업로드
첨부 추가
PDF 미리보기
검토용 PDF 생성
최종 PDF 보관
공유 링크 생성
공유 중지
파일 삭제/복구/영구삭제 요청
```

Implementation baseline to respect later:

```text
cloudflare/r2-upload-worker.js
- R2 upload/download/delete Worker baseline

cloudflare/pdf-generator-worker/
- PDF Generator Worker deployment baseline

Neon
- file/pdf/share/event metadata

R2
- object bytes only, behind controlled access
```

Do not build v2 features around raw public R2 URLs or direct browser-managed storage state.


## Mobile web interaction feature requirements

WAFL v2 features must include mobile browser acceptance criteria. This applies to Sheet creation, card editing, PDF/share, image upload, modal flows, and inventory input.

### Input stability requirements

```text
- Korean input must support continuous typing without losing focus after each character.
- Autosave and validation must not remount active inputs.
- Field keys must be stable ids, not current values.
- Formatting should prefer on-blur behavior when live formatting would disrupt typing.
- Numeric input must not clear or reset while the user is composing or editing.
```

### Mobile form requirements

```text
- input/textarea/select actual mobile font size must stay at least 16px.
- Important fields must not be hidden behind the mobile keyboard.
- Required action buttons must remain reachable in modal/bottom-sheet flows.
- Upload, camera, PDF, share, and delete actions must use readable Korean labels.
```

### Modal/drawer feature requirements

```text
- Background scroll lock must work consistently.
- Backdrop blur/dim style must be shared, not screen-specific.
- Focus trap must not reset on every keystroke.
- Closing must restore the prior page scroll position.
- Device rotation must not leave a drawer, modal, or bottom sheet impossible to close.
```

### QA requirement

Any Codex implementation that changes forms, modals, drawers, mobile card stacks, PDF previews, image upload, or Sheet editing must update or reference `docs/project/v2/09-test-plan.md`.

## 0.30.0-alpha.9 seed/test feature acceptance baseline

Every major WAFL v2 feature must have at least one planned seed scenario before Codex implementation starts.

Required feature-to-seed mapping:

```text
Product/Style creation
- minimal draft
- image/sketch attached
- incomplete but saved Sheet

Sheet cards
- fabric ready
- fabric missing price warning
- accessory skipped
- factory assigned
- process issue

Permissions
- 시스템관리자
- 고객사 관리자
- 디자이너
- 재고관리

PDF/share
- temporary preview
- review PDF
- shared snapshot
- final snapshot
- expired/revoked share link

Inventory
- expected inbound
- partial inbound
- defect quantity
- completed stock reflection

Mobile UX
- Korean input fields
- numeric input fields
- modal/drawer/bottom sheet
- orientation change
```

Feature work without a seed/test scenario is not considered implementation-ready.

## 0.30.0-alpha.24 material action and process card behavior correction

Fabric/accessory behavior should make the next production action obvious without exposing a full workflow engine in the mock showroom.

Feature rules:

- Work-needed tab badge counts should represent material/accessory rows with missing unit price or not-yet-finished ordering work.
- A zero work-needed count should not render a badge.
- Material rows in requested, ordered, received, or done-like states are read-only in the default screen and use a closed lock icon.
- Editable material rows use an open lock icon and may expose delete when the item is draft/orderable.
- `발주 요청` is the main action for orderable rows.
- `발주 완료 처리` is the main action for rows already requested but not yet completed.
- Default rows should not expose `상세 보기` or `계속 입력`; full editing belongs to editor/drawer/bottom-sheet flows in later implementation.
- Delete is a row-level icon action. It is hidden or unavailable for requested/ordered material rows.
- `제작 공장` and additional process rows use the same process-card data shape: process, partner, quantity, unit, unit price, amount, due date, memo/warning where needed.
- Process ordering is represented by a drag handle or long-press mock rather than up/down/copy buttons in the default showroom.
- Real drag/drop, order mutation, process catalog management, supplier lookup, and DB persistence remain out of scope for `/ui` alpha.24.

This section is a showroom-only correction. It does not authorize API routes, DB persistence, order mutation, delivery-request mutation, real document generation, share-link creation, R2/Worker changes, production guard changes, process/unit management API work, or workspace/system behavior changes.

## 0.30.0-alpha.25 image, size/color, and confirmation feature correction

The `/ui` showroom may demonstrate feature shape for visual references, size/color, output/share inclusion, and confirmation-first actions, but must not cross into real feature wiring.

Feature rules:

- Representative image selection is local mock state only.
- Image/photo/sketch/attachment controls are visual entry points only; they do not open real upload, delete, camera, drawing, or file APIs.
- Size/color controls are mock fields only; they do not create size masters, customer catalogs, admin APIs, or DB records.
- Output/share may show that documents include representative image, size/color, material, process, and memo data, but it does not generate PDFs or share links.
- Material delete/order/order-complete controls should show confirmation-first behavior and then close the mock panel; they do not mutate material rows, orders, APIs, DB, or external messages.
- Missing order information should be shown before `발주 요청` proceeds.
- Process/factory data remains editable-looking mock data only and does not connect to process/unit management APIs.

This section is a showroom-only correction. It does not authorize API routes, DB persistence, upload/delete mutation, image drawing, order mutation, delivery-request mutation, real document generation, share-link creation, R2/Worker changes, production guard changes, process/unit/size management API work, or workspace/system behavior changes.
