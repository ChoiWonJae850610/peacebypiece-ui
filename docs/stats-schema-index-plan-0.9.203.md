# 0.9.203 통계용 schema/index 1차 설계 및 반영

## 목적

0.9.203은 통계 API 1차 구현 전에 필요한 DB 기반을 준비하는 버전이다.
기존 데이터 마이그레이션은 수행하지 않는다. 현재 개발 DB는 테스트 데이터 중심이므로 전체 리셋을 허용한다.

## 변경 범위

- `db/schema/full_reset.sql`에 통계용 summary table 3개 추가
- `db/schema/full_reset.sql`에 통계 aggregate 조회용 index 추가
- `db/schema/full_reset_smoke_test.sql`에 통계 테이블/컬럼/index 검증 추가
- `db/schema/patch_0_9_203_stats_schema.sql` 추가

## 추가 테이블

### company_workorder_daily_stats

고객사별 일 단위 작업지시서 통계 summary table이다.

주요 용도:

- 기간별 작업지시서 생성 수
- 활성/완료/휴지통 작업지시서 수
- 리오더 작업지시서 수
- 발주 건수/수량/공임/로스 비용 합계
- 메모/첨부 개수 요약

초기 API는 원본 테이블 aggregate를 우선 사용할 수 있다. 이 테이블은 데이터가 많아질 때 캐시 또는 batch 집계 결과 저장소로 사용한다.

### company_workorder_monthly_stats

고객사별 월 단위 작업지시서 통계 summary table이다.
`stats_month`는 해당 월의 1일 날짜로 저장한다.

주요 용도:

- 월별 작업지시서 생성/완료 추이
- 월별 리오더 추이
- 월별 발주 수량/비용 추이

### company_storage_daily_stats

고객사별 일 단위 저장소 통계 summary table이다.

주요 용도:

- active 첨부 개수/용량
- trash 첨부 개수/용량
- purge 요청/실패/완료 건수
- purged bytes
- 썸네일 수
- logical attachment count와 physical attachment bytes 분리 기준 준비

주의:

- R2 listObjects 직접 조회를 기준으로 삼지 않는다.
- 1차 기준은 DB attachment metadata와 attachment_trash_items metadata다.

## 추가 index

### spec_sheets

- `spec_sheets_company_created_idx`
- `spec_sheets_company_status_created_idx`
- `spec_sheets_company_reorder_created_idx`
- `spec_sheets_company_delete_status_idx`

목적:

- 고객사별 기간 통계
- 상태별 작업지시서 수
- 리오더 통계
- 삭제/휴지통 상태 통계

### orders

- `orders_company_factory_created_idx`
- `orders_company_created_idx`

목적:

- 공장별 발주 건수
- 공장별 발주 수량/비용 합계
- 기간별 발주 추이

### attachments

- `attachments_company_deleted_type_idx`
- `attachments_company_size_idx`

목적:

- 파일 유형별 개수/용량
- active/trash 용량 분리
- 고객사별 저장소 통계

### summary table index

- `company_workorder_daily_stats_company_date_idx`
- `company_workorder_monthly_stats_company_month_idx`
- `company_storage_daily_stats_company_date_idx`

목적:

- 고객사별 기간 조회
- 최근 통계 조회
- 관리자 통계 API 응답 준비

## SQL DDL 필요 여부

필요.

반영 파일:

- `db/schema/full_reset.sql`
- `db/schema/patch_0_9_203_stats_schema.sql`

## 전체 리셋 필요 여부

권장.

현재 사용자는 기존 데이터 마이그레이션이 필요 없고 전체 리셋 가능하다고 명시했다. 따라서 개발 DB에서는 아래 순서가 가장 단순하다.

1. `db/schema/full_reset.sql` 실행
2. `db/schema/full_reset_smoke_test.sql` 실행

## 기존 데이터 마이그레이션 필요 여부

불필요.

현재 운영 데이터가 없는 테스트 상태이므로 별도 backfill이나 migration script는 작성하지 않았다.

## 0.9.204 이후 연결 기준

0.9.204에서 Recharts를 도입하더라도 통계 API는 먼저 원본 테이블 aggregate를 사용할 수 있다.
summary table은 초기부터 강제하지 않는다.

권장 순서:

1. 원본 테이블 aggregate API 구현
2. 응답 시간이 느려지는 지점 확인
3. summary table 적재 로직 추가
4. summary table 기반 API 전환

## 테스트 케이스

1. `lib/constants/app.ts`의 `APP_VERSION`이 `0.9.203`인지 확인한다.
2. `full_reset.sql` 실행 후 아래 테이블이 존재하는지 확인한다.
   - `company_workorder_daily_stats`
   - `company_workorder_monthly_stats`
   - `company_storage_daily_stats`
3. `full_reset_smoke_test.sql` 실행 시 통계 테이블/컬럼/index 검증이 통과하는지 확인한다.
4. `company_workorder_monthly_stats.stats_month`에 월 시작일이 아닌 값을 넣으면 check constraint가 동작하는지 확인한다.
5. summary table의 음수 count/bytes/cost 입력이 check constraint로 차단되는지 확인한다.
6. `spec_sheets`, `orders`, `attachments`의 신규 index가 생성되는지 확인한다.

