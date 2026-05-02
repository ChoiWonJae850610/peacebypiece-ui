Version : 0.9.109
Base Version : 0.9.108
Target Version : 0.9.109
Summary : 초대 수락 화면 API 연결
Description : /invite/[token] 초대 수락 화면을 skeleton에서 API 연결 화면으로 전환했습니다. GET /api/invitations/accept?token=...로 초대 상태를 조회하고 ready, invalid, expired, revoked, accepted 상태를 표시하며, ready 상태에서 POST /api/invitations/accept로 invitation status를 accepted로 변경할 수 있습니다. 실제 회원가입, 로그인, user 생성, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/invitations/InviteAcceptSkeleton.tsx
- lib/invitations/invitationAcceptanceSkeleton.ts
추가 파일 목록 :
- docs/invitations/invitation_accept_page_api_connection.md
삭제 파일 목록 :
- 없음
