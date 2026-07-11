# WAFL v2 v1 DB, API, and Performance Read-only Audit

Version: `2.0.0-alpha.19`
Status: read-only source audit; no DB connection, benchmark, migration, or runtime mutation
Audited baseline: commit `53869e0e8fa24adabbcf5feea57059cea3c163aa`

## 1. 결론

v1은 회사 범위와 핵심 업무 데이터를 관계형 테이블로 관리하고 있으며, 원단·부자재·공정·치수표를 거대한 JSON 한 칸에 저장하지 않는다. 이 기반은 재사용 가치가 있다. 그러나 작업지시서 목록과 저장 경로는 회사당 수백 건부터 비용이 빠르게 커지는 구조다.

소스로 확인된 핵심 병목은 다음과 같다.

- `GET /api/workorders`는 pagination 없이 회사의 전체 작업지시서와 자식 행, 첨부를 반환한다.
- `GET /api/workorders/summary`도 pagination이 없고, 모든 row에 4개 lateral aggregate를 실행하며 원단·부자재 전체를 `material_items` JSON으로 만든다.
- 화면 검색은 API 검색이 아니라 이미 받은 전체 배열을 클라이언트에서 필터링한다.
- full save는 원단, 공정, 공장발주 자식 행을 각각 전체 삭제 후 행 단위로 재삽입한다.
- bulk save 사전 조회는 작업지시서별 detail 조회를 반복하는 N+1 경로다.
- `spec_sheets.due_date`와 `orders.due_date`가 `text`, `spec_sheets.created_at/updated_at`가 timezone 없는 timestamp다.
- 발행 문서는 독립 revision/document record 없이 `attachments.generated_document_type`로 구분된다. renderer/schema/hash/snapshot identity가 없다.

따라서 v2는 v1 테이블을 전부 폐기하지 않는다. 회사·거래처·자재 master·발주 allocation·치수표 패턴은 보존하되, `spec_sheets` 중심 aggregate와 현재값/PDF 상태 혼합은 revision 중심 도메인으로 교체한다.

## 2. 감사 근거와 한계

### 실제 확인 경로

- 현재 bootstrap schema: `db/schema/full_reset.sql`
- additive migrations: `db/migrations/*.sql`
- workorder routes: `app/api/workorders/**`
- workorder API handlers: `lib/workorder/api/workOrderRouteHandlers.ts`
- workorder read/query: `lib/workorder/repository/dbWorkOrderReadFlows.ts`, `dbWorkOrderSelectSql.ts`, `dbWorkOrderDetailRows.ts`
- workorder save: `lib/workorder/repository/dbSpecSheetMaterialRepository.ts`, `dbSpecSheetOutsourcingRepository.ts`, `dbFactoryOrderRepository.ts`
- attachment persistence: `lib/workorder/persistence/dbAttachmentRepository.ts`
- material and order: `lib/materials/repository.ts`, `lib/material-orders/repository.ts`
- size spec: `db/migrations/patch_0_24_34_workorder_size_spec_and_pdf.sql`, `lib/workorder/sizeSpec/repository.ts`
- PDF routes: `app/api/workorders/[workOrderId]/generated/**`
- tenant scope: `lib/auth/apiRouteGuards.ts`, `lib/workorder/repository/dbWorkOrderRepositoryScope.ts`
- current DB policies: `docs/project/27-database-schema-query-permission-audit.md`, `docs/project/28-database-source-of-truth-safe-migration-design.md`

### 확인하지 않은 것

- 실제 Neon deployed schema와 row count
- 실제 query plan, buffer hit, network latency, payload bytes
- production RLS 존재 여부
- 외부 job/cron이 repository 밖에서 쓰는 테이블
- 실제 500건 데이터의 분포와 평균 자식 row 수

위 항목은 `확인 필요`이며 이 문서에서 사실로 추정하지 않는다.

## 3. v1 schema inventory

`생성 근거: full_reset`은 현재 bootstrap 파일에서 생성됨을 뜻한다. 별도 최초 생성 migration을 저장소에서 확인하지 못한 경우 이를 명시했다.

