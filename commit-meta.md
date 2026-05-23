Version : 0.15.87
Summary : 작업지시서 workflow action hook 잔여 정리
Description : 재고 반영과 검수 완료 persist 성공 후 상태 반영을 공통 helper로 위임하고, workflow action hook 내부의 중복 상태 동기화 코드를 축소했습니다. 기능 변경 없이 workOrdersRef, local workOrders, persistedWorkOrders, saveStatus 동기화 경로를 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/workflowActionStateSync.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
