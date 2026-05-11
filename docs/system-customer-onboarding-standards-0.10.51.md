# 0.10.51 — 고객사 신규 생성 시 기준정보 복사 설계

## 목표

신규 고객사를 만들 때 시스템 기준정보를 어떤 방식으로 고객사 전용 데이터에 반영할지 설계한다.

## 정책

- 생산품 유형은 시스템관리자가 기본으로 지정한 활성 템플릿 1개를 고객사 `item_categories`로 복사한다.
- 복사 후 생산품 유형은 고객사 소유 데이터가 되며, 고객관리자가 자유롭게 수정할 수 있다.
- 단위 표준은 `system_unit_standards` 활성 항목을 `company_enabled_unit_standards`에 기본 사용 상태로 연결한다.
- 외주공정 유형은 `system_outsourcing_process_standards` 활성 항목을 `company_enabled_process_standards`에 기본 사용 상태로 연결한다.
- fallback 기본값은 사용하지 않는다.

## 0.10.51 범위

- `/system/standards/customer-onboarding` 설계 화면 추가
- 시스템 콘솔과 기준정보 설계 화면에서 링크 제공
- DB schema 변경 없음
- 실제 고객사 생성 API 변경 없음
- 실제 복사 repository 구현 없음
- 감사 로그 흐름 변경 없음

## 후속 작업 후보

- 신규 고객사 생성 API 확정
- 생산품 유형 템플릿 복사 repository 추가
- 단위/외주공정 고객사 사용 연결 초기화 함수 추가
- 고객사 생성 시 감사 로그 기록
- 중복 복사 방지 정책 구현
