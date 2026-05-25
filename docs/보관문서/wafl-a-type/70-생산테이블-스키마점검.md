# 70. 생산구성 현재값 테이블 schema audit

## 기준 버전

- 기준 원본: 0.15.46
- 다음 반영 버전: 0.15.47
- 범위: `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`
- 목적: 작업지시서 생산구성 현재값 테이블의 컬럼 역할을 재정의하고, 불필요한 row 누적 및 중복 컬럼을 줄이기 위한 DB 정리 기준을 확정한다.

## 전제

이 문서는 schema를 즉시 변경하지 않는다. 0.15.47에서는 컬럼과 저장 정책 기준을 문서로 확정하고, 후속 버전에서 `full_reset.sql`, repository, 조회 mapper를 함께 정리한다.

현재 개발 단계에서는 기존 데이터 보존보다 구조 단순화와 명확성이 우선이다. 데이터 reset이 가능하므로 legacy 호환이나 `is_active=false` 누적 방식은 기본 전략에서 제외한다.

## 테이블 역할 재정의

세 테이블은 모두 “작업지시서의 현재 확정 생산구성”만 저장한다.

- `orders`: 작업지시서별 공장 발주 현재 row
- `spec_sheet_materials`: 작업지시서별 원단/부자재 현재 row
- `spec_sheet_outsourcing_lines`: 작업지시서별 외주공정 현재 row

세 테이블은 이력 테이블이 아니다. 검토요청, 검토완료, 발주요청, 발주완료 등 이벤트 시점의 과거 값은 별도 snapshot/history 테이블에서 다룬다.

## 저장 정책

현재값 테이블은 replace 저장 방식을 기준으로 한다.

```sql
DELETE FROM orders WHERE spec_sheet_id = :spec_sheet_id;
INSERT INTO orders (...현재 공장 발주 rows...);

DELETE FROM spec_sheet_materials WHERE spec_sheet_id = :spec_sheet_id;
INSERT INTO spec_sheet_materials (...현재 원단/부자재 rows...);

DELETE FROM spec_sheet_outsourcing_lines WHERE spec_sheet_id = :spec_sheet_id;
INSERT INTO spec_sheet_outsourcing_lines (...현재 외주공정 rows...);
```

이 방식에서는 `is_active=false` row를 남기지 않는다. 해당 작업지시서의 현재 row 수가 3개에서 1개로 바뀌면 DB에도 현재 row 1개만 남는다.

## 공통 삭제 후보 컬럼

### `company_name`

삭제 후보.

- `company_id`로 `companies`를 조인하면 된다.
- 현재값 테이블에 회사명을 중복 저장하면 회사명 변경 시 불일치가 생긴다.
- 과거 회사명 snapshot이 필요하면 production snapshot/history에 저장한다.

### `is_active`

삭제 후보.

- 현재값만 저장하는 테이블에서는 불필요하다.
- false row 누적은 조회 조건, 통계, 디버깅을 복잡하게 만든다.
- row 변경은 비활성화가 아니라 `spec_sheet_id` 기준 replace로 처리한다.

### `deleted_at`

삭제 후보.

- 작업지시서 삭제/복원은 작업지시서와 첨부/메모/휴지통 흐름에서 관리한다.
- 생산구성 row 단독 휴지통 복원 요구가 없으면 개별 `deleted_at`은 필요하지 않다.
- 이력은 현재값 테이블이 아니라 snapshot/history에 둔다.

### `created_at`, `updated_at`

삭제 후보.

- 세 테이블의 row는 독립 문서가 아니라 작업지시서에 종속된 현재 구성이다.
- 생성/수정 시점은 `spec_sheets.created_at`, `spec_sheets.updated_at`, workflow/history로 판단한다.
- replace 저장 방식에서는 row 자체의 created/updated 의미가 약하다.

## `unit_price_basis` 판단

별도 컬럼으로 추가하지 않는다.

화면의 “단가기준”은 단가를 설명하는 표시 문구이며, 별도 DB 값으로 보관할 독립 의미가 없다. 실제 저장값은 다음 네 값이면 충분하다.

- `quantity`
- `unit`
- `unit_cost`
- `total_cost`

예: 단위가 `박스`, 단가가 `10000`이면 화면에서 “박스당” 같은 문구를 만들 수 있다. 따라서 `unit_price_basis`는 schema에 추가하지 않는다.

## 조인 사용 기준

조인을 지나치게 피하지 않는다. 현재 규모와 사용 흐름에서는 `company_id`, `spec_sheet_id`, `partner_id` 중심 인덱스를 두고 적절히 조인하는 편이 중복 컬럼을 줄인다.

기본 원칙:

- 기준정보명은 가능하면 ID 저장 + 조인 표시
- 과거 표시명 snapshot은 현재값 테이블이 아니라 snapshot/history에 저장
- 조회 성능은 인덱스로 보완

## `orders` 정리안

### 현재 역할

공장별 발주 row를 저장한다.

### 유지 후보

```txt
id
company_id
spec_sheet_id
source_order_entry_id
factory_partner_id
quantity
due_date
labor_cost
loss_cost
status
```

### 삭제 후보

```txt
company_name
factory_name
is_active
deleted_at
created_at
updated_at
```

