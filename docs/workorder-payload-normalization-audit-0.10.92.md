# 작업지시서 payload 의존도 진단 및 정규화 전환 계획 — 0.10.92

## 결론

0.10.91의 속도 개선은 `summary` 조회에서 `spec_sheets.payload` 전체를 전송하지 않도록 줄인 1차 경량화다. 근본 해결은 `spec_sheets.payload`를 운영 데이터의 주 저장소로 쓰지 않도록 제거하는 방향이 맞다.

현재 `full_reset.sql` 기준으로 payload 컬럼이 남아 있는 테이블은 다음이다.

- `spec_sheets.payload jsonb NOT NULL DEFAULT '{}'::jsonb`
- `spec_sheet_materials.payload jsonb`
- `material_stocks.payload jsonb`
- `spec_sheet_outsourcing_lines.payload jsonb`

작업지시서 본문 데이터는 최종적으로 아래 정규 테이블 기준으로 저장/조회해야 한다.

- `spec_sheets`: 작업지시서 header/meta/status/delete/purge/reorder/category id
- `orders`: 발주/공장 발주 row
- `spec_sheet_materials`: 원부자재/생산 구성 row
- `spec_sheet_outsourcing_lines`: 외주 공정 row
- `attachments`: 디자인/문서/메모 첨부 파일 metadata
- `memos`: 텍스트 메모 thread/reply
- `audit_logs`: 변경 이력/관리자 감사 로그

## 현재 payload 의존 지점

### 1. schema

`db/schema/full_reset.sql`에 payload 컬럼이 남아 있다. 특히 `spec_sheets.payload`는 `NOT NULL DEFAULT '{}'::jsonb`라서 현재도 신규 작업지시서 저장 시 payload 저장을 전제로 한다.

### 2. 작업지시서 repository

`lib/workorder/repository/dbWorkOrderRepository.ts`가 payload 의존의 중심이다.

현재 주요 의존은 다음과 같다.

- `PAYLOAD_COLUMN_CANDIDATES`
  - `payload`, `data`, `workorder_payload`, `work_order_payload`까지 동적으로 찾는다.
  - 과거 호환을 위해 만든 구조로 보이며, 현재 schema가 안정화된 뒤에는 제거 대상이다.

- `serializeWorkOrderPayload()`
  - `id`, `title`, `workflowState`, `lastSavedAt`, `attachments`, `memoThreads` 등 일부만 제외하고 나머지 WorkOrder 객체를 payload에 저장한다.
  - 즉 현재도 많은 화면/상태 값이 payload에 들어간다.

- `parsePayloadValue()`
  - DB payload를 다시 WorkOrder 부분 객체로 파싱한다.

- `mapSpecSheetRowToWorkOrder()`
  - `row`의 정규 컬럼을 우선 사용하지만, 값이 없으면 payload fallback을 사용한다.
  - `workOrderKind`, `reorderGroupId`, `reorderRound`, `parentSpecSheetId`, `isDefectOrder`, `category id`, `workflowState`, `lastSavedAt` 등이 fallback 대상이다.

- `mapSpecSheetRowToWorkOrderSummary()`
  - summary에서도 `displayTitle`, `baseTitle`, `category label`, `season`, `priority`, `vendor`, `manager`, `dueDate`, `quantity`, `inventoryQuantity`, `inventoryStatus` 등을 payload에서 읽는다.
  - 0.10.91에서 payload 전체 전송은 줄였지만, 여전히 summary용 payload key를 읽는다.

- `createDbWorkOrder()` / `updateDbWorkOrder()`
  - 작업지시서 저장 시 payload 컬럼에 serialize 결과를 계속 저장한다.

- `updateDbWorkOrderStatePatch()`
  - workflow 상태 patch 시에도 `jsonb_set()`으로 payload의 `workflowState`, `lastSavedAt`, `inventoryQuantity`, `inventoryStatus`, `factoryOrderRequest`, `orderEntries`를 갱신한다.

### 3. 통계 repository

`lib/admin/adminStats.repository.ts` 일부 쿼리가 payload fallback을 사용한다.

주요 예:

- `s.payload->>'category1Label'`
- `s.payload->>'category1'`
- `s.payload->>'category2Label'`
- `s.payload->>'category2'`
- `s.payload->>'category3Label'`
- `s.payload->>'category3'`
- `s.payload->>'name'`
- `s.payload->>'productName'`

통계는 최종적으로 `item_categories`, `spec_sheets.title`, `spec_sheets.category*_id`, `orders`, `attachments`, `memos` 기준으로 계산해야 한다. payload fallback은 제거 대상이다.

### 4. seed

`db/seed/realistic_workorders_seed.sql`도 현재 현실형 더미 데이터 생성 시 payload를 채운다. 정규화 전환 후에는 seed도 payload 없이 정규 컬럼/정규 테이블만 넣어야 한다.

## payload 제거 전 필요한 정규 컬럼

현재 payload에서 읽는 값 중 일부는 정규 컬럼이 없다. payload 제거 전에 아래 컬럼 추가 또는 별도 테이블 매핑이 필요하다.

### spec_sheets에 둘 후보

