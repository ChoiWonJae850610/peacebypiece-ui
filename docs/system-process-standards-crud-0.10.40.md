# 0.10.40 시스템관리자 외주공정 유형 CRUD 1차 연결

## 목적

시스템관리자가 `system_outsourcing_process_standards` 원장을 조회, 추가, 수정, 활성/비활성 전환할 수 있도록 1차 CRUD 흐름을 연결한다.

## 적용 범위

- `/system/standards/processes` 화면
- `GET /api/system/standards/processes`
- `POST /api/system/standards/processes`
- `PATCH /api/system/standards/processes`
- `system_outsourcing_process_standards` 원장 repository
- 감사 로그 기록

## 감사 로그

- 외주공정 유형 추가: `standard.process_created`
- 외주공정 유형 수정/상태 변경: `standard.process_updated`

감사 로그 실패는 원장 CRUD 동작을 막지 않는다.

## 제외 범위

- 고객사별 외주공정 사용 여부 저장 연결 없음
- 고객관리자 외주공정 유형 모달 DB 연결 없음
- DB schema 변경 없음
- 삭제 기능 없음