| 테이블 | 생성 근거 / 실제 사용 경로 | 핵심 구조 | 제약·인덱스·수명주기 | 실제 사용 / 중복 책임 | v2 판단 |
| --- | --- | --- | --- | --- | --- |
| `companies` | `db/schema/full_reset.sql`; company/admin/billing repositories | PK `text`; 활성, onboarding, trial/billing cache | `is_active`; 다수 status check; `companies_active_name_idx` | 사용 중; 회사 profile과 billing cache 책임 혼합 | KEEP_WITH_CHANGE |
| `company_settings` | full_reset; `lib/admin/settings/companyRepository.ts` | PK/FK `company_id`; locale, trash, quota settings | retention check가 1/5/15/30; 현재 확정 정책은 30일 | 사용 중; business timezone/code 설정 확장 필요 | KEEP_WITH_CHANGE |
| `partners` | full_reset; `lib/partners/dbPartnerRepository.ts` | PK `text`, company FK, 업체명/연락/메모 | company/name indexes, active flag | 사용 중; supplier/factory 공통 master로 재사용 가능 | KEEP_WITH_CHANGE |
| `partner_items` | full_reset; partner/material-order repositories | company/partner FK; type/name/process/unit/cost | type check, company+partner+type index | 사용 중; 거래처 취급 품목/공정 기준 | KEEP_WITH_CHANGE |
| `materials` | full_reset; `lib/materials/repository.ts`, `/api/materials` | UUID text PK, company FK, kind/code/name/partner/unit/status | unique(company, code), company+kind/status/name indexes | 사용 중인 master; 작업지시 자재 line과 분리됨 | KEEP_WITH_CHANGE |
| `material_attributes_fabric` | full_reset; materials repository | PK/FK material, composition/width/weight/color | one-to-one | 사용 중 | KEEP |
| `material_attributes_submaterial` | full_reset; materials repository | PK/FK material, spec/color/size | one-to-one | 사용 중 | KEEP |
| `spec_sheets` | full_reset; workorder repositories/routes | PK `text`, company FK, 50개 이상 identity/workflow/category/reorder/inventory/delete 컬럼 | due date `text`; created/updated timezone 없음; list/status/title/vendor/delete indexes | 핵심 사용 중이나 현재값·표시 snapshot·삭제 상태 혼합 | REPLACE |
| `workorder_factory_instructions` | `patch_0_22_96_workorder_factory_instruction.sql`; factory instruction route/repository | PK/FK work_order, company, content, PDF include | content 5000자, company+updated index | 사용 중; 단일 전달 메모 | KEEP_WITH_CHANGE |
| `orders` | full_reset; workorder detail/save | company/spec sheet/factory FK, quantity/due/cost/status | due date `text`; company+sheet/status/due indexes | 공장 발주/생산 entry와 process 책임이 겹침 | REPLACE |
| `spec_sheet_materials` | full_reset; workorder detail/save/summary | company/spec sheet FK, material/vendor/name/qty/unit/cost/status | sheet/vendor/source indexes | 주 사용 자재 line; `workorder_material_lines`와 중복 | REPLACE |
| `workorder_material_lines` | full_reset; runtime 직접 참조 거의 없음 | company/workorder/material FK, role/qty/unit/order status | typed checks 및 company indexes | 미래형 구조이나 실제 workorder save는 사용하지 않음 | DEFER |
| `material_stocks` | full_reset; runtime writer/consumer 확인 부족 | company, source line, available/reserved, copied material fields | source/type/active indexes, soft delete | `material_inventory_lots`와 책임 중복 가능 | UNKNOWN |
| `spec_sheet_outsourcing_lines` | full_reset; workorder detail/save/summary | company/spec sheet/vendor, process/qty/cost/status | sheet/process/vendor indexes | 실제 공정 line으로 사용 | REPLACE |
| `attachments` | full_reset; attachment repository, PDF/upload/view routes | UUID text PK, company/workorder FK(`order_id`), type/key/name/mime/size/primary/generated type | active/deleted/purge fields와 다수 partial index | 이미지·첨부·생성 PDF를 한 테이블에 혼합 | KEEP_WITH_CHANGE |
| `attachment_trash_items` | full_reset; trash/purge/storage repositories | attachment/workorder/company FK, copied object metadata, purge execution state | 30일 default, restore/purge/retry indexes | 삭제 job 책임과 attachment current state가 이중화 | KEEP_WITH_CHANGE |
| `audit_logs` | full_reset; `lib/system/audit/repository.ts` | UUID text PK, actor/company/target/event/severity/summary/metadata JSONB | company/event/target/actor indexes | 시스템 운영 감사로 사용 | KEEP_WITH_CHANGE |
| `history_logs` | full_reset; `lib/admin/history/repository.ts` | UUID text PK, company/user/action/target/message/metadata JSONB | 제한된 action/target check, company/target indexes | 사용자 활동 이력; audit와 경계 불명확 | KEEP_WITH_CHANGE |
| `material_orders` | full_reset; material-order API/repository | UUID text PK, company/supplier/user FK, status/due/amount | status/workflow checks, company+status/supplier indexes | 사용 중인 발주 header | KEEP_WITH_CHANGE |
| `material_order_lines` | full_reset; material-order repository | UUID text PK, company/order/item FK, item/color/spec/unit/qty/price | 수량·금액 check, company+order/item/name indexes | 사용 중인 발주 line | KEEP_WITH_CHANGE |
| `material_order_allocations` | full_reset; material-order repository | UUID text PK, company/line/workorder FK, source key/qty | company+line/workorder indexes | 여러 작업지시서 배분을 지원 | KEEP_WITH_CHANGE |
| `material_inventory_lots` | full_reset; runtime 사용 경로 미확인 | UUID text PK, company/order line FK, received/allocated/remaining | bounds checks와 indexes | schema는 있으나 application writer/reader 미확인 | UNKNOWN |
| `workorder_size_specs` | `patch_0_24_34_workorder_size_spec_and_pdf.sql`; size-spec route/repository | PK/FK work order, company, size set, unit, catalog version | company+updated index | 사용 중; v2 revision 귀속 필요 | KEEP_WITH_CHANGE |
| `workorder_size_spec_sizes` | same migration/repository | composite PK(work order,size), company, label/order | company+workorder+sort index | 사용 중 | KEEP_WITH_CHANGE |
| `workorder_size_spec_poms` | same migration/repository | composite PK(work order,pom), company, measurement type/order | company+workorder+sort index | 사용 중 | KEEP_WITH_CHANGE |
| `workorder_size_spec_values` | same migration/repository | composite PK(work order,size,pom), display+decimal | composite FKs, lookup index | 사용 중; `company_id` 직접 컬럼 없음 | KEEP_WITH_CHANGE |

