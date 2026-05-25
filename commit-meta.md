Version : 0.16.50
Summary : 권한 역할 워크플로우 상수화 1차 정리
Description : 세션 역할 상수를 추가하고 인증/라우트/API guard의 역할 문자열 비교를 공통 함수로 정리했습니다. 멤버 역할 템플릿 코드를 상수화하고 작업지시서 기본 workflow/actor role 판정 함수를 공통화했습니다. 담당자 변경과 재검수 분기에서 workflow literal 사용을 줄였습니다.
수정 파일 목록 :
- lib/auth/apiRouteGuards.ts
- lib/auth/companyInvitationLoginRepository.ts
- lib/auth/loginRepository.ts
- lib/auth/routeGuard.ts
- lib/auth/session.ts
- lib/constants/app.ts
- lib/constants/roles.ts
- lib/constants/workorderStates.ts
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderAdminActions.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/permissions/memberPermissionMatrix.ts
- lib/workorder/api/workOrderRouteHandlers.ts
추가 파일 목록 :
- lib/constants/sessionRoles.ts
삭제 파일 목록 :
- 없음
