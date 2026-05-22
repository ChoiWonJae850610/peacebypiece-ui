Version : 0.15.73.3
Summary : 작업지시서 현재 사용자 권한 소스 단일화
Description : 작업지시서 workspace의 currentUser를 /api/auth/me 기준으로 별도 보존하도록 정리하고, 담당자 목록 users와 현재 로그인 사용자 권한 판단 소스를 분리했습니다. /api/auth/me 응답에 roleTemplateCode를 포함해 현재 사용자 역할 변환을 안정화했으며, 담당자 목록 조회 쿼리의 company_member_id 그룹 기준을 보정했습니다.
수정 파일 목록 :
- app/api/auth/me/route.ts
- lib/admin/settings/userAccessRepository.ts
- lib/auth/currentUser.ts
- lib/constants/app.ts
- lib/data/mock/types.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/repositories/dbWorkorderRepository.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
