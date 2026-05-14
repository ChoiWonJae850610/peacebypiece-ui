Version :
0.12.33

Summary :
native 직접 그리기 확대 축소 좌표계 보정

Description :
직접 그리기 모달에서 확대/축소 상태일 때 시각적으로 보이는 캔버스 영역과 pointer 입력 영역이 어긋나던 문제를 수정했다. pointer 이벤트를 canvas container에서 받고 transform 적용 후 canvas 좌표로 변환하도록 보정하여 50% 축소 상태에서도 캔버스 구석 영역에 그릴 수 있게 했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-zoom-coordinate-fix-0.12.33.md

삭제 파일 목록 :
없음
