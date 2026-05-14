Version :
0.11.95

Summary :
작업지시서 우측 패널 semantic token 적용

Description :
작업지시서 우측 디자인, 첨부 파일, 작업 메모 영역의 카드, 파일 추가 영역, empty state, 메모 개수 뱃지를 semantic token 기준 class로 정리했다. 실제 테마 선택 UI는 변경하지 않고 향후 테마 파일 분리를 위한 우측 패널 의미 체계를 추가했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/semanticThemeTokens.ts
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/sidepanel/WorkOrderMemoPanel.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAccordionSection.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx

추가 파일 목록 :
- docs/workorder-sidepanel-semantic-token-0.11.95.md

삭제 파일 목록 :
없음
