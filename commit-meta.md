Version : 0.13.23
Summary : 작업지시서 상단 버튼과 세션 기준 홈 이동 보정
Description : 작업지시서 상단 버튼 크기를 관리자 상단 버튼과 맞추고, 일반 화면에서 작업지시서 목록/버전 개발 표시를 숨겼습니다. 현재 세션 조회 유틸과 /api/auth/me를 추가하고, 고객사 관리자 세션으로 작업지시서 화면에 들어온 경우 홈 버튼이 /admin으로 이동하도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/worker/page.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/layout/SidebarContent.tsx
- components/layout/MobileTopBar.tsx
추가 파일 목록 :
- lib/auth/currentSession.ts
- app/api/auth/me/route.ts
삭제 파일 목록 :
- 없음
