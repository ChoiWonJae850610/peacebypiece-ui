Version : 0.9.84
Base Version : 0.9.83
Target Version : 0.9.84
Summary : 초대 수락 페이지 skeleton 추가
Description : /invite/[token] route와 초대 수락 skeleton 화면을 추가했습니다. URL token은 마스킹해 표시하고 ready, invalid, expired, revoked, accepted 상태 카드를 준비했습니다. 실제 token 검증 API, 인증, 회원가입 연결은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- app/invite/[token]/page.tsx
- components/invitations/InviteAcceptSkeleton.tsx
- lib/invitations/invitationAcceptanceSkeleton.ts
- docs/invitations/invitation_accept_page_skeleton.md
삭제 파일 목록 :
- 없음
