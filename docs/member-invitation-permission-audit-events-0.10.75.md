# 0.10.75 멤버·초대·권한 감사 로그 연결

## 목적

0.10.75에서는 초대, 고객사 생성, 멤버 승인, 멤버 거절, 멤버 권한 변경, 요금제 변경을 시스템관리자 감사 로그의 동일한 계층에서 기록할 수 있도록 이벤트 빌더를 추가한다.

## 이번 버전에서 실제 연결한 지점

- `POST /api/invitations`
  - `invitation.created`
  - 고객관리자 내부 멤버 초대와 시스템관리자 고객사 초대를 같은 이벤트 코드로 기록한다.
  - `scope`으로 `company_to_member`와 `system_to_company_admin`을 구분한다.
  - raw token은 metadata에 넣지 않는다.
  - `inviteUrlPath`에는 경로만 기록한다.

- `POST /api/system/companies`
  - `company.created`
  - 현재 회사 repository가 skeleton이면 실제 쓰기는 아직 발생하지 않는다.
  - 실제 회사 생성 repository가 연결되면 회사 생성 성공 후 감사 로그가 기록된다.

## 이번 버전에서 빌더만 준비한 이벤트

- `member.approved`
- `member.rejected`
- `member.permission_updated`
- `plan.changed`

위 이벤트는 실제 승인/거절/권한 저장/요금제 변경 API가 연결되는 버전에서 `createSystemAuditLogSafe`와 함께 호출한다.

## 이벤트 코드 기준

| 이벤트 | target_type | severity | 설명 |
| --- | --- | --- | --- |
| `invitation.created` | `invitation` | `medium` 또는 `high` | 초대 링크 생성 |
| `company.created` | `company` | `high` | 고객사 생성 |
| `member.approved` | `member` | `high` | 가입 신청 승인 |
| `member.rejected` | `member` | `medium` | 가입 신청 거절 |
| `member.permission_updated` | `member` | `critical` | 멤버 권한 변경 |
| `plan.changed` | `plan` | `critical` | 요금제·용량 변경 |

## token 정책

- raw token 원문은 DB와 감사 로그에 저장하지 않는다.
- invitation repository는 `tokenHash`만 보관한다.
- 감사 로그 metadata에는 `tokenStoredPolicy: "token_hash_only"`만 남긴다.

## 후속 연결 순서

1. 멤버 승인 API 실제 연결
2. 멤버 거절 API 실제 연결
3. 멤버 권한 수정 API 실제 연결
4. 시스템관리자 요금제 변경 저장 API 연결
5. 시스템 감사 로그 필터에 event group shortcut 추가
