# System audit logs design — 0.10.9

## 기준

- 현재 기준 원본: 0.10.8
- 다음 결과 버전: 0.10.9
- 이번 버전은 설계 중심 패치다.
- DB schema 변경 없음.
- 기존 작업지시서, 저장소, 휴지통, R2 purge 동작 흐름 변경 없음.

## 방향

고객관리자 히스토리는 고객사가 자기 업무 흐름을 이해하는 최소 이력으로 축소한다.
시스템관리자 감사 로그는 권한, 요금제, 저장소, 삭제 처리, 초대, 고객사 상태 변경 같은 운영 이벤트를 별도 축으로 분리한다.

## 고객관리자 최소 이력

고객관리자에게 남길 이력은 다음 범위로 제한한다.

- 작업지시서 상태 변경 요약
- 문서, 디자인, 메모 업로드·삭제·복원 요약
- 협력업체 정보 변경 요약
- 검토, 발주, 입고, 완료 흐름 요약

고객관리자 기본 메뉴에서는 히스토리 진입을 제거한다. 기존 /admin/history 라우트는 이번 버전에서 삭제하지 않는다. 후속 버전에서 업무 화면 내부 최소 이력으로 흡수하거나 제거 여부를 결정한다.

## 시스템관리자 감사 로그

시스템관리자 감사 로그는 다음 대상을 우선 기록 대상으로 본다.

- 고객사 생성, 중지, 재활성화
- 멤버와 권한 변경
- 초대 생성, 수락, 만료, 취소
- 요금제, 좌석 수, 저장용량 override 변경
- 휴지통 복원 요청, purge 승인, purge 실행, purge 실패
- 작업지시서 삭제, 복원, 리오더 생성
- 문서, 디자인, 메모 업로드·삭제·복원
- 환경설정 변경
- 로그인, 접근 거부, 세션 만료

## 권장 이벤트 코드 규칙

화면 문구와 도메인 로직을 분리하기 위해 event_type은 문장형 문자열이 아니라 `domain.action` 형식의 코드로 둔다.

예시:

- `company.created`
- `member.role_changed`
- `invite.accepted`
- `plan.changed`
- `storage_limit.overridden`
- `purge.approved`
- `purge.failed`
- `workorder.status_changed`
- `file.deleted`
- `settings.notification_changed`

## 권장 스키마 초안

이번 버전에서는 DB를 만들지 않는다. 후속 버전에서 `audit_logs` 테이블 후보로 검토한다.

| field | purpose | required |
| --- | --- | --- |
| id | 감사 로그 고유 ID | Y |
| created_at | 이벤트 발생 시각 | Y |
| actor_user_id | 행위자 사용자 ID | - |
| actor_role | 행위자 역할 | Y |
| company_id | 대상 고객사 ID | - |
| target_type | 대상 유형 | Y |
| target_id | 대상 레코드 ID | - |
| event_type | domain.action 형식 이벤트 코드 | Y |
| severity | low, medium, high, critical | Y |
| summary | 목록 표시용 짧은 요약 | Y |
| metadata | 변경 전후 값, 파일 수, 용량 등 구조화 JSON | - |
| request_id | API 요청 추적 ID | - |
| ip_address | 접근 위치 추적용 IP. 개인정보 정책 확정 후 저장 여부 결정 | - |

## 후속 작업

1. 0.10.10 — audit_logs DB 설계 확정
2. 0.10.11 — repository/actionFlow 분리
3. 0.10.12 — 읽기 API와 /system/audit-logs 화면 연결
4. 0.10.13 — 쓰기 지점 점진 연결

## 이번 패치 결과

- `/system/audit-logs` 설계 화면 추가
- 시스템 홈에서 감사 로그 카드와 바로가기 연결
- 고객관리자 좌측 메뉴에서 히스토리 항목 제거
- 고객관리자 대시보드 카드에서 작업지시서 히스토리 항목 제거
- DB 변경 없음
