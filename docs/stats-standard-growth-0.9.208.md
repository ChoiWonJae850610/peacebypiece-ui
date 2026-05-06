# 0.9.208 — Standard/Growth 통계 1차

## 목적

0.9.2071에서 추가한 통계 확인용 seed 데이터를 기준으로, 고객관리자 통계 화면의 고급 통계 preview를 실제 DB 집계값과 연결한다.

이번 버전은 API route나 DB schema를 새로 만들지 않고, 기존 `getAdminStatsSnapshot`에서 이미 조회 중인 생산품유형, 협력업체/공장, 생산 단계 집계값을 화면의 Standard/Growth preview 카드에 연결하는 1차 작업이다.

## 반영 범위

- 생산품유형 TOP preview
- 협력업체 성과 preview
- 리오더 preview
- 검수/불량 위험 preview 상태 유지
- 좁은 카드에서 생산 단계 도넛 차트 범례가 겹치는 문제 최소 완화

## 요금제 기준

| 기능 | feature key | 기준 요금제 | 0.9.208 상태 |
|---|---|---:|---|
| 생산품유형 TOP | `stats.category` | Standard | 실제 집계 preview 연결 |
| 협력업체 성과 | `stats.factory` | Standard | 실제 집계 preview 연결 |
| 리오더 preview | `stats.reorder` | Growth | 2차 이상 생산 단계 집계 preview 연결 |
| 검수/불량 위험 | `stats.quality` | Premium | 데이터 구조 확정 전 준비 상태 유지 |

## 데이터 기준

### 생산품유형 TOP

`stats.productionCategoryDistribution`에서 가장 값이 큰 항목을 preview 카드에 표시한다.

현재 기준은 `spec_sheets.payload`의 `categoryLabel`, `category`, `itemCategory` 후보값이다.

### 협력업체 성과

`stats.factoryProductionDistribution`에서 가장 값이 큰 공장/협력업체 항목을 preview 카드에 표시한다.

현재 기준은 `orders.factory_name`이다.

### 리오더 preview

`stats.productionRoundDistribution`에서 `1차`를 제외하고 `2차`, `3차 이상` 중 가장 값이 큰 항목을 표시한다.

이는 리오더 전체 랭킹이 아니라 반복 생산 단계 preview다. 실제 리오더 그룹 기준 TOP 작업지시서는 후속 버전에서 별도 쿼리로 확장한다.

### 검수/불량 위험

현재는 `is_rework` 기반 defectCount만 존재하므로 실제 불량률로 해석하지 않는다. 검수 결과/불량 수량 저장 구조가 확정될 때까지 Premium 준비 상태로 유지한다.

## UI 보완

0.9.2071 화면에서 생산 단계 비율 도넛 차트의 범례가 좁은 카드 안에서 붙어 보일 수 있었다. 0.9.208에서는 해당 카드에 compact layout을 적용해 도넛과 범례를 세로 배치한다.

이 변경은 전체 통계 화면 레이아웃 개편이 아니라, 현재 확인 중인 좁은 카드 겹침을 줄이는 최소 보완이다. 전체 카드 높이/폭/모바일 정렬은 후속 UI 안정화 버전에서 별도로 다룬다.

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

단, 통계 화면에서 값을 확인하려면 0.9.2071에서 추가한 seed SQL이 실행되어 있어야 한다.

권장 확인 순서:

1. `db/schema/full_reset.sql`
2. `db/schema/full_reset_smoke_test.sql`
3. `db/schema/seed_stats_demo_0_9_2071.sql`
4. `/admin/dashboard` 확인

## 테스트 케이스

1. `/admin/dashboard` 접속
2. 생산품유형 TOP 카드에 seed 데이터 기준 TOP 항목이 표시되는지 확인
3. 협력업체 성과 카드에 seed 데이터 기준 TOP 공장이 표시되는지 확인
4. 리오더 preview 카드에 2차 이상 집계가 표시되는지 확인
5. 검수/불량 위험 카드는 준비 상태로 유지되는지 확인
6. 생산 단계 비율 도넛 차트 범례가 도넛 위로 겹치지 않는지 확인
7. `npm run build` 실행

## 다음 단계

0.9.209에서는 Premium 통계 준비 작업으로 납기 지연, 검수 결과, 불량 수량, 품질 위험 지표가 현재 DB에서 가능한지 다시 분리한다.
