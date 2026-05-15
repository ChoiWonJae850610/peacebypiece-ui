Version :
0.12.39

Summary :
직접 그리기 태블릿 회전 시 draft 보존 보정

Description :
직접 그리기 full-screen editor에서 태블릿 세로/가로 전환 시 canvas 내용이 사라지지 않도록 그리기 확정, undo/redo, orientationchange, resize, pagehide 시점에 draft snapshot을 저장하도록 보정했다. 원본 canvas 좌표 기준 복원 흐름은 유지하고 확대/축소, 손바닥 이동, 이미지 위에 그리기는 계속 제외했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-orientation-draft-0.12.39.md

삭제 파일 목록 :
없음
