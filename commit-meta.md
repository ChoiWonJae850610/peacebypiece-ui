Version :
0.12.38

Summary :
직접 그리기 태블릿 회전 안정화

Description :
직접 그리기 전체 화면 작업창이 태블릿 세로/가로 전환 중 닫히는 문제를 줄이기 위해 open 상태와 canvas draft snapshot을 sessionStorage에 임시 유지하도록 보정했다. 회전 또는 responsive layout 전환으로 컴포넌트가 다시 mount되어도 직접 그리기 화면과 작성 중인 그림을 복구할 수 있게 했다. 하단 도구 영역 밀도와 캔버스 여백도 소폭 조정했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx

추가 파일 목록 :
- docs/workorder-drawing-native-orientation-stabilization-0.12.38.md

삭제 파일 목록 :
없음
