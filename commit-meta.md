Version : 0.12.41
Summary : 직접 그리기 모바일 정사각형 캔버스 분기 제거
Description : 직접 그리기 native canvas에서 mobile variant에만 900x900 정사각형 원본 크기가 적용되던 분기를 제거하고, 모든 variant가 1280x900 원본 canvas 비율을 사용하도록 정리했습니다. 세로/가로 회전 시 원본 비율 유지와 기존 PNG 저장 흐름은 유지했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-canvas-ratio-fix-0.12.41.md

삭제 파일 목록 :
- 없음
