Version : 0.12.44
Summary : 직접 그리기 portrait 캔버스 입력 영역 재정리
Description : tablet/mobile 직접 그리기에서 남아 있던 정사각형 경계와 입력 제한을 줄이기 위해 legacy draft를 폐기하고, pointer 입력을 실제 canvas element 기준으로 통일했다. 캔버스 표시 영역과 입력 영역을 일치시켜 흰색 캔버스 전체에서 그릴 수 있도록 보정했다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
추가 파일 목록 :
- docs/workorder-drawing-native-portrait-hit-area-reset-0.12.44.md
삭제 파일 목록 :
- 없음
