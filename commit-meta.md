Version :
0.10.57

Summary :
멤버 초대 링크 가입 신청 화면 추가

Description :
고객관리자 내부 멤버 초대 링크로 접속하는 /invite/member/[token] 가입 신청 화면을 추가하고, 초대 URL 생성 기준을 멤버 초대와 고객사 초대 경로로 분리했다. 실제 OAuth 연결과 join_requests 저장은 후속 작업으로 남겼다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/invitationQrPreview.ts
- lib/invitations/index.ts

추가 파일 목록 :
- app/invite/member/[token]/page.tsx
- components/invitations/MemberInvitationJoinRequestPage.tsx
- lib/invitations/memberInvitationJoinRequestPresentation.ts
- docs/invite-member-join-request-screen-0.10.57.md

삭제 파일 목록 :
없음
