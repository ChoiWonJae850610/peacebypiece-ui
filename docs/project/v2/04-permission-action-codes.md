# WAFL v2 Permission Action Codes - 0.30.0-alpha.4

## Purpose

This document defines the first WAFL v2 permission/action-code baseline.

It is a design contract, not an implementation file. It does not authorize API rewrites, DB migration, seed mutation, production permission changes, or UI route changes.

## Core rule

WAFL v2 must not hardcode behavior by role name.

Bad pattern:

```ts
if (role === "designer") {
  // show or hide business function
}
```

Required pattern:

```ts
can(user, "sheet.update", sheet)
can(user, "fabric.order", sheet)
can(user, "pdf.share", sheet)
```

Human-readable roles are default permission bundles. Action codes are the actual contract.

## Korean role-label rule

User-facing roles for v2 are fixed as the first planning set:

```text
시스템관리자(system_admin)
고객사 관리자(customer_admin)
디자이너(designer)
재고관리(inventory_manager)
```

Rules:

- 화면과 설명 문서는 한국어 라벨을 먼저 쓴다.
- DB/API/TypeScript/test code는 안정적인 영어 code를 쓴다.
- 화면 구현은 역할명 직접 분기 금지다.
- 역할은 action code 묶음, 즉 permission preset일 뿐이다.
- 외부 공장/거래처는 alpha에서 로그인 role이 아니라 PDF/share-link 수신자다.

Do not introduce separate `production_manager` or `inspection_manager` default roles unless the owner later decides to split 재고관리 into multiple roles.

## Permission check shape

Target runtime shape:

```ts
can(actor, actionCode, resource, context)
```

Where:

```text
actor:
- user id
- membership id
- company id
- role id
- system/admin context if applicable

actionCode:
- string catalog entry, e.g. sheet.update

resource:
- product
- sheet
- card
- file
- partner
- member
- company
- system object

context:
- runtime mode
- tenant
- ownership
- status
- risk level
- dev/test/production guard
```

## Action code naming rule

Use dot-separated action codes.

```text
domain.verb
domain.subdomain.verb
```

Examples:

```text
sheet.create
sheet.update
fabric.order
pdf.share
member.manage
system.company.pause
```

Rules:

- Use English code.
- Keep codes stable.
- Do not include role names in action codes.
- Prefer business action names over UI button labels.
- If an action is audited, the same code should be usable in events.

## Risk levels

Each action should have a risk level.

```text
low
medium
high
destructive
system
```

Suggested meaning:

```text
low:
read-only or local UI preference

medium:
normal business update

high:
external sharing, order, permission, billing, or file operation

destructive:
delete, purge, revoke, cancel, irreversible reset

system:
system admin operation or cross-tenant operation
```

## Action code catalog baseline

### Product / Style

```text
product.create
product.view
product.update
product.archive
product.restore
product.delete
product.reorder
product.image.update
```

Notes:

- `product.delete` should be rare and possibly admin-only.
- Normal removal should be archive.
- `product.reorder` creates a new Sheet/version from an existing product or sheet.

### WAFL Sheet

```text
sheet.create
sheet.view
sheet.update
sheet.duplicate
sheet.request_review
sheet.approve
sheet.reject
sheet.hold
sheet.cancel
sheet.complete
sheet.status.update
sheet.assistant.override_warning
```

Notes:

- Review flow should not become too heavy by default.
- `sheet.assistant.override_warning` is important for the v2 philosophy: warn/confirm rather than always block.

### Sheet cards

```text
sheet_card.create
sheet_card.view
sheet_card.update
sheet_card.reorder
sheet_card.delete
sheet_card.status.update
```

Notes:

- Card operations should be general enough for image, fabric, accessory, factory, process, memo, and cost cards.
- Detailed business actions should use domain-specific codes where needed.

### Image / file / sketch

```text
file.upload
file.view
file.download
file.update
file.delete
file.restore
file.set_primary_image
file.generate_thumbnail
```

Notes:

- Product main image and sheet sketch are core data, not ordinary attachments.
- Delete/restore must follow file policy and R2 guard.

### Fabric

```text
fabric.view
fabric.update
fabric.price.view
fabric.price.update
fabric.order
fabric.order.cancel
fabric.receive
fabric.issue.report
```

Notes:

- `fabric.order` is a card action.
- Independent material-order screens may show orders, but the user action starts from Sheet context.

### Accessory

```text
accessory.view
accessory.update
accessory.price.view
accessory.price.update
accessory.order
accessory.order.cancel
accessory.receive
accessory.issue.report
```

