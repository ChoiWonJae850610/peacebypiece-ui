# 0.10.46 — 기준정보 DB 전용 조회와 기본 템플릿 복원 기준 고정

## 변경 목표

기준정보 화면에서 시스템 표준 원장, 고객사 사용 여부, fallback 데이터가 섞여 새로고침마다 수량이 달라지는 문제를 정리한다.

## 적용 기준

- 단위 표준은 `system_unit_standards`와 `company_enabled_unit_standards`만 사용한다.
- 외주공정 유형은 `system_outsourcing_process_standards`와 `company_enabled_process_standards`만 사용한다.
- 시스템관리자 기준정보 화면은 DB 결과만 표시한다.
- 고객관리자 작업지시서 단위/단가 기준 선택지도 DB 결과만 사용한다.
- fallback 목록은 기준정보 화면과 업무 선택지에 섞지 않는다.

## 생산품 유형 기본값 복원

- 고객관리자 생산품 유형 기본값 복원은 시스템관리자 기본 템플릿을 기준으로 한다.
- 기본 템플릿은 `system_product_type_templates`와 `system_product_type_template_categories`에서 읽는다.
- 기본 템플릿이 없으면 복원을 수행하지 않고 안내 메시지를 표시한다.
- 저장 시 고객사 `item_categories`를 교체한 뒤 1차 → 2차 → 3차 순서로 재삽입한다.

## 변경하지 않은 것

- DB schema 변경 없음
- 시스템 표준 CRUD 정책 변경 없음
- 고객관리자 생산품 유형 직접 관리 정책 변경 없음
- 감사 로그 흐름 변경 없음
