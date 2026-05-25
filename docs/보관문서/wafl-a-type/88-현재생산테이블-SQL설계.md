# 0.15.65 — 생산구성 현재값 테이블 컬럼 정리 SQL 설계

## 목적

`orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`는 작업지시서의 현재 확정 생산구성만 저장하는 테이블로 정리한다.

이 문서는 바로 실행하는 migration이 아니라, 0.15.66에서 `full_reset.sql`과 repository mapping을 동시에 정리하기 위한 SQL 설계 기준이다.

## 전제

- 현재 개발 단계에서는 기존 테스트 데이터 리셋이 가능하다.
- 세 테이블은 이력 테이블이 아니다.
- 검토요청, 검토완료, 발주요청, 생산구성 저장처럼 허용된 serviceCode에서만 replace 저장한다.
- 반려, 취소, 되돌리기, 메모, 첨부, 삭제/복원/purge 계열은 세 테이블을 변경하지 않는다.
- 이력 또는 이벤트 시점 보존이 필요하면 `workorder_production_snapshots` 후보 테이블로 분리한다.

## 현재 문제

현재 `full_reset.sql` 기준 세 테이블은 현재값 테이블과 soft-delete/history 성격이 섞여 있다.

공통 제거 후보:

```txt
company_name
is_active
deleted_at
created_at
updated_at
```

추가 제거 후보:

```txt
orders.factory_name
spec_sheet_materials.vendor
spec_sheet_materials.status
spec_sheet_outsourcing_lines.vendor
spec_sheet_outsourcing_lines.status
```

판단:

- `company_name`, `factory_name`, `vendor`는 조인 또는 화면 입력 snapshot 정책이 명확해진 뒤 별도 처리한다.
- 현재 테이블 목적이 “현재 생산구성”이면 `is_active`, `deleted_at`은 필요하지 않다.
- row 자체의 생성/수정 시간은 작업지시서 또는 workflow history 기준으로 추적한다.
- row 변경 이력은 현재 테이블에 false row를 쌓지 않고 snapshot/history 테이블로 분리한다.

## 목표 schema 초안

### orders

```sql
CREATE TABLE orders (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_order_entry_id text,
  factory_partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 0,
  due_date text,
  labor_cost integer NOT NULL DEFAULT 0,
  loss_cost integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'
);
```

유지 이유:

- `company_id`: 회사 scope, 통계/권한 필터 기준.
- `spec_sheet_id`: 작업지시서 연결 기준.
- `source_order_entry_id`: 화면 draft row와 DB row 추적 기준.
- `factory_partner_id`: 공장 업체 조인 기준.
- `quantity`, `due_date`, `labor_cost`, `loss_cost`: 공장 발주 현재값.
- `status`: 공장 발주 상태가 실제 사용되는지 0.15.66에서 코드 참조를 재확인한다. 미사용이면 제거 후보로 유지한다.

삭제 기준:

- `company_name`: `companies` 조인.
- `factory_name`: `factory_partner_id` → `partners` 조인.
- `is_active`, `deleted_at`: replace 저장 방식에서는 불필요.
- `created_at`, `updated_at`: 현재값 row 단위 추적보다 작업지시서/workflow history 추적이 적합.

### spec_sheet_materials

```sql
CREATE TABLE spec_sheet_materials (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_material_id text,
  material_type text,
  name text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0
);
```

유지 이유:

- `company_id`: 회사 scope, 통계/권한 필터 기준.
- `spec_sheet_id`: 작업지시서 연결 기준.
- `source_material_id`: 화면 draft row와 DB row 추적 기준.
- `material_type`: 원단/부자재 구분.
- `name`: 자재명은 현재 기준정보 테이블이 확정되지 않았으므로 현재값으로 저장 유지.
- `quantity`, `unit`, `unit_cost`, `total_cost`: 자재 현재값.

삭제 기준:

- `company_name`: `companies` 조인.
- `vendor`: 업체 기준정보 연결이 확정되면 `vendor_partner_id` 또는 별도 발주 테이블에서 처리한다. 현재 세 테이블 단순화 단계에서는 제거 후보.
- `status`: 자재 row 자체의 상태가 명확하지 않다. 발주 상태는 후속 `material_orders` 또는 발주 이력 테이블에서 처리한다.
- `is_active`, `deleted_at`, `created_at`, `updated_at`: 현재값 replace 방식에서는 불필요.

보류:

- `vendor_partner_id`: 현재 repository/view model에서 안정적으로 사용 중인지 확인 후 0.15.66 또는 이후 추가 여부를 결정한다. 지금은 무리하게 추가하지 않는다.

### spec_sheet_outsourcing_lines

```sql
CREATE TABLE spec_sheet_outsourcing_lines (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_outsourcing_id text,
  process text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0
);
```

유지 이유:

- `company_id`: 회사 scope, 통계/권한 필터 기준.
- `spec_sheet_id`: 작업지시서 연결 기준.
- `source_outsourcing_id`: 화면 draft row와 DB row 추적 기준.
- `process`: 외주공정명.
- `quantity`, `unit`, `unit_cost`, `total_cost`: 외주공정 현재값.

삭제 기준:

