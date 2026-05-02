Version : 0.9.90
Base Version : 0.9.89
Target Version : 0.9.90
Summary : 시스템관리자 요금제 UI DB 연결
Description : /api/system/billing을 추가해 plans, company_plan_assignments, latest_storage_usage_snapshots를 조회하고, /system/billing 화면에서 DB 기준 요금제/용량/사용량 현황을 표시하도록 연결했습니다. 저장 액션과 결제 자동화는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/system/billing/SystemCompanyPlanSkeleton.tsx
- lib/billing/index.ts
추가 파일 목록 :
- app/api/system/billing/route.ts
- lib/billing/systemBillingTypes.ts
- lib/billing/systemBillingRepository.ts
- lib/billing/api/systemBillingRouteHandlers.ts
- docs/billing/system_billing_ui_db_connection.md
삭제 파일 목록 :
- 없음
