Version : 0.10.16
Summary : 감사 로그 행위자 표시 보정
Description : 작업지시서 상태 변경 감사 로그에서 실제 조작자와 담당자가 섞여 보이던 문제를 보정했습니다. 상태 변경 요청에 auditActor를 함께 전달하고, 서버 감사 로그는 해당 값을 실제 행위자로 우선 기록합니다. 감사 로그 화면은 내부 사용자 ID 대신 이름과 역할을 함께 표시하도록 보정했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- types/workorder.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/useWorkOrderAdminActions.ts
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/system/audit/writeActions.ts
- lib/system/audit/actionFlow.ts

추가 파일 목록 :
- docs/system-audit-logs-actor-label-0.10.16.md

삭제 파일 목록 :
- 없음
