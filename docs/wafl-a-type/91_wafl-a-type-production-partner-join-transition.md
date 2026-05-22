# 생산구성 partner 조인 전환 설계 (0.15.73)

## 목적

`orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`의 현재값 테이블을 partner 기준으로 연결할 수 있게 준비한다.  
이번 단계는 대규모 UI 전환이 아니라, schema와 repository가 partner id를 받을 수 있는 최소 기반을 만드는 단계다.

## 결정

| 대상 | partner id 컬럼 | 표시 snapshot 컬럼 | 이번 결정 |
| --- | --- | --- | --- |
| 공장 발주 | `orders.factory_partner_id` | `orders.factory_name` | 기존 구조 유지. `factory_name`은 snapshot으로 유지한다. |
| 원단/부자재 | `spec_sheet_materials.vendor_partner_id` | `spec_sheet_materials.vendor` | 새 FK 컬럼을 추가하고 `vendor`는 snapshot으로 유지한다. |
| 외주공정 | `spec_sheet_outsourcing_lines.vendor_partner_id` | `spec_sheet_outsourcing_lines.vendor` | 새 FK 컬럼을 추가하고 `vendor`는 snapshot으로 유지한다. |

## 저장 원칙

1. 화면에서 partner id가 있으면 `vendor_partner_id`에 저장한다.
2. 화면에서 partner id가 없고 수기 거래처명만 있으면 `vendor_partner_id`는 `NULL`로 저장한다.
3. 표시명은 항상 `vendor`/`factory_name` snapshot을 우선 보존한다.
4. partner가 삭제되거나 비활성화되어도 기존 작업지시서의 표시명은 깨지면 안 된다.
5. partner FK는 `ON DELETE SET NULL`을 사용한다.

## 조회 원칙

현재 작업지시서 상세는 snapshot 이름을 우선 사용한다.

향후 화면에서 거래처 최신명을 표시해야 하는 경우에만 다음 순서로 확장한다.

1. `vendor_partner_id` 또는 `factory_partner_id`로 같은 `company_id`의 `partners`를 조인한다.
2. 조인 성공 시 최신 partner 이름을 보조 정보로 표시할 수 있다.
3. 기본 표시명은 snapshot 값을 유지한다.
4. snapshot이 비어 있고 partner 조인이 성공한 경우에만 partner 이름을 fallback으로 사용할 수 있다.

## 이번 버전 반영 범위

- `full_reset.sql`
  - `spec_sheet_materials.vendor_partner_id`
  - `spec_sheet_outsourcing_lines.vendor_partner_id`
  - 각 vendor partner id 보조 인덱스

- `full_reset_smoke_test.sql`
  - 신규 컬럼과 인덱스 누락 검사

- repository
  - material/outsourcing 저장 시 `vendorPartnerId`가 있으면 `vendor_partner_id`에 저장
  - 상세 hydration 시 `vendor_partner_id`를 `vendorPartnerId`로 복원

- types
  - `Material.vendorPartnerId`
  - `Outsourcing.vendorPartnerId`

## 보류

- 기존 `vendor`/`factory_name` 제거
- partner 조인 기반 표시명 강제 전환
- 원단/부자재/외주 입력 UI의 거래처 선택 컴포넌트 개편
- partner item과 생산구성 row의 1:1 고정 연결
