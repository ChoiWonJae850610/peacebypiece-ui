# 작업지시서 정규화 schema 1차 — 0.10.93

## 목적

`spec_sheets.payload`를 작업지시서 주 저장소로 사용하던 구조를 중단하고, 목록/상세/통계에 필요한 핵심 값을 정규 컬럼과 하위 테이블에서 읽도록 전환한다.

## 이번 버전에서 바꾼 것

- `db/schema/full_reset.sql`에서 아래 payload 컬럼을 제거했다.
  - `spec_sheets.payload`
  - `spec_sheet_materials.payload`
  - `material_stocks.payload`
  - `spec_sheet_outsourcing_lines.payload`
- `spec_sheets`에 작업지시서 header/summary용 정규 컬럼을 추가했다.
  - `display_title`, `base_title`
  - `category1`, `category2`, `category3`
  - `season`, `priority`, `vendor`, `manager`, `manager_id`
  - `created_by_id`, `created_by_role`
  - `due_date`, `quantity`
  - `inventory_quantity`, `inventory_status`
  - `memo`
- `dbWorkOrderRepository`가 payload 없이도 작업지시서 목록/상세를 만들 수 있도록 보정했다.
- 작업지시서 상세는 `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`에서 다시 조립한다.
- 관리자 통계 쿼리의 `s.payload->>` fallback을 정규 컬럼 기준으로 바꿨다.
- 현실형 seed가 payload 없이 정규 컬럼과 하위 테이블에 데이터를 넣도록 수정했다.

## 아직 남겨둔 것

`dbWorkOrderRepository` 내부에는 구형 DB를 읽기 위한 payload 호환 코드가 일부 남아 있다. 다만 0.10.93의 `full_reset.sql` 기준 DB에는 payload 컬럼이 생성되지 않으므로 신규 reset 환경에서는 사용되지 않는다.

다음 단계에서 제거할 수 있는 항목:

1. `PAYLOAD_COLUMN_CANDIDATES`
2. `parsePayloadValue`
3. `serializeWorkOrderPayload`
4. `buildPayloadPatchExpression`
5. create/update의 payload column 분기

한 번에 제거하지 않은 이유는 기존 로컬 DB나 테스트 DB가 아직 payload 컬럼을 가진 상태로 남아 있을 수 있기 때문이다. 이번 버전은 full reset 기준 정규화 schema를 먼저 확정하는 1차 단계다.

## reset 실행 순서

```powershell
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/seed/system_standards_seed.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
psql $env:DATABASE_URL -f db/seed/realistic_workorders_seed.sql
```

## 진단 SQL

```powershell
psql $env:DATABASE_URL -f db/schema/workorder_payload_audit_0_10_92.sql
```

0.10.93 이후 정상 기준:

- payload 컬럼 잔존 여부 결과가 비어 있어야 한다.
- `spec_sheets` 정규화 핵심 컬럼은 모두 `present`여야 한다.
- realistic seed 실행 후 정규 컬럼 count가 0보다 커야 한다.

## 다음 권장 작업

0.10.94에서 payload 호환 코드 제거 2차를 진행한다.

- repository 내부 payload 관련 함수 삭제
- create/update에서 payload 분기 제거
- state patch에서 payload patch 제거
- 작업지시서 상세 조립을 정규 테이블 전용으로 고정
