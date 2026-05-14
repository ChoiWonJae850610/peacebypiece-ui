Version :
0.12.35

Summary :
직접 그리기 확대 이동 기능 제거와 태블릿 사용성 수습

Description :
native canvas 직접 그리기에서 확대/축소와 손바닥 이동 기능을 제거하고, 100% 기준의 안정적인 캔버스 입력 구조로 복구했다. 깨졌던 캔버스 표시 높이를 정상화하고 펜, 지우개, 선, 도형, 색상, 굵기, 실선·점선, undo/redo, 저장 흐름은 유지했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-tablet-stabilization-0.12.35.md

삭제 파일 목록 :
없음
