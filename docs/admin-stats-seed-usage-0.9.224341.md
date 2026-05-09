# 0.9.224341 관리자 통계 seed 보정

## 목표

0.9.22434에서 안정화한 관리자 통계 화면을 실제 데이터로 검증할 수 있도록 realistic seed를 보정했다.

## 변경 내용

- `db/schema/seed_realistic_workorders_0_9_2227.sql`에 0.9.22434 통계 화면 검증용 고정 케이스를 추가했다.
- 완료 작업지시서의 발주수량 상위 5개가 명확히 보이도록 고수량 완료 작업지시서를 추가했다.
- 리오더 차수 TOP5 검증을 위해 2차~6차 리오더 그룹을 추가했다.
- 불량 작업지시서 TOP5 검증을 위해 `rejected`와 `is_rework` 케이스를 추가했다.
- 업체별 납기 지연/검수 지표 검증을 위해 due_date가 지난 미완료 작업지시서와 검수 이슈 작업지시서를 추가했다.
- seed SQL과 같은 위치에 PowerShell 실행 사용법 문서를 추가했다.

## 추가 사용법 문서

- `db/schema/seed_realistic_workorders_usage_0_9_224341.md`

## DB 변경

schema 변경 없음. seed/test data script만 변경했다.

## 검증

ChatGPT 환경에서는 실제 DB 접속과 `npm run build`를 실행하지 않았다. 사용자가 로컬에서 아래 항목을 확인한다.

- `psql $env:DATABASE_URL -f db/schema/seed_realistic_workorders_0_9_2227.sql`
- `/admin/dashboard` 기간 필터
- 발주수량 상위 5개
- 리오더 차수 상위 5개
- 불량 작업지시서 상위 5개
- 업체별 납기/검수 지표
