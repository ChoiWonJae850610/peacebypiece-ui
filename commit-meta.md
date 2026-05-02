Version : 0.9.105
Base Version : 0.9.104
Target Version : 0.9.105
Summary : 시스템 요금제 용량 UI 본 화면 재연결
Description : 0.9.94에서 회귀 점검 화면으로 대체된 /system/billing을 SystemCompanyPlanSkeleton 본 화면으로 재연결했습니다. 기존 GET /api/system/billing을 사용해 plans, company_plan_assignments, latest_storage_usage_snapshots 기반 overview를 표시하고 고객사별 active plan, 저장공간 사용량, 멤버 수, 가격 정보를 read-only로 보여줍니다. 저장 action, 결제 자동화, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/system/billing/page.tsx
- components/system/billing/SystemCompanyPlanSkeleton.tsx
- lib/system/systemRegressionRoutes.ts
추가 파일 목록 :
- docs/system/system_billing_ui_reconnect.md
삭제 파일 목록 :
- 없음
