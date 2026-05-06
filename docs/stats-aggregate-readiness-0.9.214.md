# 0.9.214 — summary table / materialized view 검토

## 목적

0.9.214는 통계 성능 개선을 위해 summary table 또는 materialized view를 즉시 추가하지 않고, 어떤 지표를 어떤 순서로 최적화할지 기준을 고정하는 버전이다.

## 결론

이번 버전에서는 DB schema를 변경하지 않는다.

우선순위는 다음 순서를 따른다.

1. 기존 aggregate SQL 최적화
2. 필요한 index 보강
3. 일/월 단위 summary table 저장
4. materialized view 또는 batch refresh 검토

## 지표별 판단

| 영역 | 현재 전략 | summary table 후보 | materialized view 후보 | 판단 |
| --- | --- | --- | --- | --- |
| 작업지시서 overview | spec_sheets aggregate SQL | company_workorder_daily_stats / company_workorder_monthly_stats | 초기 불필요 | 유지 |
| 저장소 사용량 | attachments metadata 합산 | company_storage_daily_stats | 월별 추세가 느릴 때 검토 | 검토 |
| 협력업체/공장 성과 | orders + partners 조인 | company_factory_monthly_stats | 비용/납기/불량 통합 시 검토 | 검토 |
| 검수/불량 위험 | 검수 저장 기준 미확정 | company_quality_monthly_stats | event log 이후 검토 | 보류 |
| 시스템 고객사 사용량 | sample 기반 UI 기준 | system_company_usage_daily_stats | 고객사 증가 후 검토 | 검토 |

## SQL DDL 필요 여부

불필요.

이번 버전은 테이블, 컬럼, index, materialized view를 추가하지 않는다.

## 전체 리셋 필요 여부

불필요.

## 다음 단계

0.9.215에서 권한/feature flag 체계를 설계할 때 통계 feature key와 plan gate를 함께 정리한다. 이후 실제 API 응답 시간이 0.9.213 성능 기준을 초과할 때 DB schema 변경 버전으로 summary table 또는 materialized view를 반영한다.

## 테스트 케이스

1. `/admin/dashboard`에서 summary table / materialized view 검토 섹션이 표시되는지 확인한다.
2. 작업지시서 overview가 “유지”로 표시되는지 확인한다.
3. 저장소 사용량, 협력업체/공장 성과, 시스템 고객사 사용량이 “검토”로 표시되는지 확인한다.
4. 검수/불량 위험이 “보류”로 표시되는지 확인한다.
5. `package.json`, `package-lock.json`, `full_reset.sql`, `full_reset_smoke_test.sql`이 변경되지 않았는지 확인한다.
