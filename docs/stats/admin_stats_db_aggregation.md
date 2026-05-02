# 고객관리자 통계 API 실제 DB 집계 1차

Version: 0.9.91

## 목적

`/api/admin/stats`가 skeleton 값이 아니라 DB 기준 고객사 통계를 반환하도록 1차 연결한다.

## API

### GET /api/admin/stats?companyId=company-sample-customer

기본 기간은 최근 30일이다.

### GET /api/admin/stats?companyId=company-sample-customer&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.999Z

기간을 지정하면 해당 기간 기준으로 작업지시서 수를 집계한다.

## 이번 패치 집계 항목

### counts

- 전체 작업지시서 수
- 상태별 작업지시서 수
- 첨부파일 수
- 저장공간 사용량

### ratios

- 완료율

### series

- 월별 작업지시서 수

## 기준 테이블

- `spec_sheets`
- `attachments`
- `latest_storage_usage_snapshots`

## 제외

- 디자이너별 작업량
- 공장별 생산량
- 카테고리별 생산량
- 화면 차트 연결

위 항목은 생산/담당자/카테고리 구조가 더 안정화된 뒤 2차로 연결한다.

## 다음 작업

0.9.92에서 시스템관리자 통계 API 실제 DB 집계 1차를 진행한다.
