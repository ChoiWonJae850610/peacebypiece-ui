# WAFL A-TYPE — 생산구성 현재값 replace 저장 1차

## 목적

`spec_sheet_materials`, `spec_sheet_outsourcing_lines`는 작업지시서의 현재 확정 생산구성만 저장하는 테이블로 사용한다. 이전 입력값을 `is_active=false` row로 누적하지 않고, 검토요청/발주요청 등 앞으로 진행되는 workflow 이벤트에서 현재 draft row를 기준으로 테이블 내용을 교체한다.

## 적용 범위

이번 단계는 다음 두 테이블의 저장 방식을 먼저 바꾼다.

```txt
spec_sheet_materials
spec_sheet_outsourcing_lines
```

`orders`는 다음 단계에서 같은 기준으로 점검한다.

## 저장 정책

기존 방식:

```txt
현재 row upsert
남은 과거 row는 is_active=false 또는 deleted_at으로 비활성화
```

변경 방식:

```txt
spec_sheet_id 기준 기존 row 전체 삭제
현재 draft row 전체 insert
```

즉, 작업지시서에 원단/부자재가 2개이면 `spec_sheet_materials`에도 현재 row 2개만 남는다. 외주공정이 1개이면 `spec_sheet_outsourcing_lines`에도 현재 row 1개만 남는다.

## 트랜잭션 기준

삭제 후 insert 중간에 실패하면 데이터가 비는 문제가 생길 수 있으므로 각 테이블 sync는 DB transaction 안에서 실행한다.

```txt
BEGIN
DELETE current rows by spec_sheet_id
INSERT current rows
COMMIT
```

실패 시 rollback한다.

## 현재 schema 호환

이번 버전은 schema를 즉시 제거하지 않는다. 기존 DB에 `is_active`, `deleted_at`, `company_name` 컬럼이 남아 있어도 insert 시 필요한 값은 채운다.

다만 더 이상 과거 row를 `is_active=false`로 남기는 용도로 쓰지 않는다.

## 다음 단계

```txt
0.15.49
- orders 저장 방식도 같은 replace 기준으로 정리한다.

0.15.50 이후
- full_reset.sql에서 현재값 테이블 컬럼을 정리한다.
- is_active / deleted_at / created_at / updated_at / company_name / vendor 이름 중복 컬럼 제거 여부를 반영한다.
```
