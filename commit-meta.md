Version :
0.12.52

Summary :
iPad 직접 그리기 세로 복귀 차단 상태 해제 보정

Description :
iPad 전용 직접 그리기 editor에서 orientation 전환 이후 viewport와 차단 상태를 여러 단계로 재동기화하도록 보정했다. iPad 정책에 한해 portrait 복귀 감지를 우선 처리하여 가로모드 안내 후 세로모드로 돌아왔을 때 landscape 차단 상태가 남지 않도록 했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingIpadEditor.tsx
- components/workorder/drawing/drawingDevicePolicy.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
