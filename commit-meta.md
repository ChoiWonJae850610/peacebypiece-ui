Version : 0.9.85
Base Version : 0.9.84
Target Version : 0.9.85
Summary : 초대 수락 API skeleton 추가
Description : raw token을 sha256 hash로 변환해 invitations.token_hash를 조회하고, pending/expired/revoked/accepted 상태를 판단하는 초대 수락 API skeleton을 추가했습니다. POST 요청에서는 만료되지 않은 pending 초대를 accepted 처리합니다. 실제 회원가입, 로그인, user 생성은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/invitations/index.ts
추가 파일 목록 :
- app/api/invitations/accept/route.ts
- lib/invitations/invitationAcceptanceTypes.ts
- lib/invitations/invitationAcceptanceRepository.ts
- lib/invitations/api/invitationAcceptanceRouteHandlers.ts
- docs/invitations/invitation_accept_api_skeleton.md
삭제 파일 목록 :
- 없음
