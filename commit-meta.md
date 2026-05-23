Version : 0.15.85
Summary : 작업지시서 즉시 저장 후처리 책임 범위 정리
Description : 작업지시서 workflow 후처리 정리 흐름에 맞춰 제목 등 즉시 저장 patch의 local/persisted state 병합 helper를 분리하고, history/saveStatus 반영 경로를 공통 side effect helper로 맞췄습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/workflowActionStateSync.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
