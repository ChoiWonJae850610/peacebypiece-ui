# 시스템관리자 통계 API 실제 DB 집계 1차

Version: 0.9.92

## 목적

`/api/system/stats`가 skeleton 값이 아니라 DB 기준 시스템 통계를 반환하도록 1차 연결한다.

## API

### GET /api/system/stats

기본 기간은 최근 30일이다.

### GET /api/system/stats?from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.999Z

기간을 지정하면 해당 기간 기준으로 초대 수를 집계한다.

## 이번 패치 집계 항목

### counts

- 전체 고객사 수
- 활성 고객사 수
- 전체 저장공간 사용량
- 전체 첨부파일 수
- 요금제별 고객 수
- 초대 생성 수
- 초대 수락 수
- 대기중 초대 수
- 만료 초대 수
- 취소 초대 수

### ratios

- 고객사 활성 비율
- 초대 수락률

### series

- 고객사별 저장공간 사용량 상위 10개
- 요금제별 고객 수
- 초대 상태별 수

## 기준 테이블 / view

- `companies`
- `company_plan_assignments`
- `plans`
- `invitations`
- `latest_storage_usage_snapshots`

## 제외

- 시스템관리자 화면 차트 연결
- audit log 통계
- 결제/매출 통계
- R2 inventory 실시간 조회

## 다음 작업

0.9.93에서 관리자 화면 기존 기능 회귀 점검을 진행한다.
