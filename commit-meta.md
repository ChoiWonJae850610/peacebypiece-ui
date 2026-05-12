Version :
0.10.83

Summary :
고객관리자 멤버 권한 수정 실제 연결

Description :
고객관리자 멤버 관리 화면에서 승인된 company_members와 member_permissions를 실제 DB 기준으로 조회하도록 연결했다. 승인된 멤버의 권한 체크리스트를 수정해 저장할 수 있는 API와 repository를 추가했고, 권한 저장은 member_permissions의 is_enabled 값을 전체 교체 방식으로 갱신한다. system 전용 권한 저장을 차단하고 member.permission_updated 감사 로그를 기록하도록 연결했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/constants/app.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts

추가 파일 목록 :
- app/api/admin/members/route.ts
- app/api/admin/members/[memberId]/permissions/route.ts
- lib/admin/members/memberRepository.ts
- lib/admin/members/memberRouteHandlers.ts
- lib/admin/members/memberTypes.ts

삭제 파일 목록 :
없음
