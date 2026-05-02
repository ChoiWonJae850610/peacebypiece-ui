Version : 0.9.63
Base Version : 0.9.62
Target Version : 0.9.63
Summary : 초대 링크 생성 API skeleton 추가
Description : 초대 링크 생성과 목록 조회를 위한 얇은 API route, invitation route handler, in-memory repository skeleton, raw token 1회 반환 및 token_hash 생성 흐름을 추가하고 앱 버전을 0.9.63으로 갱신했습니다. 실제 DB 저장, 이메일 발송, QR UI는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/invitations/invitationTypes.ts
- lib/invitations/index.ts
추가 파일 목록 :
- app/api/invitations/route.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/api/invitationRouteHandlers.ts
삭제 파일 목록 :
- 없음
