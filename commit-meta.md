Version :
0.12.47

Summary :
직접 그리기 PC/tablet/mobile editor 파일 분리

Description :
작업지시서 직접 그리기 모달의 진입 파일을 device별 editor 분기만 담당하도록 줄이고, 공통 canvas editor와 device policy 파일을 분리했다. PC 정책은 landscape 차단을 false로 고정해 PC 창 크기 변경 시 세로모드 안내가 나오지 않도록 정리했다. tablet/mobile은 별도 editor와 portrait canvas 정책을 사용하도록 분리했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx
- components/workorder/drawing/WorkOrderDrawingDesktopEditor.tsx
- components/workorder/drawing/WorkOrderDrawingTabletEditor.tsx
- components/workorder/drawing/WorkOrderDrawingMobileEditor.tsx
- components/workorder/drawing/drawingDevicePolicy.ts

삭제 파일 목록 :
없음
