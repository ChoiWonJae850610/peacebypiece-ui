# invitation DB 저장 연결

Version: 0.9.83

## 목적

0.9.82에서 준비한 DB repository skeleton을 실제 `invitations` 테이블 저장 구조로 연결한다.

## 이번 패치 기준

1. `INVITATION_REPOSITORY_MODE`를 `db`로 전환한다.
2. `createDbInvitationRepository`가 `invitations` 테이블에 insert한다.
3. raw token은 DB에 저장하지 않고 `token_hash`만 저장한다.
4. 생성 응답에서는 raw token과 inviteUrl을 한 번 반환한다.
5. `GET /api/invitations?companyId=...`는 DB에서 목록을 조회한다.
6. pending 중복 초대 unique constraint 충돌은 409 응답으로 변환한다.
7. `revokeInvitation`은 pending 초대만 revoked 처리한다.

## 제외

- 이메일 발송
- 초대 수락 페이지
- 인증/회원가입 연결
- invitation permission override table
