Version :
0.9.224393

Summary :
작업지시서 홈 버튼과 멤버 홈 진입점 추가

Description :
작업지시서 화면에서 역할에 맞는 메인화면으로 돌아갈 수 있도록 PC/태블릿/모바일 홈 버튼을 추가했다. 관리자 외 일반 멤버도 사용할 수 있는 /workspace 1차 홈을 추가하고, 역할 기반 홈 경로 유틸과 관련 i18n 문구를 정리했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/layout/types.ts
- components/workorder/layout/WorkOrderDetailDesktopView.tsx
- components/workorder/layout/WorkOrderDetailTabletView.tsx
- components/workorder/layout/WorkOrderDetailMobileView.tsx
- components/layout/MobileTopBar.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts

추가 파일 목록 :
- lib/navigation/workspaceHomeRoutes.ts
- components/workorder/layout/WorkOrderHomeButton.tsx
- components/workspace/MemberWorkspaceHome.tsx
- app/workspace/page.tsx
- docs/workorder-home-navigation-0.9.224393.md

삭제 파일 목록 :
없음
