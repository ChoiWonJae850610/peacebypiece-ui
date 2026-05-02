# 초대 수락 페이지 skeleton

Version: 0.9.84

## 추가 route

- `/invite/[token]`

## 이번 패치 기준

1. URL의 token을 page params로 받는다.
2. token은 화면에서 마스킹해서 표시한다.
3. 실제 token 검증 API는 호출하지 않는다.
4. ready / invalid / expired / revoked / accepted 상태 카드를 skeleton으로 준비한다.
5. 실제 인증/회원가입 연결은 하지 않는다.

## 다음 작업

0.9.85에서 초대 수락 API skeleton을 추가한다.

예상 API:
- `GET /api/invitations/accept?token=...`
- `POST /api/invitations/accept`

예상 처리:
- raw token을 sha256 hash로 변환
- invitations.token_hash 조회
- pending / expired / revoked / accepted 상태 판단
- accepted 처리 skeleton
