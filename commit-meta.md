Version : 0.12.43
Summary : 직접 그리기 portrait canvas 잔여 정사각형 보정
Description : tablet-like touch viewport에서는 직접 그리기 editor가 portrait 작업판 기준을 유지하도록 하고, legacy draft snapshot과 크기가 다른 draft를 복원하지 않도록 정리했습니다. 이전 900x900 또는 landscape draft가 새 portrait canvas 안에 정사각형 경계처럼 남는 문제를 줄이기 위해 draft metadata를 추가하고 동일 크기 snapshot만 1:1 복원하도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
추가 파일 목록 :
- docs/workorder-drawing-native-portrait-canvas-reset-0.12.43.md
삭제 파일 목록 :
- 없음
