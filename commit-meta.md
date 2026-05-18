Version : 0.13.58
Summary : 고객사 초대 링크 독립화와 승인 요청 상태 흐름 정리
Description : 고객사 관리자 초대 링크를 이메일/휴대폰 대상과 분리해 독립 token으로 생성하도록 정리했습니다. Google 로그인 이메일 일치 검사를 제거하고, 로그인만으로 가입 신청 검토 목록에 표시되지 않도록 고객사 온보딩 저장 시점에 join_requests pending을 생성하도록 보강했습니다. 시스템 고객사관리 목록은 approval_pending 회사만 표시하도록 필터링하고, invitations.recipient_email nullable 구조를 full_reset과 migration에 반영했습니다.
수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- lib/invitations/invitationPolicy.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/invitationTypes.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
- lib/auth/companyInvitationLoginRepository.ts
- lib/admin/settings/companyOnboardingRepository.ts
- db/schema/full_reset.sql
- lib/constants/app.ts
추가 파일 목록 :
- db/migrations/patch_0_13_58_company_invitation_independent_token.sql
삭제 파일 목록 :
