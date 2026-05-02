Version : 0.9.82
Base Version : 0.9.81
Target Version : 0.9.82
Summary : invitation DB repository 연결 준비
Description : invitation repository를 memory repository와 DB skeleton repository로 분리하고, 향후 DB 전환을 위한 repository mode와 not-connected DB skeleton을 추가했습니다. 기존 in-memory 초대 링크 생성 API 동작과 응답 포맷은 유지하고 앱 버전을 0.9.82로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/index.ts
추가 파일 목록 :
- lib/invitations/dbInvitationRepository.ts
- lib/invitations/invitationRepositoryMode.ts
- docs/invitations/invitation_db_repository_preparation.md
삭제 파일 목록 :
- 없음
