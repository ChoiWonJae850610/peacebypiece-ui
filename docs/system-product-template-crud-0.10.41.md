# 0.10.41 시스템관리자 생산품 유형 기본 템플릿 CRUD 1차 연결

## 목적

시스템관리자가 신규 고객사 생성 시 사용할 생산품 유형 기본 템플릿 원장을 조회, 추가, 수정하고 1차-2차-3차 분류를 추가/상태 변경할 수 있는 1차 CRUD 흐름을 연결한다.

## 반영 범위

- `/api/system/standards/product-templates` API 추가
- `system_product_type_templates` 조회/추가/수정 연결
- `system_product_type_template_categories` 분류 추가/상태 변경 연결
- `/system/standards/product-templates` 화면을 클라이언트 CRUD 화면으로 전환
- 템플릿/분류 변경 감사 로그 기록

## 제외 범위

- 신규 고객사 생성 시 템플릿 복사 로직
- 고객관리자 생산품 유형 화면과 시스템 템플릿 동기화
- DB schema 변경
- 삭제 hard delete

## 감사 로그 이벤트

- `standard.product_template_created`
- `standard.product_template_updated`
- `standard.product_template_category_created`
- `standard.product_template_category_updated`
