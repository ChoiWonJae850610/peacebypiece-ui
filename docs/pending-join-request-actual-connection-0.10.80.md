# 0.10.80 — 승인 대기 join_requests 실제 연결

## 목표

초대 링크에서 가입 신청을 제출한 뒤 `/pending` 화면에서 실제 `join_requests.pending` 상태를 조회할 수 있게 한다.

## 반영 내용

- `POST /api/invitations/join-requests` 응답의 `redirectPath`에 `requestId`를 포함한다.
- `/pending?requestId={joinRequestId}&type=member|company` 진입 시 실제 가입 신청 상태를 조회한다.
- `/api/invitations/join-requests`에 `GET` 조회를 추가한다.
- 조회 기준은 `requestId` 우선이며, OAuth 연결 전 테스트를 위해 `applicantEmail` 조회도 허용한다.
- `/invite/member/[token]`, `/invite/company/[token]` 신청 완료 후 승인 대기 화면 이동 링크를 표시한다.

## API

### GET /api/invitations/join-requests

Query:

- `requestId` 또는 `id`
- `applicantEmail` 또는 `email`
- `type` 또는 `requestType`: `member | company`
- `status`: 기본 `pending`
- `limit`: 기본 `10`, 최대 `50`

Response:

```json
{
  "ok": true,
  "joinRequests": [],
  "primaryJoinRequest": null,
  "lookupPolicy": "requestId is preferred; applicantEmail lookup is for OAuth-before testing only"
}
```

## 테스트 순서

1. `/admin/members`에서 멤버 초대 생성
2. 생성된 `/invite/member/{rawToken}` 접속
3. 가입 신청 제출
4. 화면에 표시된 `승인 대기 화면으로 이동` 클릭
5. `/pending?requestId=...&type=member`에서 실제 신청 상태 조회 확인

고객사 초대도 동일하다.

1. `/system/invites`에서 고객사 초대 생성
2. 생성된 `/invite/company/{rawToken}` 접속
3. 고객사 가입 신청 제출
4. `/pending?requestId=...&type=company`에서 실제 신청 상태 조회 확인

## 아직 후속 작업으로 남은 것

- OAuth session 사용자와 `join_requests.user_id` 매핑
- 승인 전 업무 route 접근 시 `/pending` redirect
- 고객관리자 `/admin/members` 승인 목록의 실제 `join_requests` 조회 연결
- 승인/거절 action 연결
