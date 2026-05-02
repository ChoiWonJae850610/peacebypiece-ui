# 초대 수락 API skeleton

Version: 0.9.85

## 추가 route

- `GET /api/invitations/accept?token=...`
- `POST /api/invitations/accept`

## 이번 패치 기준

1. raw token을 서버에서 sha256 hash로 변환한다.
2. `invitations.token_hash`로 invitation을 조회한다.
3. pending / expired / revoked / accepted 상태를 판단한다.
4. POST 요청은 pending이고 만료되지 않은 invitation만 accepted 처리한다.
5. `accepted_user_id`는 선택값으로 받는다.
6. 실제 회원가입, 로그인, user 생성은 아직 연결하지 않는다.

## 응답 상태

- `ready`: 수락 가능
- `invalid`: token 없음 또는 invitation 없음
- `expired`: 만료
- `revoked`: 취소
- `accepted`: 수락 완료 또는 이미 수락됨

## 다음 작업

0.9.86에서 company/user repository 실제 DB 연결 1차를 진행한다.
