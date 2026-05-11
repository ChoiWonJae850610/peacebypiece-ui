# 0.10.48 시스템 기준정보 seed 보강 SQL/점검 흐름

## 목적

0.10.46 이후 단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿은 fallback 데이터를 사용하지 않고 DB 결과만 사용한다. 이 패치는 기존 개발 DB를 유지하면서 부족한 시스템 기준정보 seed를 보강할 수 있는 SQL과 seed 상태 화면의 최소 기준 표시를 추가한다.

## 추가 SQL

- `db/schema/patch_0_10_48_system_standards_seed_refresh.sql`

이 SQL은 다음 데이터를 upsert한다.

- `system_unit_standards`
- `company_enabled_unit_standards` 누락 연결
- `system_outsourcing_process_standards`
- `company_enabled_process_standards` 누락 연결
- `system_product_type_templates`
- `system_product_type_template_categories`
- `system.standard.manage` 권한 seed

## 실행 기준

기존 DB를 유지하려면 Neon SQL Editor에서 `patch_0_10_48_system_standards_seed_refresh.sql`만 실행한다.

개발 DB를 완전히 리셋할 수 있으면 기존처럼 `full_reset.sql` 실행 후 `full_reset_smoke_test.sql`을 실행한다.

## 변경 사항

- seed 상태 화면에서 각 기준정보의 최소 활성 기준을 표시한다.
- seed 부족 안내 문구를 0.10.48 seed 보강 SQL 기준으로 갱신한다.
- 시스템 기준정보 설계 화면의 DB-only 안내 문구를 seed 보강 SQL 기준으로 갱신한다.

## 변경하지 않은 것

- DB schema 변경 없음
- 시스템 기준정보 CRUD 변경 없음
- 고객관리자 기준정보 저장 로직 변경 없음
- 작업지시서 선택지 로직 변경 없음
- 감사 로그 흐름 변경 없음