### 관련 기준정보 테이블

| 테이블군 | 생성 근거 / 책임 | 실제 사용 판단 | v2 판단 |
| --- | --- | --- | --- |
| `units`, `item_categories`, `outsourcing_processes` | `full_reset.sql`; 기존 회사별 단위/분류/공정 | workorder/partner/category repository에서 사용 | KEEP_WITH_CHANGE |
| `system_unit_standards`, `company_enabled_unit_standards` | `full_reset.sql`; system default와 회사 활성화 | standards/admin 경로에서 사용 | KEEP |
| `system_outsourcing_process_standards`, `company_enabled_process_standards` | `full_reset.sql`; 공정 기준/활성화 | partner/process option 경로에서 사용 | KEEP |
| `system_product_type_templates`, `system_product_type_template_categories` | `full_reset.sql`; 구형 제품 템플릿 | 새 system catalog와 책임 중복 가능 | DEFER |
| `system_catalog_versions`, `system_catalog_categories`, `company_catalog_categories` | `patch_0_24_27_system_catalog.sql`; versioned category catalog | system catalog repository/test에서 사용 | KEEP |
| `system_size_sets`, `system_size_options`, `system_category_size_sets`, `company_size_set_activations` | same migration; size set/option/회사 활성화 | size-spec repository가 사용 | KEEP |
| `system_pom_definitions`, `system_category_poms`, `company_pom_activations` | same migration; POM 기준/활성화 | size-spec repository가 사용 | KEEP |
| `company_catalog_provisioning` | same migration; 회사 catalog version provisioning | provisioning 경로 확인 | KEEP_WITH_CHANGE |

