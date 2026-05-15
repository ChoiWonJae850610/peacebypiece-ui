Version :
0.12.40

Summary :
직접 그리기 캔버스 고정 비율 표시 보정

Description :
직접 그리기 화면에서 태블릿 세로/가로 전환 후 정사각형이 직사각형처럼 찌그러져 보이는 문제를 보정했다. canvas 원본 크기는 고정하고, 화면 표시 크기만 container 안에서 원본 비율을 유지하는 contain 방식으로 계산하도록 수정했다. 기존 PNG 저장과 R2 디자인 첨부 업로드 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-fixed-canvas-ratio-0.12.40.md

삭제 파일 목록 :
없음
