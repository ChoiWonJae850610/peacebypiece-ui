Version :
0.10.63

Summary :
고객사 가입 신청 화면 추가

Description :
시스템관리자 고객사 초대 링크로 접속하는 /invite/company/[token] 화면을 추가하고, 고객사 가입 신청 항목과 승인 전 회사 미생성 정책을 presentation 데이터로 분리했다. 시스템관리자 고객사 초대 화면의 가입 신청 화면 미리보기 액션도 새 경로로 연결했다.

수정 파일 목록 :
- components/system/invitations/SystemCustomerInviteSkeleton.tsx
- lib/invitations/index.ts
- lib/system/systemCustomerInviteSkeleton.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/invite/company/[token]/page.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- lib/invitations/companyInvitationJoinRequestPresentation.ts
- docs/company-invite-join-request-screen-0.10.63.md

삭제 파일 목록 :
없음
