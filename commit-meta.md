Version :
0.10.8

Summary :
작업지시서 홈 이동과 워크스페이스 카드 흐름 보정

Description :
작업지시서 업무 화면의 홈 이동 라벨과 경로 계산을 역할 기준 유틸로 정리했다. 일반 멤버용 워크스페이스 홈 카드 정의도 컴포넌트에서 분리해 중앙화하고, 업무 화면과 개인 설정 섹션을 나눠 표시하도록 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/navigation/workspaceHomeRoutes.ts
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/layout/WorkOrderHomeButton.tsx
- components/workspace/MemberWorkspaceHome.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts

추가 파일 목록 :
- lib/navigation/memberWorkspaceCards.ts
- docs/workspace-home-flow-0.10.8.md

삭제 파일 목록 :
없음
