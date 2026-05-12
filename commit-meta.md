Version :
0.10.93

Summary :
작업지시서 payload 정규화 schema 1차 반영

Description :
spec_sheets와 작업지시서 하위 테이블의 payload 컬럼을 full reset 기준에서 제거하고, 작업지시서 header와 summary에 필요한 정규 컬럼을 추가했다. 작업지시서 repository는 payload 없이도 목록과 상세를 정규 컬럼 및 orders, spec_sheet_materials, spec_sheet_outsourcing_lines에서 조립하도록 보정했다. 관리자 통계 쿼리와 현실형 seed도 payload fallback 없이 동작하도록 수정했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/workorder_payload_audit_0_10_92.sql
- db/seed/realistic_workorders_seed.sql
- lib/admin/adminStats.repository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-normalized-schema-first-pass-0.10.93.md

삭제 파일 목록 :
없음
