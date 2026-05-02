# invitation API 타입 / 빌드 안정화

Version: 0.9.80

## 점검 대상

- `app/api/invitations/route.ts`
- `lib/invitations/invitationTypes.ts`
- `lib/invitations/invitationPolicy.ts`
- `lib/invitations/invitationRepository.ts`
- `lib/invitations/api/invitationRouteHandlers.ts`
- `lib/invitations/index.ts`

## 이번 패치 기준

1. `InvitationRepository`의 Promise generic을 명시한다.
2. `InvitationDraft`에 `inviterCompanyId`, `createdByUserId`, `createdBySystemUserId`를 포함한다.
3. `InvitationRecord`에 `createdBySystemUserId`, `acceptedUserId`를 포함한다.
4. route handler의 body 타입과 draft 타입을 일치시킨다.
5. raw token은 생성 응답에서만 반환하고 repository에는 token_hash만 저장한다.
6. 실제 DB 저장과 이메일 발송은 아직 연결하지 않는다.

## 다음 작업

0.9.81에서 초대 UI와 invitation API 연결 1차 작업을 진행한다.