### 후보 중 존재하지 않는 구조

- `work_orders`: 없음. 현재 identity는 `spec_sheets`.
- `work_order_revisions`: 없음.
- `generated_documents`: 없음. 생성 PDF는 `attachments` row.
- 작업지시서 color master/matrix: 없음.
- 독립 document number sequence / QR access token: 없음.

### schema source-of-truth 주의

`full_reset.sql`에는 `patch_0_24_27`의 versioned system catalog와 `patch_0_24_34`의 workorder size-spec 내용이 포함되어 있지 않다. 현재 schema 재구성은 bootstrap 후 additive migration 순서를 함께 알아야 한다. v2 migration 전에는 deployed schema fingerprint와 migration ledger를 확인해야 한다.

## 4. API inventory

Query 수는 source 기준 최소 추정치다. 동적 schema discovery와 permission/access query는 제외했으므로 실제 수는 더 클 수 있다.

| Method / route | request / response | query 특성 | pagination / tenant | 위험과 v2 판단 |
| --- | --- | --- | --- | --- |
| `GET /api/workorders` | `{ workOrders: WorkOrder[] }` 전체 detail shape | core 1 + orders/materials/processes batch 3 + attachments batch 1 | 없음 / session company 강제 | 회사 전체와 모든 자식 반환. REPLACE |
| `GET /api/workorders/summary` | status, sort query; summary array | 1 SQL이나 row별 lateral 4개; 모든 material을 JSON aggregate | 없음 / company·assigned scope | list/detail 분리는 시도했지만 payload와 CPU가 큼. REPLACE |
| `GET /api/workorders/:id` | workOrder full detail + meta | core 1 + 자식 3 + attachment 1 | 단건 / company scope | 기본 detail로 유지하되 탭 lazy contract 필요. REPLACE |
| `POST /api/workorders` | `{ workOrder: WorkOrder }` | 전체 aggregate 생성 후 다시 full hydrate | N/A / company scope·permission | 거대한 client aggregate를 신뢰하는 계약. REPLACE |
| `PATCH /api/workorders` | `{ workOrder }` 또는 `{ workOrders[] }` | full save; bulk pre-read N개 detail; 자식 replace | N/A / company scope·policy | 확정 N+1 및 delete/reinsert. REPLACE |
| `PATCH /api/workorders/:id` | `{ patch: WorkOrderStatePatch }` | 필드 patch 가능하나 patch가 자식 배열도 허용 | N/A / company scope | scalar patch는 재사용 가치, collection command 분리 필요. KEEP_WITH_CHANGE |
| `PATCH /api/workorders/inventory-group` | workOrderIds와 inventory 값 | 여러 workorder state patch transaction | N/A / company scope | 전체 ID 검증과 bounded batch limit 필요. KEEP_WITH_CHANGE |
| `GET /api/workorders/status` | DB/repository readiness | legacy payload-column 후보와 schema 상태 확인 | N/A / guarded | 업무 목록 API는 아니며 운영 진단으로 DEFER |
| `GET/PATCH /api/workorders/:id/size-spec` | spec 및 전체 values | route가 먼저 full workorder detail을 hydrate하고 size tables를 별도 조회 | 단건 / company scope | authorization용 full detail 과다 조회; 저장은 sizes/POM/values 전체 replace. KEEP_WITH_CHANGE |
| `GET/PATCH /api/workorders/:id/factory-instruction` | content/include flag | full workorder detail + attachment hydrate 후 instruction query | 단건 / company scope | authorization projection 필요. KEEP_WITH_CHANGE |
| `POST /api/workorders/attachments/upload` | multipart/user file metadata | server upload 준비/저장 경로 | 단건 / company·permission·quota | v2 asset command로 교체, raw R2 key 비노출 유지 |
| `POST .../upload/direct`, `POST .../upload/complete` | prepare/complete metadata | signed/Worker upload 2단계 | 단건 / company·permission·quota | metadata/object transaction과 idempotency 강화. KEEP_WITH_CHANGE |
| `POST /api/workorders/attachments/primary` | workOrderId, attachmentId | 대표 이미지 상태 갱신 | 단건 / company scope | revision 대표 이미지 snapshot과 분리 필요. KEEP_WITH_CHANGE |
| `POST /api/workorders/attachments/delete` | attachment identity | soft delete + trash row | 단건 / company scope | 30일 lifecycle owner 정리. KEEP_WITH_CHANGE |
| `GET /api/workorders/attachments/file` | attachment/file lookup | proxy/signed object read | 단건 / guarded | raw object URL 비노출 유지. KEEP |
| `GET /api/materials` | 회사 material master 전체 | 1 join query | 없음 / company scope | keyword repository는 있으나 route list는 무제한. KEEP_WITH_CHANGE |
| `GET /api/material-orders` | header+line+allocation 전체 | 3 batch queries | status만, pagination 없음 / company scope | N+1은 피했으나 전체 payload. KEEP_WITH_CHANGE |
| `GET /api/material-orders/suppliers` | supplier options | partner/item join | 없음 / company scope | bounded master contract 필요. KEEP_WITH_CHANGE |
| `POST/PUT/PATCH /api/material-orders` | header와 lines/allocation 또는 status | detail update는 기존 line/allocation 전체 삭제 후 재삽입 | N/A / company scope·permission | command/line delta 필요. KEEP_WITH_CHANGE |
| `GET /api/partners/workorder-options` | 회사의 active partner/options 전체 | partner/item/process 3 query | 없음 / company scope | small master면 허용, 규모 gate 필요. KEEP_WITH_CHANGE |
| `POST .../generated/workorder-pdf` | kind; attachment 결과 | full detail + attachments + size spec + renderer/R2 + attachment insert | 단건 / company scope | PDF row가 revision snapshot이 아님. REPLACE |
| `POST .../generated/order-request-pdf` | requestNote; attachment 결과 | full detail + attachments + renderer/R2 + attachment insert | 단건 / company scope | 발행 입력 snapshot과 document identity 부재. REPLACE |
| generated PDF `GET .../:attachmentId/view` routes | inline/download proxy | attachment lookup 후 object fetch | 단건 / company/workorder guard | generated document token/hash contract로 강화. KEEP_WITH_CHANGE |
| `GET /api/partners/factories` | active factory options | partner repository | 없음 / company scope | option count 측정 후 limit/search. KEEP_WITH_CHANGE |

