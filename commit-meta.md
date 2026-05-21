Version : 0.15.66
Summary : 생산구성 현재값 테이블 schema와 repository mapping 1차 정리
Description : orders, spec_sheet_materials, spec_sheet_outsourcing_lines의 full_reset schema에서 현재값 저장에 불필요한 company_name/is_active/deleted_at/created_at/updated_at 컬럼을 제거하고, 관련 repository insert/detail 조회 mapping을 현재 schema 기준으로 정리했습니다. factory_name/vendor/status는 partner/status 분리 정책 확정 전까지 유지했습니다.
수정 파일 목록 :
- db/schema/full_reset.sql
- lib/workorder/repository/dbFactoryOrderRepository.ts
- lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/89_wafl-a-type-production-current-table-schema-implementation.md
삭제 파일 목록 :
- 없음