- `base_title text`
- `display_title text`
- `season text`
- `priority text`
- `vendor text`
- `manager_id text`
- `manager_name text`
- `created_by_id text`
- `created_by_role text`
- `due_date text` 또는 `due_date date`
- `quantity integer NOT NULL DEFAULT 0`
- `inventory_quantity integer NOT NULL DEFAULT 0`
- `inventory_status text NOT NULL DEFAULT 'unchecked'`

단, `vendor`, `due_date`, `quantity`는 발주 row 중심으로 볼지 작업지시서 대표값으로 볼지 정책 확정이 필요하다. 제품 화면에서 목록 카드에 바로 쓰는 대표값이라면 `spec_sheets`에 denormalized summary 컬럼으로 두는 편이 빠르다.

### orders에 둘 후보

- `inspection_status text`
- `inventory_quantity integer`
- `requested_at timestamptz`
- `requested_by_id text`

현재 workflow에서 `orderEntries`, `factoryOrderRequest`, 검수/재고 관련 값이 payload patch 대상이므로 orders 쪽 정규화가 필요하다.

### 별도 summary table 또는 materialized view 후보

목록 속도를 더 안정화하려면 아래 둘 중 하나를 검토할 수 있다.

1. `workorder_summaries` table
   - 저장 시 summary를 같이 갱신
   - 읽기 빠름
   - 쓰기 로직 복잡도 증가

2. SQL view/materialized view
   - 정규 테이블에서 summary를 계산
   - 정합성 유지 쉬움
   - 실시간/성능 정책 필요

현 단계에서는 먼저 `spec_sheets` 대표 컬럼을 보강하고, summary table은 나중에 실제 병목이 남을 때 검토하는 편이 낫다.

## 추천 전환 순서

### 0.10.93 — schema 정규화 1차

목표:

- `spec_sheets.payload` 제거 준비용 정규 컬럼 추가
- `orders`에 workflow/inspection 관련 부족 컬럼 추가 검토
- `full_reset.sql` 기준으로만 반영
- 운영 전이므로 migration보다 reset 기준 정리 우선

주의:

- 이 버전에서 payload 컬럼은 아직 제거하지 않는다.
- 기존 hydrate 로직을 깨지 않기 위해 dual-write 준비까지만 한다.

### 0.10.94 — 저장 dual-write 정리

목표:

- `createDbWorkOrder()` / `updateDbWorkOrder()`가 payload 대신 정규 컬럼에 대표값을 저장
- payload 저장은 임시 호환용 최소 key만 남기거나 중단 준비
- `realistic_workorders_seed.sql`도 정규 컬럼 중심으로 보정

### 0.10.95 — 상세 hydrate 정규 테이블 기준 전환

목표:

- `mapSpecSheetRowToWorkOrder()`에서 payload fallback 제거 시작
- 상세 WorkOrder 조립은 `spec_sheets + orders + materials + outsourcing + attachments + memos` 기준으로 전환
- payload가 비어 있어도 상세 화면이 살아야 한다.

### 0.10.96 — 통계 payload fallback 제거

목표:

- `adminStats.repository.ts`의 `s.payload->>` 참조 제거
- category label은 `item_categories` join으로만 계산
- 제품명은 `spec_sheets.title` 기준으로 계산

### 0.10.97 — payload 컬럼 제거

목표:

- `full_reset.sql`에서 `spec_sheets.payload`, `spec_sheet_materials.payload`, `material_stocks.payload`, `spec_sheet_outsourcing_lines.payload` 제거
- `PAYLOAD_COLUMN_CANDIDATES`, `parsePayloadValue`, `buildPayloadPatchExpression` 등 제거
- `DB_SCHEMA_UNSUPPORTED` 중 payload column type 관련 호환 코드 제거

## 이번 버전에서 제공하는 진단 SQL

`db/schema/workorder_payload_audit_0_10_92.sql`을 추가했다. 이 SQL은 schema를 변경하지 않고 현재 DB에서 다음을 확인한다.

- payload 컬럼이 남아 있는 테이블
- `spec_sheets.payload` row 수/크기
- payload key별 사용 빈도
- payload에서 summary가 읽는 key들의 사용 빈도
- 통계 fallback 후보 key 사용 여부
- 작업지시서별 payload 크기 상위 row
- 정규 컬럼과 payload 값이 어긋나는 후보

실행 예:

```powershell
psql $env:DATABASE_URL -f db/schema/workorder_payload_audit_0_10_92.sql
```

## 다음 판단 기준

진단 SQL 결과에서 아래가 확인되면 payload 제거를 바로 진행해도 된다.

- summary/display용 key들이 대부분 정규 컬럼으로 대체 가능
- payload 크기 상위 row가 화면 속도에 영향을 줄 정도로 큼
- 정규 컬럼과 payload fallback 값이 충돌함
- `orders`, `materials`, `outsourcing`, `attachments`, `memos`에 이미 필요한 row가 존재함

반대로 payload가 아직 유일한 데이터 저장소인 key가 많다면, 먼저 정규 컬럼 또는 관련 테이블을 추가한 뒤 제거해야 한다.
