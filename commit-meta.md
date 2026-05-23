Version : 0.15.83
Summary : 작업지시서 workflow persist 상태 반영 경로 정리
Description : workflow action 저장 후 로컬 목록과 persisted 목록을 반영하는 공통 경로를 분리하고, 검토요청/재검토요청/발주요청 저장 결과 반영 방식을 단일화했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
추가 파일 목록 :
- lib/hooks/workorder/workflowActionStateSync.ts
삭제 파일 목록 :
