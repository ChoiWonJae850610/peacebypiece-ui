# 89. 생산구성 현재값 테이블 schema / repository mapping 1차 반영

## Version

0.15.66

## 목적

`orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`를 현재 확정 생산구성 테이블로 단순화하는 1차 구현 기준을 반영한다.

## 반영 범위

### full_reset.sql

세 테이블에서 현재값 저장에 불필요한 누적/감사성 컬럼을 제거한다.

제거 컬럼:

- `company_name`
- `is_active`
- `deleted_at`
- `created_at`
- `updated_at`

유지 컬럼:

- `factory_name`
- `vendor`
- `status`

`factory_name`, `vendor`, `status`는 아직 partner 기준 조인 정책과 발주 상태 테이블이 확정되지 않았으므로 이번 단계에서는 제거하지 않는다.

### index

`is_active`, `deleted_at`, `created_at`, `updated_at`에 의존하던 인덱스를 제거하거나 단순 인덱스로 변경한다.

- `orders_active_idx` 제거
- `orders_spec_sheet_active_idx` 제거
- `orders_company_status_due_idx` 조건 제거
- `orders_company_factory_created_idx` → `orders_company_factory_idx`
- `orders_company_created_idx` → `orders_company_idx`
- `spec_sheet_materials_active_idx` 제거
- `spec_sheet_outsourcing_lines_active_idx` 제거

### repository mapping

세 detail sync repository에서 제거 대상 컬럼을 더 이상 탐지하거나 insert하지 않는다.

대상 파일:

- `lib/workorder/repository/dbFactoryOrderRepository.ts`
- `lib/workorder/repository/dbSpecSheetMaterialRepository.ts`
- `lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts`

### detail 조회

`dbWorkOrderRepository.ts`의 생산구성 detail 조회에서 제거된 컬럼 조건을 사용하지 않는다.

변경 기준:

- `COALESCE(is_active, true) = true` 제거
- `deleted_at IS NULL` 제거
- `ORDER BY created_at ASC` 제거
- 현재값 replace 저장 구조이므로 `spec_sheet_id` 기준 row만 조회한다.

## 유지한 제약

이번 단계에서는 schema를 과하게 줄이지 않는다.

- `factory_name`은 공장 partner 조인 전환 전까지 유지한다.
- `vendor`는 원단/부자재/외주 vendor partner id 전환 전까지 유지한다.
- `status`는 발주/공정 상태 테이블 분리 전까지 유지한다.

## 후속 작업

다음 단계에서는 현재 schema 기준으로 실제 reset 후 빌드/동작을 확인한 뒤, partner 조인 전환과 snapshot/history 테이블 설계를 진행한다.
