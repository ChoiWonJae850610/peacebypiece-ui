Version :
0.10.67

Summary :
고객관리자 요금제 결제 안내 보정

Description :
고객관리자 환경설정의 요금제·결제 항목을 단순 준비중 안내에서 현재 요금제와 저장공간 한도, 멤버 한도, 변경 요청 정책을 읽기 전용으로 확인하는 placeholder로 보정했다. 요금제 표시 데이터는 공통 billing plan policy를 참조하는 별도 presentation 파일로 분리했다.

수정 파일 목록 :
- components/admin/settings/AdminSettingsHub.tsx
- lib/admin/settings/adminSettingsHub.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/admin/settings/adminBillingPlanPlaceholder.ts
- docs/admin-billing-placeholder-0.10.67.md

삭제 파일 목록 :
없음
