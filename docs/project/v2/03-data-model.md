# WAFL v2 Data Model - 0.30.0-alpha.4

## Purpose

This document defines the first WAFL v2 data-model baseline before implementation.

It is a design contract, not a migration file. It does not authorize DB migration, API implementation, seed mutation, R2 mutation, or production data changes.


## Current infrastructure baseline

WAFL currently uses Neon for the application database and Cloudflare R2 for file/object storage.

This v2 data-model document does not mean replacing Neon or ignoring the existing R2 design. The current working assumption is:

```text
Database:
- Neon PostgreSQL remains the DB platform.
- v2 work may redesign schema, migrations, seeds, and typed data contracts on top of Neon.
- No DB migration is authorized by this document.

Object storage:
- Cloudflare R2 remains the storage platform.
- PDF files, PDF snapshots, representative images, sketches, uploaded attachments, and generated artifacts are stored in R2.
- Representative images and sketches are first-class Sheet/Product data, not merely low-priority attachments.
- No R2 mutation, purge, copy, or bucket policy change is authorized by this document.
```

Practical implication:

```text
Design v2 cleanly, but keep the existing Neon/R2 operational safeguards.
Do not create a new storage/database direction unless the owner explicitly decides it.
```

## Core principle

WAFL v2 must not model the product as a single workorder form.

The data model should follow this shape:

```text
Company
  -> Membership / Role
  -> Product / Style
      -> WAFL Sheet
          -> Sheet Cards
              -> Fabric / Accessory / Factory / Process / Image / Memo / Cost / PDF
```

## Modeling decision

WAFL v2 should use a hybrid model.

```text
Recommended:
Core normalized tables + typed card detail tables + limited JSON metadata

Avoid:
Everything in data_json only

Also avoid:
A separate heavy table for every minor UI field before the product direction is proven
```

The reason is practical. Fabric, accessory, factory, inspection, inventory, PDF, cost, and event data need search, reporting, permission checks, auditing, and PDF generation. A pure JSON card table would be fast at first but would become fragile when production workflows grow.

## Top-level entities

### companies

Company tenant.

Suggested fields:

```text
id
name
display_name
business_registration_number
plan_code
status
storage_quota_bytes
storage_used_bytes
created_at
updated_at
```

Notes:

- Existing company/account/onboarding concepts can be mapped later.
- v2 design must preserve tenant isolation.
- Production guard and R2 storage policy remain mandatory.

### users

Human account.

Suggested fields:

```text
id
email
name
avatar_url
status
created_at
updated_at
```

Notes:

- Authentication implementation may reuse existing Google auth/session work.
- Do not mix global user identity with company membership permissions.

### memberships

User-company relationship.

Suggested fields:

```text
id
company_id
user_id
role_id
status
joined_at
last_active_at
created_at
updated_at
```

Notes:

- A user can belong to more than one company.
- Screen/API behavior must not branch directly by role name.
- Role is a default permission bundle, not the source of truth.

### roles

Company or system role template.

Suggested fields:

```text
id
company_id
code
name
description
is_system_role
created_at
updated_at
```

Default planning roles use Korean labels first and internal codes second.

```text
시스템관리자(system_admin)
- Service operator / owner-side administrator.
- Global/system-scoped.
- Not a normal customer-company member.

고객사 관리자(customer_admin)
- Customer company owner/admin.
- Broadest customer-side permissions.
- May manage members, settings, cost visibility, PDF/share, partners, and Sheet progress.

디자이너(designer)
- Creates and edits Product/Style and WAFL Sheet content.
- Works mainly with images, sketches, base information, fabric/accessory/factory intent, PDF draft, and reorder.

재고관리(inventory_manager)
- Handles inbound, inspection, defect quantity, stock reflection, and inventory adjustment where allowed.
```

Rules:

- User-facing docs/screens must show Korean labels first.
- Internal DB/API/test code may use English codes.
- The v2 alpha role set should not add separate production-manager and inspection-manager roles unless the owner later decides to split them.
- External factories/suppliers are not login roles in alpha. They are PDF/share-link recipients first.

## Product and Sheet entities

### products

The top-level business object: one garment/style.

Suggested fields:

```text
id
company_id
product_code
name
display_name
season
category_id
main_image_file_id
lifecycle_status
latest_sheet_id
created_by
created_at
updated_at
archived_at
```

Rules:

- User-facing language may be `제품` or `스타일`.
- Development language should use `products`.
- Product is the reorder/search/history anchor.

### sheets

