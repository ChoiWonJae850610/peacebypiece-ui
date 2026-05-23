Version : 0.15.89
Summary : 작업지시서 사용자 표시명 동기화 보정
Description : 프로필 이름 변경 후 작업지시서 메모/담당자 표시명에 최신 사용자명이 반영되도록 보정하고, 담당자 변경 모달을 열 때 최신 멤버 목록을 재조회합니다. 메모 작성자 표시에서 관리자 역할을 무조건 대표로 치환하던 fallback을 제거하고 authorId 기준 사용자 프로필명을 우선 표시하도록 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderSessionProfile.ts
- components/me/PersonalSettingsPage.tsx
- components/workorder/sidepanel/WorkOrderMemoPanel.tsx
- components/workorder/sidepanel/WorkOrderSidePanel.types.ts
- components/workorder/sidepanel/shared/WorkOrderSidePanelSections.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelTabletView.tsx
- lib/workorder/workspace/builders/detailBuilders.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/viewModelTypes.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
