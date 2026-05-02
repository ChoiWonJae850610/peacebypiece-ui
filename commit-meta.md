Version :
0.9.51

Summary :
WorkOrderWorkspace에서 useWorkOrder 그룹 반환값 사용 1차 적용

Description :
useWorkOrder의 기존 flat 반환값 대신 ui, identity, history, selection, permissions, attachments, memo, production, cost, persistence, workflow, actions 그룹을 WorkOrderWorkspace에서 직접 사용하도록 변경했다. 기존 viewModel 조립 구조와 화면 렌더링 흐름은 유지했다. APP_VERSION을 0.9.51로 갱신했다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
