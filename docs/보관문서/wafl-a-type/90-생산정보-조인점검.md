# 생산구성 현재값 테이블 조인 기준 점검 1차 (0.15.72~0.15.73)

## 목적

0.15.66~0.15.71에서 `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`를 현재값 테이블로 정리했다.  
이번 문서는 다음 단계의 partner 조인 전환 전에, 현재 저장 구조와 조인 기준을 분리해서 정리한다.

## 현재 테이블별 기준

| 테이블 | 현재 주 조인 기준 | 현재 표시용 이름 | 판단 |
| --- | --- | --- | --- |
| `orders` | `company_id`, `spec_sheet_id`, `factory_partner_id` | `factory_name` | `factory_partner_id`가 이미 있으므로 partner 조인 전환 가능성이 가장 높다. `factory_name`은 표시 snapshot 후보로 유지한다. |
| `spec_sheet_materials` | `company_id`, `spec_sheet_id`, `source_material_id` | `vendor` | 아직 vendor partner id가 없다. 당장 문자열 제거 금지. |
| `spec_sheet_outsourcing_lines` | `company_id`, `spec_sheet_id`, `source_outsourcing_id` | `vendor` | 아직 vendor partner id가 없다. 당장 문자열 제거 금지. |
| `partners` | `company_id`, `id`, `name` | `name` | 회사 범위 안에서만 조인해야 한다. |
| `partner_items` | `company_id`, `partner_id`, `item_type` | `item_name` | 거래처가 취급하는 공장/원단/부자재/외주 항목 기준으로 사용한다. |

## 이번 버전의 코드/SQL 보정

### 1. 작업지시서 상세 row 조회 company scope 보강

작업지시서 상세 row hydration에서 `spec_sheet_id`만으로 조회하던 부분을 `company_id + spec_sheet_id` 기준으로 보강했다.

대상:
- `orders`
- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`

이렇게 하면 현재 `spec_sheets` 목록이 회사 범위로 조회된 뒤에도 상세 현재값 row 조회가 동일한 회사 범위로 제한된다.

### 2. 작업지시서 목록 count lateral query 보강

목록 count 계산도 `s.id`만이 아니라 `s.company_id + s.id` 기준으로 보강했다.

대상 count:
- 공장 발주 row count
- 원단/부자재 row count
- 외주공정 row count

### 3. full_reset 인덱스 보강

현재 구조와 다음 partner 조인 전환을 모두 고려해 아래 인덱스를 추가했다.

- `orders_company_factory_name_idx`
- `spec_sheet_materials_company_source_material_idx`
- `spec_sheet_materials_company_vendor_idx`
- `spec_sheet_outsourcing_lines_company_source_idx`
- `spec_sheet_outsourcing_lines_company_vendor_idx`
- `partners_company_name_idx`
- `partner_items_company_partner_type_idx`

`orders_company_factory_idx`는 기존 full_reset에서 이미 유지한다.

## 보류한 결정

### `orders.factory_name`

지금은 제거하지 않는다.

이유:
- `factory_partner_id`가 있더라도 거래처명이 변경되었을 때 과거 작업지시서의 표시명을 snapshot으로 보존할 수 있다.
- 화면 표시에서 매번 partner 조인을 강제하지 않아도 된다.
- 추후 partner 조인 전환 시 `factory_name`은 snapshot 컬럼으로 명확히 이름을 바꾸거나 의미를 문서화하는 것이 좋다.

### `spec_sheet_materials.vendor`

지금은 제거하지 않는다.

이유:
- 현재 테이블에 `vendor_partner_id`가 없다.
- 원단/부자재는 거래처가 없거나 직접 입력된 이름일 수 있다.
- 다음 단계에서 `vendor_partner_id` 도입 여부를 먼저 결정해야 한다.

### `spec_sheet_outsourcing_lines.vendor`

지금은 제거하지 않는다.

이유:
- 현재 테이블에 `vendor_partner_id`가 없다.
- 외주공정은 process와 vendor의 조합이 중요하다.
- `source_outsourcing_id`가 실제 partner item을 안정적으로 가리키는지 먼저 확인해야 한다.

## 다음 버전 권장

0.15.73에서는 실제 schema 전환 설계를 다룬다.

후보:
- `spec_sheet_materials.vendor_partner_id`
- `spec_sheet_outsourcing_lines.vendor_partner_id`

전환 기준:
1. 현재 화면의 거래처 선택값이 partner id를 안정적으로 보유하는지 확인
2. 직접 입력 거래처명을 허용할지 결정
3. partner 삭제/비활성 시 기존 작업지시서 표시 방식을 결정
4. `vendor`를 snapshot 이름으로 유지할지, `vendor_snapshot_name`처럼 의미를 바꿀지 결정
5. full_reset 반영 범위와 repository mapping 변경 범위를 분리


## 0.15.73 결정 보강

0.15.73에서는 `spec_sheet_materials`와 `spec_sheet_outsourcing_lines`에 `vendor_partner_id`를 추가해 partner 조인 전환의 최소 기반을 만든다.

원칙:
- `vendor_partner_id`는 거래처 조인용 선택 FK다.
- `vendor` 문자열은 당장 제거하지 않고 표시 snapshot 이름으로 유지한다.
- 화면이 아직 partner id를 안정적으로 넘기지 못하는 경우 `vendor_partner_id`는 `NULL`일 수 있다.
- 기존 수기 입력 거래처명은 `vendor`에 남긴다.
- partner 삭제 시 기존 작업지시서 표시는 보존되어야 하므로 FK는 `ON DELETE SET NULL`을 사용한다.

따라서 0.15.73은 문자열 컬럼 제거가 아니라, 다음 UI 전환을 위한 schema/repository 준비 단계다.
