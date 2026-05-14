Version :
0.12.36

Summary :
직접 그리기 확대 이동 제거 후 남은 build 오류 수정

Description :
직접 그리기 모달에서 확대/축소 제거 후 남아 있던 handleZoom 및 resetViewport 잔여 함수를 제거해 setViewportScale 미정의 build 오류를 수정했다. 직접 그리기는 100% 기준 native canvas 도구로 유지한다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-zoom-remnant-build-fix-0.12.36.md

삭제 파일 목록 :
없음
