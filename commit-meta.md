Version : 0.9.80
Base Version : 0.9.79
Target Version : 0.9.80
Summary : invitation API 타입 안정화
Description : invitation API의 route handler, policy, repository, types를 정리해 Promise generic 누락, draft/record 필드 불일치, createdBySystemUserId/acceptedUserId 누락 가능성을 보완했습니다. raw token 1회 반환 정책은 유지하고 앱 버전을 0.9.80으로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/invitations/route.ts
- lib/invitations/invitationTypes.ts
- lib/invitations/invitationPolicy.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/invitations/index.ts
추가 파일 목록 :
- docs/invitations/invitation_api_type_check.md
삭제 파일 목록 :
- 없음
