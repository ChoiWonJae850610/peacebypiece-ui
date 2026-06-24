# UI and Routing Remediation Specification


> Canonical update (0.24.21.9): conflicting provisional policy in this document is superseded by `docs/project/26-final-policy-decisions-and-master-todo.md`.
Version: 0.24.21.4  
Status: Canonical design and implementation input  
Scope: storage usage visualization, company file fields, workorder routing identifiers  
Runtime implementation: deferred to Codex

## 1. Purpose

This specification closes three visible productization gaps before commercial capture and onboarding work:

1. storage usage is shown with a generic rectangular progress treatment instead of the established WAFL storage-cylinder visual;
2. company representative image and business registration fields repeat the same noun in title, badge, and body copy;
3. workorder URLs may expose sequential identifiers or page/index query state that should not be part of the public navigation contract.

The work is intentionally split into visual, state, routing, security, compatibility, and acceptance contracts so Codex does not infer policy from screenshots.

## 2. Non-goals

This document does not:

- modify React components, routes, repositories, API handlers, DB schema, migrations, R2 keys, or permissions;
- promise that browser URLs can be hidden;
- replace tenant and permission checks with opaque identifiers;
- rename existing DB primary keys;
- change quota calculation, plan capacity, file retention, PDF policy, or commercial pricing;
- execute DB/R2/Seed/Reset/Cleanup/Purge.

## 3. Storage usage cylinder contract

### 3.1 Meaning

The storage cylinder is a semantic usage visualization, not decorative artwork. It represents:

- used bytes;
- included or effective quota bytes;
- normalized usage ratio;
- plan name;
- warning or blocking state;
- optional breakdown and reconciliation note.

The data source remains the existing storage/quota contract. The component must not calculate commercial policy independently.

### 3.2 Required information hierarchy

Desktop and tablet:

1. plan label and effective quota;
2. cylinder visualization;
3. used / total text;
4. percentage;
5. state message;
6. optional action such as file management, empty trash, or plan upgrade;
7. optional metadata note for snapshot/reconciliation freshness.

Mobile:

1. plan label;
2. compact cylinder;
3. used / total and percentage;
4. one concise state message;
5. one primary action.

Do not duplicate the percentage in a separate rectangular progress card when the cylinder already provides the primary usage visualization.

### 3.3 Visual geometry

- The outer vessel uses an elliptical top and bottom and vertical side walls.
- The fill rises from the bottom and is clipped to the inner vessel.
- The fill surface uses an ellipse so the liquid level remains visually cylindrical.
- The vessel retains a readable outline at 0%, 100%, high contrast, and reduced motion.
- Numeric text must remain outside or above the fill when overlap would reduce readability.
- The component may use CSS/SVG, but must remain deterministic and printable in screenshots.
- Do not use pseudo-3D perspective that distorts percentage reading.
- A rectangular progress bar may remain only as a compact fallback for extremely narrow contexts, not as the default system/admin storage visualization.

Recommended responsive bounds:

- desktop: 144–184 px visual height;
- tablet: 128–160 px;
- mobile: 104–136 px;
- minimum readable width: 96 px.

### 3.4 State thresholds

Use canonical quota policy values:

- below 80%: normal;
- 80% to below 100%: warning;
- 100% or above: blocked for new uploads;
- missing quota: configuration error, not 0%;
- stale snapshot: show data freshness note without changing quota state;
- negative usage: clamp display to 0 and report invalid source data;
- usage above quota: show actual percentage text while clamping visual fill to the vessel.

State wording must distinguish:

- “사용량이 높습니다” for warning;
- “새 파일 업로드가 제한됩니다” for quota block;
- “사용량 정보를 확인할 수 없습니다” for data error;
- “집계 기준 시각” for snapshot freshness.

Color cannot be the only state signal. Use icon, label, or text.

### 3.5 Accessibility

- Expose a text equivalent such as `저장공간 1.2GB 중 820MB 사용, 68%`.
- Use `role="img"` only when the cylinder has a complete accessible label; otherwise use normal semantic text and hide decorative SVG parts.
- Warning and blocked states require visible text.
- The component must remain readable at 200% zoom.
- Reduced-motion users receive no sloshing, fill animation, or looping effects.
- Loading uses the standard WAFL loading state, not an animated fake percentage.
- Empty/error states use shared WAFL components.

