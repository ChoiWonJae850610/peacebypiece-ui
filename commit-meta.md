Version : 0.13.60
Summary : 고객사 초대 링크 목록과 발송 UI 정리
Description : 고객사 관리자 초대 영역을 전달 방식/대상 입력, 만료일 선택, 독립 링크 생성, 초대 링크 목록 구조로 재정리했습니다. 시스템관리자 초대 링크 목록 조회와 취소 API를 추가하고, 초대 링크를 재복사할 수 있도록 invitations에 invite_url_path를 저장합니다. 고객사 초대 검증 화면은 유효/무효 상태 문구가 충돌하지 않도록 정리했습니다.
수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- lib/invitations/invitationRepository.ts
- lib/invitations/invitationTypes.ts
- lib/invitations/api/invitationRouteHandlers.ts
- db/schema/full_reset.sql
- lib/constants/app.ts
추가 파일 목록 :
- app/api/invitations/[invitationId]/revoke/route.ts
- db/migrations/patch_0_13_60_invitation_link_list.sql
삭제 파일 목록 :
- 없음