### Factory / process

```text
factory.assign
factory.instruction.generate
factory.instruction.share
factory.progress.update
factory.complete
factory.issue.report

process.assign
process.update
process.order
process.complete
process.issue.report
```

Notes:

- External factory/partner account is deferred.
- PDF/share link is the alpha baseline for external communication.

### Inspection / inbound / inventory

```text
inspection.view
inspection.update
inspection.defect.report
inspection.complete

inbound.view
inbound.update
inbound.complete

inventory.view
inventory.adjust
inventory.movement.view
```

Notes:

- Inventory edit should remain limited.
- Inspection and inbound may be the same human in small shops but should remain distinct actions.

### Cost

```text
cost.view
cost.update
cost.export
```

Notes:

- Owner/admin has default cost view.
- Other roles can be configured.
- Do not assume every production role can see cost.

### PDF / share

```text
pdf.generate
pdf.view
pdf.download
pdf.regenerate
pdf.snapshot.view

pdf.share
pdf.share.revoke
pdf.share.view_log
```

Notes:

- Sharing is high-risk because it sends business data outside the tenant.
- Expiring links and audit logs are required.

### Partner

```text
partner.view
partner.create
partner.update
partner.archive
partner.delete
partner.contact.view
```

### Member / role / settings

```text
member.view
member.invite
member.update
member.remove
member.manage

role.view
role.create
role.update
role.delete
role.permission.update

settings.view
settings.manage
```

### Company / subscription / storage

```text
company.view
company.update
company.pause
company.resume

subscription.view
subscription.manage

storage.view
storage.usage.view
storage.purge_candidates.view
storage.purge
storage.restore
```

### System admin

```text
system.company.view
system.company.update
system.company.pause
system.company.resume

system.signup_application.view
system.signup_application.approve
system.signup_application.reject

system.billing.view
system.billing.operation

system.storage.view
system.storage.purge

system.audit.view
system.catalog.manage
system.impersonation.start
system.impersonation.stop
```

Rules:

- System actions must be blocked in production unless explicitly allowed by production-safe system admin policy.
- Dev/test account switcher must never expose raw tokens or secrets.
- Impersonation must be audited.

### Dev/test

```text
dev.test_console.view
dev.seed.run
dev.reset.run
dev.role_switch
dev.account_switch
dev.qa.run
```

Rules:

- Must be blocked in production.
- Destructive dev/test actions require explicit confirmation.
- These are never customer-facing permissions.

## Default role permission baseline

This is a planning baseline only. It does not modify existing permissions.

### 시스템관리자(system_admin)

Meaning:

```text
서비스 운영자 / WAFL 운영자 / owner-side administrator
```

Default allowed:

```text
system.*
company.view
company.manage_status
storage.view
storage.usage.view
system.audit.view
system.catalog.manage
system.signup.review
system.billing.view
dev.test_console.view where runtime_mode_dev_test_only
```

Not automatically allowed:

```text
customer sheet mutation
customer product mutation
customer file download
customer private file view without explicit audited support context
```

Rules:

- 시스템관리자는 고객사 내부 직원이 아니다.
- 고객사 workspace 데이터를 임의로 수정하는 역할이 아니다.
- 고객사 데이터 접근이 필요하면 명시적인 support/audit boundary가 있어야 한다.
- production에서는 dev/test 도구가 차단되어야 한다.

### 고객사 관리자(customer_admin)

Meaning:

```text
고객사 대표 / 매장 관리자 / 회사 관리자
```

Default allowed:

```text
product.*
sheet.*
sheet_card.*
file.*
fabric.*
accessory.*
factory.*
process.*
inspection.*
inbound.*
inventory.view
inventory.movement.view
cost.*
pdf.*
partner.*
member.*
role.*
settings.*
company.view
company.update
subscription.view
storage.usage.view
```

Limited/destructive:

```text
inventory.adjust
product.delete
sheet.cancel
file.delete
role.delete
company.dangerous_setting.update
```

Rules:

- 고객사 내부에서 가장 넓은 업무 권한을 가진다.
- 비용/원가 보기 기본 허용.
- 멤버/권한/회사 설정 관리 가능.
- 실제 삭제/취소/재고보정은 확인과 이벤트 기록이 필요하다.

### 디자이너(designer)

Meaning:

```text
제품/스타일과 WAFL Sheet를 만들고 채우는 사람
```

Default allowed:

