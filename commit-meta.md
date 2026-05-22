Version : 0.15.73.8
Summary : 작업지시서 발주정보 저장 정책과 검토요청 draft 동기화 보정
Description : 발주정보의 vendor/dueDate/priority를 draft 비교 대상에 유지하도록 타입 오류를 수정하고, 즉시 저장 serviceCode 판정에서 제외했습니다. 검토요청/발주요청 직전에 상세 화면 draft를 작업지시서 상태에 먼저 동기화해 공장/수량/날짜 입력값이 workflow 검증에 누락되지 않도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/storagePolicy.ts
- lib/workorder/serviceCodeForWorkOrderPatch.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
