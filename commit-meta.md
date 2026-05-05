Version :
0.9.192

Summary :
리오더와 삭제 처리 중 로딩 표시와 쓰기 잠금 보완

Description :
작업지시서 리오더와 삭제 실행 중에도 전역 쓰기 잠금을 유지하고 하단 중앙 처리 중 표시를 추가했다. 좌측 작업지시서 카드 메뉴는 상태 전환, 리오더, 삭제 처리 중 비활성화되며 모바일 drawer에서도 동일한 잠금 기준을 적용했다.

수정 파일 목록 :
- components/layout/MobileDrawer.tsx
- components/layout/SidebarContent.tsx
- components/workorder/WorkOrderOverlay.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/list/WorkOrderListCard.tsx
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
