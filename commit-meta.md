Version :
0.10.76

Summary :
초대 생성 API와 초대 링크 실제 저장 1차 연결

Description :
고객관리자 멤버 초대와 시스템관리자 고객사 초대 화면에서 invitations API를 호출해 실제 초대 링크를 생성하고 복사할 수 있도록 연결했다. 초대 repository는 DB가 설정된 경우 invitations 테이블에 token_hash만 저장하고 raw token은 생성 응답에서 한 번만 반환하도록 보정했다. 시스템관리자 고객사 초대는 승인 전 회사가 없을 수 있으므로 company_id NULL 허용 보강 SQL과 테스트 문서를 추가했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- components/system/invitations/SystemCustomerInviteSkeleton.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/invitations/invitationPolicy.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/invitationTypes.ts
- lib/system/systemCustomerInviteSkeleton.ts
- lib/constants/app.ts

추가 파일 목록 :
- db/schema/patch_0_10_76_invitation_actual_create.sql
- docs/actual-invitation-create-link-qr-0.10.76.md

삭제 파일 목록 :
없음