### 판단

- `factory_name`은 `factory_partner_id` 기준 `partners` 조인으로 표시한다.
- 업체명이 없는 임시 입력을 허용해야 한다면 별도 임시명 컬럼을 둘 수 있으나, 현재 기준에서는 협력업체 기준정보를 사용하는 방향이 더 안정적이다.
- `status`는 공장 발주 row의 진행 상태가 실제 발주/검수 흐름에 쓰일 수 있으므로 당장 제거하지 않는다.

## `spec_sheet_materials` 정리안

### 현재 역할

작업지시서별 원단/부자재 row를 저장한다.

### 유지 후보

```txt
id
company_id
spec_sheet_id
source_material_id
material_type
vendor_partner_id
name
quantity
unit
unit_cost
total_cost
```

### 삭제 후보

```txt
company_name
vendor
status
is_active
deleted_at
created_at
updated_at
unit_price_basis
```

### 판단

- `vendor` text는 가능하면 `vendor_partner_id`로 대체한다.
- 자재 row 자체의 `status`는 현재 workflow에서 의미가 명확하지 않다.
- 나중에 자재 발주/입고/정산 상태가 필요하면 `material_orders` 또는 별도 발주 테이블에서 관리한다.
- 현재 작업지시서의 자재 구성에는 현재값만 남긴다.

## `spec_sheet_outsourcing_lines` 정리안

### 현재 역할

작업지시서별 외주공정 row를 저장한다.

### 유지 후보

```txt
id
company_id
spec_sheet_id
source_outsourcing_id
process
vendor_partner_id
quantity
unit
unit_cost
total_cost
```

### 삭제 후보

```txt
company_name
vendor
status
is_active
deleted_at
created_at
updated_at
unit_price_basis
```

### 판단

- `vendor` text는 가능하면 `vendor_partner_id`로 대체한다.
- 외주공정 row 자체의 `status`는 현재값 테이블에서는 제거 후보이다.
- 외주 발주/완료/정산 상태가 필요하면 별도 외주 발주 테이블 또는 snapshot/history에서 관리한다.

## 인덱스 방향

schema 정리 후 기본 인덱스는 단순하게 둔다.

```sql
CREATE INDEX orders_spec_sheet_idx ON orders (spec_sheet_id);
CREATE INDEX orders_company_spec_sheet_idx ON orders (company_id, spec_sheet_id);
CREATE INDEX orders_factory_partner_idx ON orders (factory_partner_id);

CREATE INDEX spec_sheet_materials_spec_sheet_idx ON spec_sheet_materials (spec_sheet_id);
CREATE INDEX spec_sheet_materials_company_spec_sheet_idx ON spec_sheet_materials (company_id, spec_sheet_id);
CREATE INDEX spec_sheet_materials_vendor_partner_idx ON spec_sheet_materials (vendor_partner_id);
CREATE INDEX spec_sheet_materials_type_idx ON spec_sheet_materials (material_type);

CREATE INDEX spec_sheet_outsourcing_lines_spec_sheet_idx ON spec_sheet_outsourcing_lines (spec_sheet_id);
CREATE INDEX spec_sheet_outsourcing_lines_company_spec_sheet_idx ON spec_sheet_outsourcing_lines (company_id, spec_sheet_id);
CREATE INDEX spec_sheet_outsourcing_lines_vendor_partner_idx ON spec_sheet_outsourcing_lines (vendor_partner_id);
```

`is_active`, `deleted_at`, `created_at`, `updated_at` 기반 인덱스는 현재값 테이블에서는 제거한다.

## snapshot/history 분리 방향

이력이 필요하면 별도 테이블로 분리한다.

```txt
workorder_production_snapshots
```

후보 컬럼:

```txt
id
company_id
spec_sheet_id
event_type
snapshot_json
created_by
created_at
```

이 테이블은 검토요청/검토완료/발주요청/완료 같은 이벤트 시점의 생산구성 전체를 JSON snapshot으로 남기는 역할을 한다.

역할 분리:

```txt
orders / spec_sheet_materials / spec_sheet_outsourcing_lines
= 현재 확정 생산구성

workorder_production_snapshots
= 이벤트 시점 이력
```

## 후속 작업 순서

### 0.15.48

- `spec_sheet_materials`, `spec_sheet_outsourcing_lines` 저장 방식을 `is_active=false` 누적 방식에서 `spec_sheet_id` 기준 replace 방식으로 변경한다.
- schema는 아직 변경하지 않더라도 repository에서 false row를 더 이상 만들지 않도록 한다.

### 0.15.49

- `orders` 저장 방식도 동일 기준으로 점검한다.
- 세 테이블의 replace 저장 정책을 공통화한다.

### 0.15.50

- `full_reset.sql`에서 세 테이블의 불필요 컬럼 제거를 반영한다.
- 관련 인덱스를 함께 정리한다.

### 0.15.51

- repository 조회/저장 mapper를 새 schema 기준으로 단순화한다.
- column candidate/fallback 호환 코드를 제거한다.

### 0.15.52

- production snapshot/history 테이블 도입 여부를 결정하고, 필요 시 이벤트별 snapshot 저장을 추가한다.
