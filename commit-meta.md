Version : 0.12.46
Summary : 직접 그리기 가로모드 차단 후 세로 복귀 시 draft 유지 보정
Description : 태블릿에서 직접 그리기를 세로모드로 사용하다가 가로모드 안내 화면을 확인한 뒤 다시 세로모드로 돌아왔을 때 기존 그림이 사라지지 않도록 viewport 판정과 draft snapshot 저장 흐름을 보정합니다. touch tablet-like viewport는 한 번 감지되면 해당 세션에서 유지하고, landscape 차단 진입 시 canvas snapshot을 저장하며 진행 중인 pointer 상태만 정리합니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
추가 파일 목록 :
- docs/workorder-drawing-native-landscape-draft-restore-0.12.46.md
삭제 파일 목록 :
- 없음
