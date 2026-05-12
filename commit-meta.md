Version :
0.10.74

Summary :
고객관리자 요금제 화면 현재 고객사 데이터 연결

Description :
고객관리자 환경설정의 요금제·결제 모달이 현재 고객사 설정 API를 조회해 고객사명, 저장공간 한도, 저장공간 경고 기준, 휴지통 포함 여부를 읽기 전용으로 표시하도록 보정했다. /api/admin/companies/current 응답에도 billing 요약을 추가했다.

수정 파일 목록 :
- app/api/admin/companies/current/route.ts
- components/admin/settings/AdminSettingsHub.tsx
- lib/admin/settings/adminBillingPlanPlaceholder.ts
- lib/admin/settings/adminSettingsHub.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-billing-current-company-data-0.10.74.md

삭제 파일 목록 :
없음
