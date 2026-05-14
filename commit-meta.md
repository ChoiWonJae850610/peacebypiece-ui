Version :
0.12.21

Summary :
작업지시서 직접 그리기 PoC 모달 추가

Description :
작업지시서 디자인 첨부 영역의 직접 그리기 메뉴를 실제 스케치 가능한 모달로 연결했다. 1차 PoC에서는 native canvas 기반으로 펜, 지우개, 전체 지우기, PNG 디자인 저장 흐름을 제공하고 기존 디자인 첨부 업로드 흐름을 재사용하도록 정리했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts

추가 파일 목록 :
- components/workorder/drawing/WorkOrderDrawingModal.tsx
- docs/workorder-drawing-poc-0.12.21.md

삭제 파일 목록 :
없음
