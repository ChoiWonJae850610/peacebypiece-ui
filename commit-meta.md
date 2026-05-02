Version :
0.9.50

Summary :
useWorkOrder 반환값 그룹화 1차

Description :
useWorkOrder의 기존 flat 반환값은 유지하면서 ui, runtime, repository, identity, history, selection, permissions, attachments, memo, production, cost, persistence, workflow, actions 그룹 반환값을 추가했다. 기존 WorkOrderWorkspace 호출부와 화면 동작은 변경하지 않고, 다음 단계에서 workspace 조립부를 그룹 기반으로 전환할 수 있는 기반만 추가했다. APP_VERSION을 0.9.50으로 갱신했다.

수정 파일 목록 :
- lib/hooks/useWorkOrder.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
