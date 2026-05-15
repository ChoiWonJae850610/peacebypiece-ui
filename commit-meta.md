Version :
0.12.54

Summary :
iPad 직접 그리기 orientation 원인 확인용 디버그 오버레이 추가

Description :
iPad에서 직접 그리기 모달이 세로 복귀 시 깨지는 원인을 확인할 수 있도록 iPad 전용 디버그 오버레이를 추가했다. 오버레이는 iPad 직접 그리기 화면에서만 표시되며 orientation, viewport, body lock, modal panel rect, canvas container rect, canvas rect 값을 보여준다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
