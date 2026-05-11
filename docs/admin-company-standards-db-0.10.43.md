# 0.10.43 — 고객관리자 단위/외주공정 사용 여부 DB 연결

## 목표

고객관리자 환경설정의 단위 표준과 외주공정 유형을 시스템 표준 원장 기반의 사용/미사용 선택형 기준정보로 연결한다.

## 반영 기준

- 단위 표준은 `system_unit_standards` 원장을 조회한다.
- 고객사별 단위 사용 여부는 `company_enabled_unit_standards`에 저장한다.
- 외주공정 유형은 `system_outsourcing_process_standards` 원장을 조회한다.
- 고객사별 외주공정 사용 여부는 `company_enabled_process_standards`에 저장한다.
- 생산품 유형은 고객사별 계층 관리 구조를 유지한다.

## 변경하지 않은 것

- DB schema 변경 없음
- 시스템 표준 원장 CRUD 변경 없음
- 고객관리자 생산품 유형 저장 로직 변경 없음
- 신규 고객사 기본 템플릿 복사 로직 변경 없음