### 3.6 Data and fixture acceptance

Dev/test fixtures should cover at least:

- 0%;
- 25%;
- 79%;
- 80%;
- 99%;
- 100%;
- 110%;
- no quota;
- stale snapshot;
- logical usage different from physical R2 usage.

The primary customer-facing percentage uses logical billable usage. Physical R2 usage and reconciliation differences remain system-admin metadata unless policy explicitly changes.

## 4. Company file field contract

### 4.1 Problem

The current company settings experience may repeat `대표 이미지` or `사업자등록증` in:

- section heading;
- card title;
- badge;
- empty text;
- filename label.

The UI should separate the resource name from its status.

### 4.2 Shared structure

Each file field contains:

1. resource label;
2. optional one-line help text;
3. preview or file summary;
4. status;
5. primary action;
6. secondary action when allowed;
7. validation or rejection reason.

The resource name appears once in the field header. A badge must express state, not repeat the resource name.

Examples:

- header: `대표 이미지`
  - status badge: `등록 완료`, `미등록`, `업로드 중`, `교체 필요`
- header: `사업자등록증`
  - status badge: `미등록`, `검토 대기`, `승인`, `보완 필요`, `반려`

Do not use badges such as `대표 이미지` or `사업자등록증`.

### 4.3 Representative image states

Unregistered:

- empty preview;
- concise text: `등록된 이미지가 없습니다.`;
- action: `이미지 등록`.

Registered:

- image preview;
- optional filename and uploaded date;
- state: `등록 완료`;
- actions: `이미지 변경`, `삭제` when permission allows.

Uploading:

- deterministic progress or loading state;
- disable duplicate submit;
- keep prior image visible until replacement succeeds when technically possible.

Error:

- retain previous valid state;
- show actionable error;
- do not clear the stored image on failed replacement.

### 4.4 Business registration states

Unregistered:

- file placeholder;
- `등록된 사업자등록증이 없습니다.`;
- action: `파일 등록`.

Review pending:

- filename;
- state: `검토 대기`;
- replacement policy follows the existing request/approval contract.

Approved:

- filename and approved state;
- download/view actions only for authorized roles.

Changes requested or rejected:

- state: `보완 필요` or `반려`;
- reason shown inside the same field;
- action: `파일 교체`.

Sensitive file access remains audited. This specification does not expand system-admin content access.

### 4.5 Responsive acceptance

- Desktop may place the two fields side by side when content remains readable.
- Tablet and mobile use one column.
- Actions wrap without horizontal overflow.
- Preview, filename, state, and reason remain visible without opening a second explanatory card.
- The same state vocabulary is used in customer-admin and system-admin review surfaces.

## 5. Workorder routing and identifier contract

### 5.1 Reality and objective

A browser address cannot be hidden. The objective is to remove unnecessary exposure of sequential identifiers and transient page/index state, while preserving refresh, direct links, back/forward navigation, authorization, and supportability.

### 5.2 Canonical route direction

Preferred canonical route:

`/workspace/workorders/{publicId}`

Collection route:

`/workspace/workorders`

The public identifier:

- is opaque and non-sequential;
- is stable for the lifetime of the workorder;
- is tenant-scoped in lookup;
- is separate from the DB primary key;
- is not derived from product name, company name, email, phone, or other personal/business data;
- uses sufficient entropy to resist enumeration;
- may use a prefixed format such as `wo_...` for logs and support.

Do not use array position, page number, or sequential numeric DB id as the canonical public route identifier.

### 5.3 Query-string policy

Query parameters may represent shareable user intent, such as a durable filter or selected tab, only when they are useful after refresh and do not leak sensitive data.

Do not expose:

- internal DB ids;
- row indexes;
- transient pagination counters used only by a component;
- raw permission or role values;
- tenant identifiers when derivable from the active session;
- attachment object keys or R2 paths.

A list page may retain durable filters in the URL. A selected workorder should use the opaque route segment rather than `?page=4`, `?index=7`, or `?workOrderId=123`.

### 5.4 Compatibility and migration

Codex must inventory current route shapes before implementation.

Migration requirements:

