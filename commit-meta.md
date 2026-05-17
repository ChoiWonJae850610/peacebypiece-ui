Version :
0.13.43

Summary :
작업지시서 워크플로우 권한과 발주 가능 흐름 연결

Description :
작업지시서 업무 화면의 검토 요청과 발주 요청 버튼 노출 기준을 멤버 권한 코드와 연결했다. 멤버 권한의 발주 가능 체크가 있는 경우 본인 담당 작업지시서에서 검토 완료 절차 없이 발주 요청을 진행할 수 있도록 워크플로우 정책과 클라이언트 검증을 보강했다. 상태 변경 API도 세션 회사와 멤버 권한 기준으로 검증하도록 수정했다.

수정 파일 목록 :
- types/user.ts
- lib/admin/settings/userAccessRepository.ts
- lib/workorder/workflowPolicy.ts
- lib/workorder/workflow.ts
- lib/hooks/workorder/derived/buildWorkOrderDerivedState.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
