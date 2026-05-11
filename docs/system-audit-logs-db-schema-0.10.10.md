# System audit logs DB schema — 0.10.10

## 기준

- 현재 기준 원본: 0.10.9
- 다음 결과 버전: 0.10.10
- 이번 버전은 시스템관리자 감사 로그 DB 설계를 확정한다.
- 기존 고객관리자 `history_logs`는 삭제하지 않는다.
- 기존 작업지시서, 저장소, 휴지통, R2 purge 동작 흐름은 변경하지 않는다.

## 확정 방향

시스템관리자 감사 로그는 고객관리자 업무 이력과 분리한다.

- `history_logs`: 고객관리자가 자기 회사의 업무 흐름을 이해하는 최소 이력
- `audit_logs`: 시스템관리자가 권한, 요금제, 저장소, 삭제 처리, 접근 이벤트를 추적하는 운영 원장

## 추가 테이블

`audit_logs` 테이블을 추가한다.

| column | type | required | purpose |
| --- | --- | --- | --- |
| id | text | Y | 감사 로그 고유 ID |
| created_at | timestamptz | Y | 이벤트 발생 시각 |
| actor_user_id | text | - | 행위자 사용자 ID |
| actor_role | text | Y | 구조화된 행위자 역할 |
| company_id | text | - | 대상 고객사 ID. 시스템 전체 이벤트는 null 허용 |
| target_type | text | Y | 대상 유형 |
| target_id | text | - | 대상 레코드 ID |
| event_type | text | Y | domain.action 형식의 이벤트 코드 |
| severity | text | Y | low, medium, high, critical |
| summary | text | Y | 목록 표시용 짧은 요약 |
| metadata | jsonb | Y | 변경 전후 값, 파일 수, 용량, 실패 코드 등 구조화 JSON |
| request_id | text | - | API 요청 추적 ID |
| ip_address | inet | - | 접근 IP. 필요 시 null 허용 |

## check constraint

- `actor_role`: `system_admin`, `customer_admin`, `designer`, `inspector`, `factory`, `system`, `unknown`
- `target_type`: `company`, `member`, `invitation`, `plan`, `storage`, `work_order`, `file`, `memo`, `settings`, `auth`, `system`
- `severity`: `low`, `medium`, `high`, `critical`
- `event_type`: `domain.action` 형식

## index

- `audit_logs_created_idx`
- `audit_logs_company_created_idx`
- `audit_logs_company_event_idx`
- `audit_logs_target_idx`
- `audit_logs_actor_idx`
- `audit_logs_severity_idx`

## 적용 파일

- `db/schema/patch_0_10_10_audit_logs.sql`
- `db/schema/full_reset.sql`
- `db/schema/full_reset_smoke_test.sql`

## 후속 작업

1. 0.10.11 — repository/actionFlow 분리
2. 0.10.12 — 읽기 API와 /system/audit-logs 화면 연결
3. 0.10.13 — 쓰기 지점 점진 연결
