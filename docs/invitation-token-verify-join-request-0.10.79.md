# 0.10.79 초대 링크 token 검증과 가입 신청 저장

## 목표

초대 링크나 QR로 접속한 사용자가 실제 raw token을 제출하면 서버에서 token_hash로 invitations를 조회하고, 가입 신청을 join_requests.pending으로 저장할 수 있게 한다.

## 적용 범위

- `GET /api/invitations/verify`
- `POST /api/invitations/join-requests`
- `/invite/member/[token]`
- `/invite/company/[token]`
- `join_requests` reset schema 보정

## 주요 정책

1. raw token은 DB에 저장하지 않는다.
2. 서버는 raw token을 SHA-256 token_hash로 변환해 invitations를 조회한다.
3. member 신청은 `company_to_member` 초대만 허용한다.
4. company 신청은 `system_to_company_admin` 초대만 허용한다.
5. 만료되었거나 pending/active가 아닌 초대는 신청 저장을 막는다.
6. OAuth 연결 전까지는 `join_requests.user_id`를 nullable로 두고 `applicant_email`로 신청자를 식별한다.
7. 같은 invitation + applicant_email의 pending 신청은 중복 저장하지 않는다.
8. 가입 신청 저장 시 `join_request.created` audit log를 남긴다.

## reset 반영

`join_requests`에 아래 항목을 추가/보정했다.

- `user_id` nullable
- `applicant_email` 필수
- `business_name`
- `request_memo`
- `join_requests_pending_invitation_email_unique`

따라서 reset 후 바로 초대 생성과 가입 신청 저장을 테스트할 수 있다.

## 테스트 순서

```powershell
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/seed/system_standards_seed.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
```

1. `/admin/members`에서 멤버 초대 생성
2. 생성된 `/invite/member/{rawToken}`으로 접속
3. 이름/이메일/연락처/메모 입력 후 가입 신청 제출
4. `join_requests`에 `request_type = 'member'` row가 생겼는지 확인
5. `/system/invites`에서 고객사 초대 생성
6. 생성된 `/invite/company/{rawToken}`으로 접속
7. 담당자/회사명/이메일 입력 후 고객사 가입 신청 제출
8. `join_requests`에 `request_type = 'company'` row가 생겼는지 확인

## 확인 SQL

```sql
select
  jr.id,
  jr.request_type,
  jr.applicant_email,
  jr.applicant_name,
  jr.requested_company_name,
  jr.status,
  i.scope,
  i.recipient_email,
  jr.created_at
from join_requests jr
left join invitations i on i.id = jr.invitation_id
order by jr.created_at desc
limit 20;
```

```sql
select event_type, target_type, target_id, summary, metadata, created_at
from audit_logs
where event_type in ('invitation.created', 'join_request.created')
order by created_at desc
limit 20;
```

## 후속 작업

다음 단계는 `/pending`에서 실제 join_requests를 조회하고, 고객관리자/시스템관리자 승인 화면에서 pending 신청을 불러오는 것이다.
