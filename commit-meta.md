Version : 0.16.51
Summary : 멤버 역할 preset 권한 코드 상수화 정리
Description : 멤버 권한 preset과 관리자 멤버관리 화면에서 직접 사용하던 권한 코드 문자열을 MEMBER_PERMISSION_CODE와 역할 템플릿 helper로 정리했습니다. 인증/session/workflow/API 동작 정책은 변경하지 않고, 역할/권한 코드 참조 기준만 1차로 정리했습니다.
수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/adminWorkspaceCards.ts
- lib/admin/members/memberManagementPresentation.ts
- lib/admin/members/memberWorkspaceAccess.ts
- lib/constants/app.ts
- lib/invitations/joinRequestRepository.ts
- lib/permissions/apiPermissionGuard.ts
- lib/permissions/memberPermissionMatrix.ts
- lib/permissions/permissionAccess.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
