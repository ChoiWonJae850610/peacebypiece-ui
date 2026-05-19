Version :
0.14.2

Summary :
멤버 초대 링크 scope 분리와 링크 전용 초대 생성 오류 수정

Description :
고객사 관리자 멤버초대 목록에서 시스템관리자 고객사 초대 링크가 섞이지 않도록 company_to_member scope만 조회하도록 보정했다. 멤버 초대 링크를 이메일 대상 없이 생성할 수 있도록 invitations 제약과 route payload를 수정하고, 초대 생성 실패 시 내부 오류 코드 대신 사용자 문구가 표시되도록 정리했다. 멤버초대 카드 좌우 비율도 시스템관리자 고객사 초대 화면과 맞췄다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/invitations/invitationRepository.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
- db/migrations/patch_0_14_2_member_invitation_link_only.sql

삭제 파일 목록 :
없음
