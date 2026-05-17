Version :
0.13.32

Summary :
멤버관리 회사 범위 기준과 초대 승인 scope 보강

Description :
멤버관리 목록과 권한 수정, 멤버 초대 생성, 가입 승인/거절 조회가 실제 로그인 세션의 companyId 기준으로만 동작하도록 보강했다. 관리자 멤버 화면의 하드코딩 회사명과 companyId 요청 파라미터 의존을 제거하고, DB 미설정 시 멤버 mock fallback을 반환하지 않도록 정리했다.

수정 파일 목록 :
- app/admin/members/page.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberRepository.ts
- lib/admin/members/memberRouteHandlers.ts
- lib/admin/members/memberTypes.ts
- lib/constants/app.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts

추가 파일 목록 :
- lib/admin/members/sessionScope.ts

삭제 파일 목록 :
없음
