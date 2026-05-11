# PeaceByPiece 0.10.11 — 시스템관리자 감사 로그 repository/actionFlow 분리

## 기준

- 현재 기준 원본: 0.10.10
- 결과 버전: 0.10.11
- 목적: audit_logs 테이블 접근 구조를 화면·API 연결 전에 lib/system/audit 계층으로 분리한다.

## 추가 계층

| 파일 | 역할 |
| --- | --- |
| lib/system/audit/types.ts | audit_logs schema와 화면 사이에서 공유하는 타입 |
| lib/system/audit/repository.ts | audit_logs DB 읽기·쓰기, safe wrapper |
| lib/system/audit/selectors.ts | 검색어, 고객사, 대상 유형, 심각도 필터 순수 함수 |
| lib/system/audit/actionFlow.ts | 필터 적용과 view model 변환 |
| lib/system/audit/index.ts | 서버 전용 repository를 제외한 공개 barrel |

## repository 기준

- createSystemAuditLog는 audit_logs insert만 담당한다.
- createSystemAuditLogSafe는 로그 실패가 실제 업무 액션을 막지 않도록 dev 환경에서만 warning을 출력한다.
- listSystemAuditLogs는 companyId, targetType, eventType, severity, limit 필터만 제공한다.
- event_type은 DB check constraint와 동일하게 domain.action 형식만 허용한다.

## 후속 연결 방향

0.10.12에서 `/api/system/audit-logs` 읽기 API를 추가하고 `/system/audit-logs` 화면을 실제 DB 조회로 연결한다. 쓰기 연결은 0.10.13 이후 고객사, 초대, 요금제·용량, 저장소 purge, 멤버 권한 변경 지점부터 점진 적용한다.

## 변경하지 않은 것

- DB schema 변경 없음
- 작업지시서/저장소/휴지통/R2 purge 흐름 변경 없음
- 고객관리자 history_logs 쓰기 흐름 변경 없음