```text
product.create
product.view
product.update
product.reorder
product.image.update

sheet.create
sheet.view
sheet.update
sheet.duplicate
sheet.request_review
sheet.assistant.override_warning

sheet_card.create
sheet_card.view
sheet_card.update
sheet_card.reorder

file.upload
file.view
file.download
file.set_primary_image

fabric.view
fabric.update
accessory.view
accessory.update

factory.view
factory.assign
factory.instruction.generate

pdf.generate
pdf.view
pdf.download

partner.view
```

Configurable:

```text
cost.view
fabric.order
accessory.order
factory.instruction.share
pdf.share
```

Not default:

```text
member.manage
settings.manage
inventory.adjust
inventory.complete
system.*
dev.*
```

Rules:

- 디자이너는 새 Sheet 생성과 내용 작성에 최적화한다.
- 대표 이미지/스케치/원단/부자재/공장 의도 입력은 핵심 권한이다.
- 재고 수량 직접 보정은 기본 권한이 아니다.
- 비용/원가 보기와 외부 공유는 고객사 설정으로 조정 가능하다.

### 재고관리(inventory_manager)

Meaning:

```text
입고 / 검수 / 재고 반영 담당
```

Default allowed:

```text
product.view
sheet.view
sheet.status.update where status_in: inspection/completed related transitions

sheet_card.view
sheet_card.status.update

fabric.view
fabric.receive
accessory.view
accessory.receive

inspection.view
inspection.update
inspection.defect.report
inspection.complete

inbound.view
inbound.update
inbound.complete

inventory.view
inventory.movement.view
inventory.reflect

file.view
file.upload_issue_photo
pdf.view
partner.view
```

Configurable:

```text
inventory.adjust
cost.view
sheet.update_limited
```

Not default:

```text
product.create
product.delete
sheet.delete
fabric.order
accessory.order
factory.instruction.share
pdf.share
member.manage
settings.manage
system.*
dev.*
```

Rules:

- 재고관리는 디자인 정보 작성자가 아니다.
- 주 업무는 입고, 검수, 불량, 재고 반영, 재고 이력이다.
- 발주 결정과 외부 공유는 기본 권한이 아니다.
- 고객사에 따라 제한적 Sheet 수정은 허용할 수 있다.

### 외부 공장/거래처(external share recipient)

v2 alpha baseline:

```text
No login role by default.
Receives PDF/share link.
Can view only shared artifact within expiration/permission boundary.
```

Future portal only if later approved:

```text
partner_portal.view
partner_portal.status.update
partner_portal.file.upload
```

## Permission conditions

Some permissions need conditions.

Condition examples:

```text
own_created_only
same_company_only
status_in
runtime_mode_dev_test_only
requires_owner_confirmation
requires_audit_log
requires_share_expiration
```

Examples:

```text
file.delete:
- allowed if owner/admin
- or allowed if creator and file policy permits

pdf.share:
- requires sheet access
- requires share expiration
- requires event log

dev.reset.run:
- runtime_mode_dev_test_only
- explicit confirmation required
```

## Event coupling

Most mutating actions should create events using the same action code.

Examples:

```text
sheet.update -> events.action_code = sheet.update
fabric.order -> events.action_code = fabric.order
pdf.share -> events.action_code = pdf.share
role.permission.update -> events.action_code = role.permission.update
```

## Implementation boundary

This document does not require immediate implementation.

Future implementation should create or update:

```text
docs/project/v2/04-permission-action-codes.md
lib/internal/action-codes.ts
lib/internal/role-presets.ts
lib/permissions/can.ts
db seed for action_codes
/functions action-code catalog
```

Only after explicit implementation approval.

## Open decisions

No blocking owner decision is required for this checkpoint.

Recommended default:

```text
Use action-code permission model.
Use default role bundles only as presets.
Keep external partners as share-link recipients for v2 alpha.
Make cost visibility configurable except owner/admin default.
Block dev/test actions in production.
```


## 0.30.0-alpha.12 operational permission boundary

Future v2 permission work must keep operational and destructive actions behind explicit action codes. At minimum, the action-code catalog must continue to cover:

```text
company.approve
company.pause
company.resume
company.provision
company.export
company.request_deletion
company.restore
company.purge
subscription.view
subscription.manage
storage.view
storage.manage
storage.purge
catalog.manage_system
catalog.manage_company
file.upload
file.view
file.delete
file.restore
pdf.generate
pdf.share
pdf.revoke_share
dev.seed_plan
dev.seed_apply
dev.seed_reset
```

Do not implement future UI branching with hard-coded role checks. Use permission/action-code checks such as `can(user, "pdf.share", sheet)`.