## 5. payload 및 JSON/JSONB 감사

### DB JSONB

| 테이블.필드 | 현재 내용 | 검색/정렬 필요 | v2 판단 |
| --- | --- | --- | --- |
| `audit_logs.metadata` | event 보조 metadata | 핵심 key는 컬럼 | schema_version을 가진 안전한 비정형 metadata로 KEEP |
| `history_logs.metadata` | 사용자 활동 보조 metadata | 핵심 상태/target은 컬럼 | customer history와 system audit 경계 정리 후 KEEP |
| `signup_applications.business_validation_summary` | 가입 검증 요약 | app-v2 core 밖 | DEFER |
| `company_account_requests.request_payload` | 요청 payload | 핵심 key가 필요하면 컬럼화 | raw body 금지, typed allowlist 필요 |
| `policy_versions.content_snapshot` | immutable 정책 snapshot | 검색 원본 아님 | KEEP |
| billing migration의 `immutable_snapshot`, `quote_snapshot`, `safe_payload`, `safe_summary`, `manifest` | 결제/삭제 증빙 | app-v2 core 밖 | 기존 safe-payload 규칙 유지 |

작업지시서 핵심 row는 DB JSONB에 저장되지 않는다. 문제는 DB JSON이 아니라 API의 `WorkOrder` aggregate가 원단·공정·첨부 배열 전체를 포함하고 full save 계약으로 사용된다는 점이다.

### v2 정책

허용:

- audit/event metadata
- immutable generated-document DTO snapshot
- schema_version이 있는 비핵심 확장값
- 외부 provider의 비밀 제거 요약

금지/지양:

