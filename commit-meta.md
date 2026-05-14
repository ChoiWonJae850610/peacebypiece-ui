Version :
0.12.22

Summary :
작업지시서 직접 그리기 native canvas 기능 보완

Description :
작업지시서 직접 그리기 모달에 펜 색상 선택, 펜 굵기 선택, undo/redo를 추가했다. 전체 지우기 이후에도 undo로 이전 그림을 복원할 수 있도록 canvas snapshot 기반 이력을 보관하고, 모바일 안내 문구와 한영 i18n 문구를 함께 보완했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts

추가 파일 목록 :
- docs/workorder-drawing-native-enhancement-0.12.22.md

삭제 파일 목록 :
없음
