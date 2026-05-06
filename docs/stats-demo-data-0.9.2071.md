# 0.9.2071 — 통계 확인용 seed 데이터와 empty state 강화

## 목적

0.9.205~0.9.207에서 Recharts 기반 통계 화면과 고급 통계 preview를 연결했지만, 개발 DB에 업무 데이터가 없으면 통계 화면 변화가 작게 보인다. 이 버전은 실제 운영 로직을 건드리지 않고 개발 DB에서 통계 화면을 확인할 수 있도록 별도 seed SQL과 빈 상태 안내를 추가한다.

## 반영 내용

### 1. 개발용 통계 seed SQL 추가

추가 파일:

```text
 db/schema/seed_stats_demo_0_9_2071.sql
```

이 파일은 full reset 이후 존재하는 샘플 고객사 `company-sample-customer`를 기준으로 아래 데이터를 추가한다.

- 통계 확인용 협력업체 7개
- 협력업체 item type 분포: factory / fabric / subsidiary / outsourcing
- 작업지시서 10개
- 상태 분포: draft / rejected / review_requested / review_completed / inspection / completed
- 리오더 회차 분포: 1차 / 2차 / 3차 이상
- 발주 orders 7개
- 공장별 생산 분포
- 첨부파일 6개
- active/trash 파일 사용량
- 0.9.203 summary table 확인용 일/월/저장소 summary row

## 실행 순서

개발 DB에서 아래 순서로 실행한다.

```text
1. db/schema/full_reset.sql
2. db/schema/full_reset_smoke_test.sql
3. db/schema/seed_stats_demo_0_9_2071.sql
```

이번 seed SQL은 운영 데이터 마이그레이션이 아니다. 개발 DB 확인용이다.

## UI 확인 위치

```text
/admin/dashboard
```

확인 항목:

- 작업지시서 상태별 막대 차트에 값이 표시되는지
- 협력업체 분포 도넛 차트에 factory/fabric/subsidiary/outsourcing 값이 표시되는지
- 파일 사용량 도넛 차트에 active/trash 값이 표시되는지
- 생산 단계 비율 도넛 차트에 1차/2차/3차 이상 값이 표시되는지
- 공장별 생산 분포와 생산품유형 분포 bar가 표시되는지
- 고급 통계 preview 카드가 Basic 화면 아래에서 잠금 기준과 함께 보이는지

## empty state 강화

데이터가 없을 때 통계 화면 상단에 개발용 seed SQL 실행 안내를 표시한다.

표시 조건:

```text
workorder flow total = 0
partner distribution total = 0
production round total = 0
factory production total = 0
category total = 0
file usage point values = 0
key metrics = 0
```

즉, 실제 통계에 쓸 데이터가 전혀 없을 때만 안내 패널이 보인다.

## SQL DDL 필요 여부

불필요.

이번 버전은 새로운 테이블, 컬럼, index, constraint를 추가하지 않는다.

## 전체 리셋 필요 여부

권장.

seed SQL은 full reset 이후의 샘플 고객사와 기준정보를 전제로 한다. 기존 개발 DB 상태가 섞여 있으면 통계 숫자가 달라질 수 있으므로 아래 순서를 권장한다.

```text
full_reset.sql → full_reset_smoke_test.sql → seed_stats_demo_0_9_2071.sql
```

## 운영 DB 주의

`seed_stats_demo_0_9_2071.sql`은 개발 확인용이다. 운영 DB에 실행하지 않는다.

## 다음 버전 기준

원래 계획했던 0.9.208은 그대로 유지한다.

```text
0.9.208 — Standard/Growth 통계 1차
```
