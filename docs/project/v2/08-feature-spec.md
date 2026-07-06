# WAFL v2 Feature Spec - Role and Workflow Baseline - 0.30.0-alpha.2

## Purpose

This document defines the second WAFL v2 GPT-side design baseline: user roles, role behavior, and core workflow scenarios.

It is not a database schema and not an implementation instruction. Permission action codes, status definitions, and DB tables will be formalized in later v2 documents.

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
