# 0.10.47 기준정보 seed 상태 점검 및 빈 상태 안내

## 목표

0.10.46부터 기준정보 화면과 업무 선택지는 fallback 데이터를 섞지 않고 DB 결과만 사용한다. 따라서 DB seed가 없으면 빈 상태가 정상이며, 사용자가 원인을 확인할 수 있는 점검 화면과 빈 상태 안내가 필요하다.

## 반영 내용

- `/system/standards/seed-status` 화면 추가
- `/api/system/standards/seed-status` API 추가
- 시스템 콘솔과 기준정보 설계 화면에서 seed 상태 화면으로 이동할 수 있게 연결
- 고객관리자 환경설정 기준 관리 카드에서 DB 항목이 없을 때 `DB 항목 없음` 또는 고객사 품목 없음으로 표시
- 고객관리자 단위 표준 모달에서 시스템 seed가 없을 때 빈 상태 안내 표시
- fallback 데이터는 기준정보 숫자와 선택지에 섞지 않는 원칙 유지

## 확인 대상

- `system_unit_standards`
- `system_outsourcing_process_standards`
- `system_product_type_templates`
- `system_product_type_template_categories`

## 테스트

1. `/system/standards/seed-status` 접속
2. 각 기준정보 테이블의 전체/활성 항목 수 확인
3. `/admin/settings`에서 기준 관리 카드의 숫자가 새로고침마다 흔들리지 않는지 확인
4. seed가 없을 때 고객관리자 단위 표준 모달에 빈 상태 안내가 나오는지 확인
