Version :
0.13.69

Summary :
고객사 체험 만료 화면과 관리자 접근 분기 추가

Description :
무료체험 만료 또는 결제 확인이 필요한 고객사 관리자에게 요금제 관리 화면을 표시하고, 일반 멤버는 서비스 대기 화면으로 분리되도록 접근 분기와 안내 화면을 추가했다. 결제 API는 연결하지 않고 화면 진입과 상태 안내만 정리했다.

수정 파일 목록 :
- app/admin/layout.tsx
- app/service-paused/page.tsx
- lib/auth/routeGuard.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/admin/subscription/page.tsx
- components/admin/billing/AdminCompanyAccessGate.tsx
- components/admin/billing/AdminSubscriptionConsole.tsx
- lib/admin/billing/adminSubscription.presentation.ts

삭제 파일 목록 :
없음
