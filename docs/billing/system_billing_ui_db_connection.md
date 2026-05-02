# 시스템관리자 요금제 UI와 DB 연결 1차

Version: 0.9.90

## 목적

시스템관리자 요금제·용량 화면이 DB의 plans, company_plan_assignments, latest_storage_usage_snapshots를 조회하도록 1차 연결한다.

## 추가 API

### GET /api/system/billing

반환 항목:

- plans
- companies
- active company_plan_assignments
- latest storage usage snapshot
- effective storage/member/price
- storage usage ratio

## 이번 패치 기준

1. `/system/billing` 화면에서 `/api/system/billing`을 호출한다.
2. plans는 DB 기준으로 표시한다.
3. 고객사별 active plan assignment를 표시한다.
4. latest storage usage snapshot을 표시한다.
5. 저장 액션은 아직 연결하지 않는다.
6. 결제 자동화는 연결하지 않는다.
7. package.json 변경 없음.

## 다음 작업

0.9.91에서 고객관리자 통계 API 실제 DB 집계 1차를 진행한다.
