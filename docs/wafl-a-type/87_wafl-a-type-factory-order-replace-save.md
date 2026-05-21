# 87. 공장 발주 orders 현재값 replace 저장 정리

## 버전

0.15.64

## 배경

`spec_sheet_materials`, `spec_sheet_outsourcing_lines`는 현재값 replace 저장 기준으로 전환했지만, `orders`는 여전히 `is_active=false`와 `deleted_at`을 이용해 과거 row를 비활성화하는 흐름이 남아 있었다.

이 구조는 작업지시서 하나의 현재 공장 발주 row만 필요한 상황에서 불필요한 누적 row를 만들고, 반려/취소성 workflow와 결합될 때 공장 row가 false 처리되는 원인이 될 수 있다.

## 결정

`orders`도 현재 확정 생산구성 테이블로 취급한다.

- 현재 공장 발주 row만 유지한다.
- 과거 row는 `is_active=false`로 누적하지 않는다.
- 검토요청/검토완료/발주요청 등 생산구성 replace 허용 serviceCode에서만 갱신한다.
- 반려/취소/되돌리기에서는 `orders`를 변경하지 않는다.

## 저장 방식

```sql
BEGIN;

DELETE FROM orders
WHERE spec_sheet_id = :work_order_id;

INSERT INTO orders (...)
VALUES (...현재 공장 발주 rows...);

COMMIT;
```

실패하면 rollback한다.

## 기대 효과

- 공장 row가 테스트할 때마다 false row로 누적되지 않는다.
- 공장 2개 입력 시 DB에도 현재 row 2개만 남는다.
- 공장 1개로 줄이면 DB에도 현재 row 1개만 남는다.
- 반려 시 `orders.is_active=false`, `orders.deleted_at`이 새로 찍히는 경로를 줄인다.

## 후속 정리 대상

다음 단계에서 세 테이블 컬럼 정리를 함께 검토한다.

- `orders`
- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`

제거 후보는 별도 SQL 설계 버전에서 확정한다.

- `is_active`
- `deleted_at`
- `created_at`
- `updated_at`
- `company_name`
- `factory_name`
- `vendor`
