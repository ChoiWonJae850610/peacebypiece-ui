Version :
0.9.194

Summary :
작업지시서 전역 쓰기 잠금 QA 기준 보완

Description :
작업지시서 처리 중 좌측 카드 메뉴가 잠금 상태를 직접 인식하도록 보완하고, 사이드바와 모바일 drawer에서 작업 콜백을 제거하는 대신 write lock 상태를 카드까지 전달하도록 정리했다. 리오더, 삭제, 상태 변경, 메모, 첨부, 편집 처리 중 메뉴가 열려 있으면 자동으로 닫히고, 잠금 중에는 기존 CUD 액션이 실행되지 않도록 보완했다.

수정 파일 목록 :
- components/layout/MobileDrawer.tsx
- components/layout/SidebarContent.tsx
- components/workorder/list/WorkOrderListCard.tsx
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
