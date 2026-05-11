# 0.10.39 시스템관리자 단위 표준 CRUD 1차 연결

## 변경 목표

시스템관리자가 `/system/standards/units`에서 단위 표준 원장을 직접 조회, 추가, 수정, 활성/비활성 전환할 수 있도록 1차 CRUD 흐름을 연결한다.

## 반영 범위

- `GET /api/system/standards/units`
  - `system_unit_standards` 원장 조회
  - DB 미설정 시 화면용 fallback 목록 사용
- `POST /api/system/standards/units`
  - 단위 표준 추가
- `PATCH /api/system/standards/units`
  - 단위 표준 수정
  - 활성/비활성 상태 변경
- 시스템관리자 단위 표준 화면을 클라이언트 상호작용형 화면으로 전환
- 단위 표준 추가/수정/상태 변경 시 감사 로그 기록
  - `standard.unit_created`
  - `standard.unit_updated`

## 이번 버전에서 하지 않은 일

- 고객사별 단위 사용 여부 저장 연결
- 고객관리자 단위 표준 모달의 DB 원장 직접 조회 연결
- 단위 표준 삭제 기능
- DB schema 변경
- 외주공정 유형 CRUD 연결
- 생산품 유형 템플릿 CRUD 연결

## 테스트

1. `/system/standards/units` 접속
2. 단위 표준 목록 조회 확인
3. 단위 추가 입력 후 저장
4. 추가된 단위가 목록에 표시되는지 확인
5. 기존 단위 수정 후 저장
6. 활성/비활성 버튼으로 상태 변경
7. `/system/audit-logs?query=standard.unit` 또는 감사 로그 화면에서 `standard.unit_created`, `standard.unit_updated` 확인
