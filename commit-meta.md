Version : 0.9.83
Base Version : 0.9.82
Target Version : 0.9.83
Summary : invitation DB 저장 연결
Description : invitation repository mode를 db로 전환하고, DB invitation repository에서 invitations 테이블 insert/list/revoke를 처리하도록 연결했습니다. raw token은 DB에 저장하지 않고 token_hash만 저장하며, pending 중복 초대는 409 응답으로 변환했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/invitations/invitationRepositoryMode.ts
- lib/invitations/dbInvitationRepository.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/api/invitationRouteHandlers.ts
추가 파일 목록 :
- docs/invitations/invitation_db_repository_connection.md
삭제 파일 목록 :
- 없음
