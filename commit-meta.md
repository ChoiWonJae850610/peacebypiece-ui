Version :
0.12.23

Summary :
작업지시서 고급 그리기 tldraw PoC 추가

Description :
작업지시서 디자인 패널의 작업 메뉴에 고급 그리기 항목을 추가하고, tldraw 기반 PoC 모달을 연결했다. 기존 native canvas 직접 그리기는 유지하며, 고급 그리기에서는 tldraw editor의 도형, 텍스트, 선택/이동 기능을 테스트하고 PNG로 export해 기존 디자인 첨부 업로드 흐름으로 저장한다.

수정 파일 목록 :
- lib/constants/app.ts
- package.json
- app/layout.tsx
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts

추가 파일 목록 :
- components/workorder/drawing/WorkOrderTldrawDrawingModal.tsx
- docs/workorder-tldraw-poc-0.12.23.md

삭제 파일 목록 :
없음