- 원단·부자재·공정·색상×사이즈·치수표
- 납기, 상태, 단가, 수량, 문서번호, revision identity
- tenant, 거래처, 공장, 목록 검색/필터 key
- raw request body, token, signed URL, 이메일 전체 snapshot

## 6. 500건 성능 분석

### 확인된 병목

1. summary와 full list 모두 `LIMIT/cursor/page`가 없다.
2. summary가 모든 workorder row에 orders/materials/processes/attachments lateral aggregate를 실행한다.
3. summary가 각 작업지시서의 모든 자재를 `JSONB_AGG`와 `STRING_AGG`로 반환한다.
4. 일반 list는 자식 3종과 attachment를 전체 회사 범위로 batch hydrate한다.
5. 검색은 `filterWorkOrderList()`에서 전체 client array를 매 입력마다 순회한다.
6. bulk save 사전 조회는 ID별 full detail을 `Promise.all`로 호출한다.
7. full save는 세 자식 collection을 delete 후 행 단위 insert한다.
8. material-order detail update도 line/allocation을 전체 삭제 후 재삽입한다.
9. `due_date text` 정렬은 cast/문자열 형식 불일치 위험이 있다.

### 가능성이 높은 병목

- 500개 summary row의 material JSON 생성 및 network serialization.
- 큰 `WorkOrder[]` React state 갱신과 selector/filter 재계산.
- 대표 썸네일 대신 attachment count만 목록에 있고, 상세 진입 시 전체 attachment URL metadata를 로드하는 비용.
- dynamic schema discovery가 request마다 cache되지 않는 환경에서 information_schema query 비용.
- overlapping workorder indexes가 planner와 write 비용을 늘릴 가능성.

### 확인이 필요한 병목

- 실제 production query plan과 composite index 사용 여부.
- deployed DB의 table/index/RLS가 repository schema와 같은지.
- Neon region과 API runtime 간 network latency.
- 평균/최대 material, attachment, process row 수.
- image URL/thumbnail route의 실제 transfer size와 cache 정책.

### 스키마 문제가 아닌 UI/runtime 병목

- 전체 배열을 단일 React state tree로 유지.
- 검색 input마다 client filter.
- row virtualization 부재 여부.
- selected detail 변경 시 과도한 derived selector/rerender 여부.

### alpha.20~21 측정 항목

- page 30/50의 list SQL `EXPLAIN (ANALYZE, BUFFERS)`.
- 500/5,000 workorder에서 list/detail/search p50/p95.
- query count, returned rows, payload gzip 전/후 bytes.
- React initial mounted row 수와 input-to-render latency.
- current summary SQL과 two-phase page-id/batch aggregate SQL 비교.

## 7. 유지/수정/폐기 판단표

