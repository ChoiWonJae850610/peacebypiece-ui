# 시스템 요금제·용량 UI 본 화면 재연결

Version: 0.9.105

## 목적

0.9.94에서 회귀 점검 화면으로 대체된 `/system/billing`을 시스템관리자 요금제·용량 UI 본 화면으로 재연결한다.

## 이번 패치 기준

1. `/system/billing` route를 `SystemCompanyPlanSkeleton`으로 다시 연결한다.
2. `SystemCompanyPlanSkeleton`을 회귀 점검 placeholder에서 실제 billing overview 화면으로 복원한다.
3. 기존 `GET /api/system/billing` API를 호출한다.
4. `plans`, `company_plan_assignments`, `latest_storage_usage_snapshots` 기반 overview를 표시한다.
5. 고객사별 active plan, 저장공간 사용량, 멤버 수, 가격 정보를 read-only로 표시한다.
6. 저장 action, 결제 자동화, 요금제 변경 API는 포함하지 않는다.
7. billing repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/system/billing/page.tsx`
- `components/system/billing/SystemCompanyPlanSkeleton.tsx`
- `lib/system/systemRegressionRoutes.ts`

## 제외

- 결제 자동화
- 요금제 저장 action
- 고객사별 plan 변경 action
- storage 초과 차단
- R2 실시간 inventory 조회
- package.json 변경
- DB schema 변경

## 다음 작업

0.9.106에서 `/system` 시스템 통계 read-only 표시 또는 시스템관리자 콘솔 본 화면 복원을 진행한다.
