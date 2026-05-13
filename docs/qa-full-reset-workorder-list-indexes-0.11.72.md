# 0.11.72 full_reset 작업지시서 목록 인덱스 반영

## 목적

0.11.71에서 추가한 작업지시서 목록 필터/정렬용 선택 적용 인덱스를 `db/schema/full_reset.sql`에도 반영한다.

## 반영 내용

`spec_sheets` 인덱스 구간에 다음 인덱스를 포함했다.

- `idx_spec_sheets_company_active_status_updated`
- `idx_spec_sheets_company_active_status_due_date`
- `idx_spec_sheets_company_active_title`
- `idx_spec_sheets_company_active_vendor`

## 기준

- 0.11.71 패치 SQL의 인덱스 정의를 full reset 기준 schema에 동기화
- full reset 이후 별도 patch SQL을 다시 적용하지 않아도 동일한 목록 조회 최적화 기준을 갖도록 정리

## 비고

- 운영 DB 자동 변경 없음
- DB schema 구조 변경 없음
- 기존 table/column 정의 변경 없음
- 작업지시서 목록 필터/정렬 로직 변경 없음
