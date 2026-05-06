# 0.9.209 — Premium 통계 준비

## 목적

0.9.209는 Premium 통계 차트를 무리하게 완성하지 않고, 현재 DB와 화면 snapshot 기준에서 계산 가능한 지표와 추가 설계가 필요한 지표를 분리한다.

## 이번 버전 판단

- DB schema 변경 없음
- full_reset.sql 수정 없음
- smoke test SQL 수정 없음
- package.json / package-lock.json 수정 없음
- 실제 Premium 통계 API 구현 없음
- 고객관리자 통계 화면에 Premium 준비 상태 안내만 추가

## Premium 통계 후보

| 지표 | 상태 | 판단 |
| --- | --- | --- |
| 검수/불량률 | 준비 필요 | 검수 결과, 검사 수량, 불량 수량, 불량 사유 저장 기준이 먼저 필요하다. |
| 납기 지연율 | 부분 가능 | 납기일/완료일 후보는 있으나 통계 기준일을 확정해야 한다. |
| 공장별 비용/위험 | 부분 가능 | 공장별 발주 건수는 가능하지만 비용 합산 기준은 추가 정리가 필요하다. |
| 통계 내보내기 | 준비 필요 | export 전용 DTO, 권한 차단, 감사 로그가 필요하다. |

## 권장 후속 작업

1. 검수 완료 액션에서 저장할 품질 데이터 정의
   - inspected_quantity
   - defect_quantity
   - defect_reason_code
   - defect_note
   - inspection_completed_at

2. 납기 기준일 확정
   - due_date
   - completed_at
   - inspection_completed_at
   - delivered_at

3. 비용 통계 기준 확정
   - labor_cost
   - loss_cost
   - outsourcing_cost
   - material_cost
   - total_cost

4. export 권한 기준 확정
   - stats.export
   - audit log 기록
   - CSV 다운로드 API 분리

## SQL DDL 필요 여부

불필요.

이번 버전은 Premium 통계 준비 상태 표시와 문서화만 포함한다.

## 전체 리셋 필요 여부

불필요.

## 테스트 케이스

1. `/admin/dashboard`에서 Premium 통계 준비 상태 섹션이 표시되는지 확인한다.
2. 검수/불량률은 `준비 필요`로 표시되는지 확인한다.
3. 납기 지연율과 공장별 비용/위험은 `부분 가능`으로 표시되는지 확인한다.
4. 통계 내보내기는 `준비 필요`로 표시되는지 확인한다.
5. 기존 Basic/Standard/Growth 통계 카드와 차트가 유지되는지 확인한다.