The living production document for a product/style.

Suggested fields:

```text
id
company_id
product_id
sheet_no
version_no
status
quantity
due_date
priority
memo
created_by
updated_by
created_at
updated_at
completed_at
cancelled_at
```

Rules:

- A product can have multiple Sheets over time.
- Reorder should create a new Sheet version/copy while preserving source history.
- PDF snapshots are generated from Sheet state, not from an unrelated PDF form.

### sheet_cards

Common card container for the Sheet.

Suggested fields:

```text
id
company_id
sheet_id
type
title
sort_order
card_status
is_required
is_collapsed
created_by
updated_by
created_at
updated_at
```

Card type candidates:

```text
basic_info
image
fabric
accessory
factory
process
size_spec
memo
cost
pdf_share
history
```

Rules:

- `sheet_cards` holds shared card metadata.
- Business-critical details should live in typed detail tables.
- Small display preferences can live in metadata later if needed.

## Typed card detail tables

### sheet_fabric_cards

Fabric detail for a Sheet card.

Suggested fields:

```text
id
company_id
sheet_id
card_id
partner_id
fabric_name
fabric_code
color
spec
unit
quantity_required
quantity_ordered
quantity_received
unit_price
amount
order_status
received_status
notes
created_at
updated_at
```

Rules:

- Must support PDF output, order request, supplier filtering, and cost calculation.
- Fabric may start incomplete and become order-ready later.

### sheet_accessory_cards

Accessory detail for a Sheet card.

Suggested fields:

```text
id
company_id
sheet_id
card_id
partner_id
accessory_name
accessory_type
color
spec
unit
quantity_required
quantity_ordered
quantity_received
unit_price
amount
order_status
received_status
notes
created_at
updated_at
```

Rules:

- Similar to fabric, but accessory type/category must remain explicit.
- Do not bury accessory quantities and costs in unsearchable JSON.

### sheet_factory_cards

Factory or external production partner instruction.

Suggested fields:

```text
id
company_id
sheet_id
card_id
factory_partner_id
factory_name_snapshot
instruction_status
delivery_due_date
quantity_sent
quantity_completed
quantity_defective
unit_work_price
amount
notes
created_at
updated_at
```

Rules:

- Factory instruction can be generated before all cost fields are complete, with warnings.
- Factory partner account/portal is deferred; share/PDF link is the alpha baseline.

### sheet_process_cards

Process-specific production work.

Suggested fields:

```text
id
company_id
sheet_id
card_id
process_code
process_name
partner_id
status
quantity
unit_price
amount
due_date
notes
created_at
updated_at
```

Rules:

- Used for dyeing, washing, printing, finishing, or custom processes.
- Process catalog can be company-specific and seeded from system standards.

### sheet_size_specs

Size spec data.

Suggested fields:

```text
id
company_id
sheet_id
card_id
size_label
measurement_name
measurement_value
tolerance
sort_order
created_at
updated_at
```

Rules:

- The size spec should be printable in PDF.
- Do not tie size spec only to a visual table component.

## Partner and catalog entities

### partners

Business partners: suppliers, factories, processors.

Suggested fields:

```text
id
company_id
name
type
contact_name
phone
email
address
memo
status
created_at
updated_at
```

Partner type examples:

```text
fabric_supplier
accessory_supplier
factory
process_partner
other
```

Rules:

- A partner may support multiple work types later.
- Existing partner/factory screens can be mapped to this model.

### categories

Product category.

Suggested fields:

```text
id
company_id
parent_id
name
level
sort_order
is_active
created_at
updated_at
```

Rules:

- Keep existing clothing category policy where useful.
- Underwear/accessory category policy remains optional/inactive by default unless v2 explicitly changes it.

### units

Unit catalog.

Suggested fields:

```text
id
company_id
code
name
type
is_active
sort_order
created_at
updated_at
```

Examples:

```text
yd
m
ea
roll
pcs
set
kg
```

## File entities

### files

Shared file/image/sketch storage metadata.

Suggested fields:

```text
id
company_id
owner_type
owner_id
purpose
file_name
mime_type
size_bytes
storage_key
public_url
thumbnail_url
created_by
created_at
deleted_at
```

Purpose examples:

```text
product_main_image
sheet_sketch
sheet_attachment
business_certificate
pdf_snapshot
```

Rules:

- Product main image and sheet sketch are not ordinary attachments.
- Attachments are lower-level files.
- R2 tenant isolation and deletion/restore policies must remain mandatory.

