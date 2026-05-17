Version : 0.13.27
Summary : 작업지시서 회사 범위와 승인 멤버 담당자 목록 보정
Description : 로그인 세션의 companyId를 기준으로 작업지시서 조회, 상세 조회, 생성, 저장, 상태 변경, 삭제 범위를 보정하고 작업지시서 담당자 후보를 같은 회사의 승인된 멤버 목록 기준으로 조회하도록 정리했습니다. 관리자 로그인 사용자를 작업지시서 현재 사용자로 우선 동기화해 관리자 생성 권한과 담당자 표시가 실제 세션 기준으로 동작하도록 보완했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/admin/settings/userAccessRepository.ts
- app/api/admin/settings/users/route.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/admin/members/memberRouteHandlers.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