- existing internal links should redirect to the canonical opaque route when safe;
- redirects must re-check tenant and permission scope;
- old sequential routes must not become an oracle that confirms record existence;
- shared links and browser bookmarks require a compatibility period or explicit break decision;
- server and client navigation must use the same route builder;
- analytics and logs should prefer the public id and must not record sensitive query values;
- APIs may continue using internal keys behind the repository boundary, but UI route construction must not expose them.

### 5.5 Refresh, direct link, and navigation behavior

Acceptance criteria:

- refreshing the detail route restores the same authorized workorder;
- opening a copied authorized link works after authentication;
- unauthorized users receive the existing not-found/forbidden behavior without record disclosure;
- browser back returns to the previous list/filter state where feasible;
- closing a drawer/modal does not mutate the canonical detail route unexpectedly;
- mobile drawer selection and desktop multi-panel selection resolve to the same canonical workorder identity;
- deleted, archived, or inaccessible workorders use a clear safe state;
- route changes do not reset unsaved edits without the existing guard.

### 5.6 Security

Opaque identifiers reduce casual enumeration but are not authorization. Every read and mutation must retain:

- active session checks;
- tenant scope;
- role/permission checks;
- resource state checks;
- audit behavior where already required.

Do not claim the routing change alone is a security control.

## 6. Implementation inventory for Codex

Before editing, Codex should identify:

- system-admin storage usage page and cylinder/progress components;
- customer-admin plan/storage panel;
- WAFL storage/file foundations;
- company settings file-field components;
- system-admin company file review surfaces;
- workspace workorder list/detail route builders;
- `/worker` legacy route relationship;
- APIs and repositories that resolve workorder identifiers;
- tests that assert route shape, permission, storage state, and responsive behavior.

Expected candidate areas include:

- `app/(system)/system/storage-usage/**`
- `components/admin/dashboard/**`
- company settings and file upload components
- `app/(workspace)/workspace/workorders/**`
- `app/(workspace)/worker/**`
- `features/workorders/**`
- shared navigation and route helper modules
- storage and workorder contract tests

This is an investigation list, not permission to edit every listed path.

## 7. Codex sprint split

Recommended implementation order:

### Sprint A — storage cylinder

- inventory current data and components;
- create or restore shared WAFL cylinder;
- replace rectangular default in agreed system/customer surfaces;
- add threshold, error, stale, and accessibility states;
- verify responsive fixtures.

### Sprint B — company file fields

- consolidate repeated label/badge text;
- align representative image and registration certificate states;
- preserve upload, review, permission, quota, and audit behavior;
- verify mobile/tablet/desktop.

### Sprint C — workorder public identifiers

- document current route and DB/API dependencies;
- choose public-id storage strategy;
- create route builder/resolver;
- add compatibility redirect;
- add authorization and anti-enumeration tests;
- preserve unsaved-change and navigation behavior.

If Sprint C requires a DB column, migration, backfill, or production write, stop for explicit approval and execute it as a separate guarded data sprint.

## 8. Verification matrix

Automatic:

- TypeScript;
- Next build;
- roadmap development contract;
- WAFL storage/file contract;
- storage quota contract;
- company file upload/permission contract;
- workorder route/permission contract;
- mutation audit high-risk 0;
- package and lockfile unchanged unless separately approved.

Manual/Vercel:

- PC Chrome;
- iPhone Safari and Chrome;
- Android Chrome;
- iPad Safari;
- Galaxy Tab Chrome;
- storage states at 79%, 80%, 100%, and above quota;
- long filename and rejection reason;
- representative image preview;
- workorder direct link, refresh, back, unauthorized access;
- no horizontal overflow;
- no loss of unsaved work.

## 9. Stop conditions

Stop and request explicit approval when:

- DB schema, migration, or backfill is required;
- existing public links must be broken;
- workorder identifier policy conflicts with PDF/share-link policy;
- tenant or permission behavior must change;
- R2 keys or file retention must change;
- package/lockfile changes are required;
- production data mutation is needed.

## 10. Decisions still open

The following are implementation decisions requiring source investigation, not product-policy decisions:

- reuse an existing stable workorder code or add a dedicated public id;
- exact compatibility duration for old routes;
- whether customer and system storage surfaces share one component or one presentation model with two shells;
- whether file status vocabulary already has a canonical enum.

Codex must report findings before choosing a schema-changing option.
