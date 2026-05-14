Version :
0.12.34

Summary :
직접 그리기 축소 상태 입력 영역 보정

Description :
직접 그리기 모달에서 50% 축소 시 보이는 캔버스 구석 영역에 실제 그리기가 되지 않던 문제를 수정했다. pointer 이벤트를 시각적으로 변환된 캔버스 stage에서 직접 받도록 정리하고, 캔버스 밖 영역은 theme surface로 구분되게 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-zoom-hit-area-fix-0.12.34.md

삭제 파일 목록 :
없음
