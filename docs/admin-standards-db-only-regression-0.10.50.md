# 0.10.50 기준정보 DB-only 회귀 점검

## 목적

0.10.46 이후 기준정보는 fallback 없이 DB 결과만 사용한다. 0.10.50은 시스템관리자에서 기준정보 DB-only 상태를 반복 점검할 수 있는 회귀 점검 화면과 API를 추가한다.

## 추가 경로

- `/system/standards/regression`
- `/api/system/standards/regression`

## 점검 항목

- DB 연결 상태
- 단위 표준 seed 최소 기준
- 외주공정 유형 seed 최소 기준
- 기본 생산품 유형 템플릿 상태
- 기본 템플릿 분류 seed 최소 기준
- 고객사별 단위 사용 연결 무결성
- 고객사별 외주공정 사용 연결 무결성

## 정책

- 기준정보 화면과 작업지시서 선택지는 fallback을 사용하지 않는다.
- seed가 없으면 0개가 정상이다.
- seed가 부족하면 `db/schema/patch_0_10_48_system_standards_seed_refresh.sql`을 실행한다.
- 생산품 유형 기본값 복원은 시스템관리자가 기본으로 지정한 활성 템플릿 1개만 사용한다.

## 변경하지 않은 것

- DB schema 변경 없음
- 기준정보 CRUD 변경 없음
- 고객관리자 기준정보 저장 로직 변경 없음
- 작업지시서 선택지 로직 변경 없음
- 감사 로그 흐름 변경 없음