## PDF/share entities

### pdf_snapshots

Generated PDF output snapshot.

Suggested fields:

```text
id
company_id
sheet_id
type
version_no
source_hash
file_id
generated_by
generated_at
status
error_message
```

PDF types:

```text
workorder
material_order
factory_instruction
inspection_summary
```

Rules:

- PDF is a snapshot of Sheet state.
- Re-generation should create a new snapshot or explicitly replace the latest snapshot according to the future PDF spec.

### share_links

Expiring external access link.

Suggested fields:

```text
id
company_id
sheet_id
pdf_snapshot_id
token_hash
purpose
recipient_label
expires_at
opened_at
revoked_at
created_by
created_at
```

Rules:

- External partner account is not required in v2 alpha.
- Share links must be expiring, revocable, and auditable.
- Do not expose raw tokens in logs.

## Event and audit entities

### events

Business event log.

Suggested fields:

```text
id
company_id
actor_user_id
actor_membership_id
object_type
object_id
action_code
before_json
after_json
message
created_at
```

Rules:

- Important changes must be evented.
- Product, Sheet, card, PDF, share, order, inspection, and permission events should use the same event pattern.
- Avoid screen-local history logic.

### audit_logs

System/security audit log.

Suggested fields:

```text
id
actor_user_id
actor_company_id
target_type
target_id
operation
ip_address
user_agent
metadata_json
created_at
```

Rules:

- System admin actions, account switching, destructive dev/test operations, file purge, and permission changes need audit-level logs.
- Business events and security audit logs may be separate.

## Permission entities

### action_codes

Catalog of allowed actions.

Suggested fields:

```text
id
code
name
description
scope
category
risk_level
is_active
created_at
updated_at
```

Examples:

```text
sheet.create
sheet.update
fabric.order
pdf.share
member.manage
settings.manage
```

### role_permissions

Role-action permission map.

Suggested fields:

```text
id
role_id
action_code
allowed
condition_json
created_at
updated_at
```

Rules:

- The runtime check should look like `can(user, actionCode, resource)`.
- Human-readable role names are not enough.

## Order/inventory entities

v2 alpha should not overbuild inventory before Sheet workflow is validated. Still, the data model should leave room for these entities.

### material_orders

Order generated from fabric/accessory cards.

Suggested fields:

```text
id
company_id
sheet_id
card_id
partner_id
type
status
ordered_at
ordered_by
expected_arrival_date
notes
created_at
updated_at
```

### material_order_lines

Order line items.

Suggested fields:

```text
id
company_id
material_order_id
source_card_id
item_name
unit
quantity
unit_price
amount
received_quantity
created_at
updated_at
```

### inventory_movements

Inventory movement log.

Suggested fields:

```text
id
company_id
source_type
source_id
item_type
item_name
movement_type
quantity
unit
memo
created_by
created_at
```

Movement types:

```text
inbound
outbound
adjustment
inspection_defect
reorder_use
```

## Data model boundaries for 0.30

### 0.30.0-alpha.3

This checkpoint defines the model only. No migration.

### 0.30.0-alpha.4 candidate

Future Codex or GPT work may turn this into:

```text
docs/project/v2/db-schema-draft.sql
docs/project/v2/db-migration-plan.md
lib/internal/v2-data-model.ts
```

Only after explicit owner approval.

## Korean label and code stance

The DB should store stable code values, but screens and planning documents should explain them in Korean first.

Examples:

```text
고객사 관리자(customer_admin)
초안(draft)
준비됨(ready)
발주됨(ordered)
```

This prevents implementation ambiguity while keeping owner review understandable.

## Migration stance

There is no production customer data yet, but existing code and test data still matter.

Recommended stance:

```text
Do not preserve old schema at any cost.
Do not destructively drop old data during design.
Design v2 cleanly.
Create migration/seed/reset plans explicitly before any DB action.
```

## Open decisions

The owner has clarified that Neon DB and Cloudflare R2 are already in use and remain the current infrastructure baseline. The owner also clarified the v2 planning role set as 시스템관리자, 고객사 관리자, 디자이너, 재고관리.

The following can be revisited before DB implementation:

1. Whether `sheet_fabric_cards` and `sheet_accessory_cards` should be separate tables or one typed material detail table.
2. Whether `orders` should be generic across fabric/accessory/factory or split by work type.
3. How deep 재고관리(inventory_manager) should go in v2 alpha versus v2 beta.
4. Whether product category remains the existing 3-level system or becomes more flexible.
