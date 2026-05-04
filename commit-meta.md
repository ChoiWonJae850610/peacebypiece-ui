Version :
0.9.155

Summary :
작업지시서 디자인·첨부 영역 업로드 진입점 정리

Description :
작업지시서 우측 디자인/첨부 영역의 파일 추가 진입점을 ... 액션 메뉴와 점선 안내 영역으로 정리했다. 디자인 영역에는 향후 직접 그리기 기능 연결을 위한 준비 상태 메뉴 항목을 추가했다. 실제 drag-and-drop 업로드 로직과 그리기 라이브러리 연결은 추가하지 않았고, 기존 첨부 업로드/삭제/썸네일/R2 흐름은 유지했다.

수정 파일 목록 :
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-attachment-panel-ux-0.9.155.md

삭제 파일 목록 :
없음
