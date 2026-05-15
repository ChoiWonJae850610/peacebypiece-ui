Version :
0.12.55

Summary :
직접 그리기 모달 렌더링 위치 상위 고정

Description :
직접 그리기 모달을 첨부 패널 내부가 아니라 작업지시서 사이드패널 컨테이너의 공통 위치에서 렌더링하도록 이동했다. iPad에서 세로/가로 전환 시 모바일 아코디언 또는 responsive branch 변경으로 모달이 화면에서 사라지는 문제를 줄이고, 임시 iPad 디버그 오버레이를 제거했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx
- components/workorder/sidepanel/WorkOrderSidePanelContainer.tsx
- components/workorder/sidepanel/WorkOrderSidePanel.types.ts
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelSections.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelTabletView.tsx

추가 파일 목록 :
- components/workorder/drawing/workOrderDrawingModalSession.ts

삭제 파일 목록 :
없음
