Version : 0.16.93
Summary : 원단·부자재 DB schema 1차 반영
Description : 원단·부자재 발주 업무를 위한 material_orders, material_order_lines, material_order_allocations, material_inventory_lots schema를 full_reset.sql에 반영하고 full_reset_smoke_test.sql 및 materials_schema_draft.sql을 갱신했습니다. 기존 업무홈/route skeleton, DB 저장 API, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- db/schema/materials_schema_draft.sql
추가 파일 목록 :
삭제 파일 목록 :
