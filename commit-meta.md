Version : 0.15.84
Summary : 작업지시서 workflow 후처리 상태 반영 정리
Description : 작업지시서 workflow action 처리 후 history, toast, saveStatus 반영 경로를 workflowActionStateSync 유틸로 분리하고 중복 후처리 로직을 정리했습니다. 검토요청, 재검토요청, 발주요청, 재고/검수 반영의 저장 시작/실패 처리와 history/toast 반영을 공통 helper로 수렴했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/workflowActionStateSync.ts
추가 파일 목록 :
삭제 파일 목록 :