| 현재 구조 | 현재 책임 | 문제 | v2 판단 | 이유 | migration 영향 |
| --- | --- | --- | --- | --- | --- |
| `companies`, `company_settings` | tenant/profile/settings | timezone/company code 부족, 30일 정책 불일치 가능 | KEEP_WITH_CHANGE | 기존 SaaS authority 유지 | additive column 후보 |
| `partners`, `partner_items` | 거래처/취급 품목/공정 | copied labels 존재 | KEEP_WITH_CHANGE | supplier/factory master 재사용 | FK backfill |
| `materials` + attributes | material master | workorder line과 연결 generation이 이원화 | KEEP_WITH_CHANGE | master와 transaction 분리 적절 | v2 line FK optional |
| `spec_sheets` | workorder aggregate | wide row, text date, mixed lifecycle | REPLACE | v2 `work_orders` identity로 단계 전환 | dual-read/backfill 필요 |
| `spec_sheet_materials` | 실제 자재 line | master 연계 약함, 필드 부족 | REPLACE | revision-scoped typed line 필요 | backfill mapping |
| `workorder_material_lines` | master-linked line 후보 | runtime 미사용, 현행 line과 중복 | DEFER | 바로 canonical로 선언 불가 | usage 확인 후 통합 |
| `orders` | 공장 발주/생산 entry | process와 order 개념 혼합 | REPLACE | `work_order_processes`와 command 분리 | mapping 필요 |
| `spec_sheet_outsourcing_lines` | 추가 공정 | revision/lock 없음 | REPLACE | revision-scoped process로 이동 | backfill |
| `attachments` | 이미지/첨부/PDF metadata | asset와 generated document 혼합 | KEEP_WITH_CHANGE | user asset metadata는 재사용 | document row 분리 |
| `attachment_trash_items` | purge queue/evidence | current state와 중복 | KEEP_WITH_CHANGE | 30일 lifecycle 보존 | lifecycle owner 정리 |
| size-spec 4 tables | structured 치수표 | work_order current에 직접 귀속 | KEEP_WITH_CHANGE | 좋은 관계형 패턴 | revision FK로 새 세대 |
| material order 3 tables | 발주와 allocation | pagination 없음, replace save | KEEP_WITH_CHANGE | 업무 모델 재사용 | line relation 정리 |
| `material_stocks`, inventory lots | 재고 | writer/owner 불명확 | UNKNOWN | 소스만으로 canonical 결정 불가 | 삭제 금지 |
| `audit_logs`, `history_logs` | 운영 감사/사용자 이력 | 경계 중복 | KEEP_WITH_CHANGE | 보존 목적은 유효 | event taxonomy 정리 |
| generated PDF as attachment | 현재 PDF 파일 | immutable revision/snapshot 부재 | REPLACE | `generated_documents` 필요 | 기존 attachment 유지·연결 |

## 8. 인덱스 감사

현재 workorder list 계열에는 유사한 partial/composite index가 이미 여러 개 있다. 새 인덱스를 즉시 추가하지 않는다.

- 유지 후보: `(company_id, status, updated_at desc, id)` active partial index.
- 수정 필요: `due_date text` index는 v2 `date` 컬럼으로 교체 후 재평가.
- 검색: `lower(title)` btree는 prefix/equality에는 유용하지만 `%keyword%` contains 검색을 보장하지 않는다. 5,000건 측정 후 `pg_trgm` 또는 FTS를 결정한다.
- 자식: company+workorder index는 갖추었으나 v2 revision+display_order index가 필요하다.
- 중복 후보: `spec_sheets_company_status_updated_idx`와 `idx_spec_sheets_company_active_status_updated`는 실제 predicate별 EXPLAIN 후 하나로 정리한다.

## 9. tenant와 보안

확인된 긍정 요소:

- workorder, material, material-order, partner API는 session에서 company scope를 만들고 SQL에 company predicate를 넣는다.
- assigned visibility도 manager/requested-by 기준으로 제한한다.
- client payload의 company ID를 그대로 업무 scope로 사용하지 않는다.

남은 위험:

- repository schema에는 RLS 정의가 없다.
- attachment repository의 내부 `getWorkOrderCompanyContext(workOrderId)`는 ID만으로 company를 읽는다. 호출 전 route guard가 있어도 repository 자체 방어는 약하다.
- 다수 child table에 company_id를 중복 보유하므로 parent와 불일치한 row를 막는 composite FK가 부족하다.
- system-admin cross-tenant read는 일반 company API와 분리된 명시적 경로가 필요하다.

## 10. 다음 action

1. `13-core-domain-schema-v2.md`를 migration contract의 canonical target으로 검토한다.
2. alpha.20에서 API DTO와 command contract를 코드 없이 더 구체화한다.
3. alpha.21에서 dev/test 전용 500/5,000 seed와 read-only benchmark를 실행한다.
4. deployed schema fingerprint/RLS 확인 전 migration 작성·적용을 시작하지 않는다.

## 11. 확인 필요 / OPEN DECISION

- production에 repository 밖 RLS가 존재하는가.
- `material_stocks`와 `material_inventory_lots` 중 실제 재고 source of truth는 무엇인가.
- 기존 `workorder_material_lines`가 외부 job에서 사용되는가.
- 회사/브랜드 코드와 시즌/품목 코드의 입력·변경 권한.
- final PDF 보존 개수/기간. 30일 휴지통 정책은 확정이지만 발행 문서 보존 정책은 별도다.
