Version :
0.12.51

Summary :
iPad 전용 직접 그리기 editor 분리

Description :
iPad Safari의 화면 회전 복귀 시 직접 그리기 모달 표시가 흔들리는 문제를 줄이기 위해 iPad 전용 editor를 추가했다. PC, Android tablet, mobile editor는 기존 파일을 유지하고, iPad에서만 안정화된 viewport 높이 기준을 사용하도록 분리했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
- components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx
- components/workorder/drawing/drawingDevicePolicy.ts

추가 파일 목록 :
- components/workorder/drawing/WorkOrderDrawingIpadEditor.tsx

삭제 파일 목록 :
없음