- `company_name`: `companies` 조인.
- `vendor`: 업체 기준정보 연결이 확정되면 `vendor_partner_id` 또는 별도 외주 발주 테이블에서 처리한다. 현재 세 테이블 단순화 단계에서는 제거 후보.
- `status`: 외주 row 자체의 상태가 명확하지 않다. 외주 발주 상태는 별도 발주/이력 테이블에서 처리한다.
- `is_active`, `deleted_at`, `created_at`, `updated_at`: 현재값 replace 방식에서는 불필요.

## 인덱스 설계 초안

현재값 replace 방식에서는 active/deleted 조건 인덱스가 필요 없다.

### orders

```sql
CREATE INDEX orders_spec_sheet_idx ON orders (spec_sheet_id);
CREATE INDEX orders_company_spec_sheet_idx ON orders (company_id, spec_sheet_id);
CREATE INDEX orders_factory_partner_idx ON orders (factory_partner_id);
CREATE INDEX orders_source_order_entry_idx ON orders (source_order_entry_id);
CREATE INDEX orders_company_status_due_idx ON orders (company_id, status, due_date);
```

삭제 후보:

```sql
orders_active_idx
orders_spec_sheet_active_idx
orders_company_status_due_idx WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true
orders_company_factory_created_idx
orders_company_created_idx
```

### spec_sheet_materials

```sql
CREATE INDEX spec_sheet_materials_spec_sheet_idx ON spec_sheet_materials (spec_sheet_id);
CREATE INDEX spec_sheet_materials_company_spec_sheet_idx ON spec_sheet_materials (company_id, spec_sheet_id);
CREATE INDEX spec_sheet_materials_type_idx ON spec_sheet_materials (material_type);
CREATE INDEX spec_sheet_materials_source_material_idx ON spec_sheet_materials (source_material_id);
```

삭제 후보:

```sql
spec_sheet_materials_active_idx
```

### spec_sheet_outsourcing_lines

```sql
CREATE INDEX spec_sheet_outsourcing_lines_spec_sheet_idx ON spec_sheet_outsourcing_lines (spec_sheet_id);
CREATE INDEX spec_sheet_outsourcing_lines_company_spec_sheet_idx ON spec_sheet_outsourcing_lines (company_id, spec_sheet_id);
CREATE INDEX spec_sheet_outsourcing_lines_process_idx ON spec_sheet_outsourcing_lines (process);
CREATE INDEX spec_sheet_outsourcing_lines_source_outsourcing_idx ON spec_sheet_outsourcing_lines (source_outsourcing_id);
```

삭제 후보:

```sql
spec_sheet_outsourcing_lines_active_idx
```

## full_reset.sql 반영 범위

0.15.66에서 동시에 수정해야 하는 범위:

```txt
1. CREATE TABLE orders
2. CREATE TABLE spec_sheet_materials
3. CREATE TABLE spec_sheet_outsourcing_lines
4. 세 테이블 관련 CREATE INDEX
5. repository insert mapping
6. repository select mapping
7. read/detail query에서 is_active/deleted_at 조건 제거
8. material_stocks, material_orders, factory order 관련 FK 영향 확인
```

특히 아래 FK는 유지 가능하지만, 제거되는 컬럼을 참조하지 않는지 확인한다.

```txt
material_stocks.source_spec_sheet_material_id → spec_sheet_materials(id)
material_orders.spec_sheet_material_id → spec_sheet_materials(id)
```

## repository mapping 영향

0.15.66에서 확인해야 할 파일:

```txt
lib/workorder/repository/dbFactoryOrderRepository.ts
lib/workorder/repository/dbSpecSheetMaterialRepository.ts
lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
lib/workorder/repository/dbWorkOrderRepository.ts
```

정리 기준:

- insert query에서 제거 컬럼을 빼야 한다.
- select query에서 제거 컬럼을 읽지 않아야 한다.
- 조회 조건에서 `is_active = true`, `deleted_at IS NULL` 조건을 제거한다.
- orders/materials/outsourcing은 replace 저장이므로 조회는 `spec_sheet_id` 기준 현재 row 전체를 읽는다.
- 회사 scope는 `company_id`로 유지한다.

## 조인 정책

이 세 테이블에서는 이름 중복 저장을 줄이는 방향으로 간다.

```txt
company_name → companies 조인
factory_name → partners 조인
vendor → 후속 partner 연결 정책 확정 후 조인 또는 별도 발주 테이블로 이동
```

단, 현재 화면에서 업체명을 자유 입력하는 흐름이 남아 있으면 조인 전환 전에 `partner_id` 정책을 먼저 확정해야 한다. 0.15.66에서는 무리하게 vendor partner화를 하지 않고, 현재 repository mapping과 충돌하지 않는 범위부터 정리한다.

## 적용 순서 제안

```txt
0.15.66
- full_reset.sql에서 세 테이블과 인덱스 정리
- repository insert/select mapping 동시 수정
- 기존 false/deleted 조건 제거

0.15.67
- 검토요청/반려/재검토요청/검토완료 회귀 테스트
- 기존 테스트 DB full reset 후 세 테이블 row 수 확인

0.15.68
- partner 조인 전환 여부 검토
- vendor/factory name snapshot 필요 여부 재검토

0.15.69
- production snapshot/history 테이블 설계
```

## 이번 버전의 변경 범위

- 문서 설계만 추가한다.
- `full_reset.sql`은 아직 변경하지 않는다.
- repository 코드는 아직 변경하지 않는다.
- `APP_VERSION`만 0.15.65로 올린다.
