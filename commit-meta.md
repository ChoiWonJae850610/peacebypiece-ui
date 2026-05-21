Version : 0.15.65
Summary : 생산구성 현재값 테이블 컬럼 정리 SQL 설계
Description : orders, spec_sheet_materials, spec_sheet_outsourcing_lines를 현재 확정 생산구성 테이블로 단순화하기 위한 SQL 설계 기준을 문서화했습니다. is_active, deleted_at, created_at, updated_at, 중복 이름 컬럼, row-level status의 제거/보류 기준과 full_reset.sql 및 repository mapping 후속 수정 범위를 정리했습니다.
수정 파일 목록 :
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/88_wafl-a-type-production-current-table-sql-design.md
삭제 파일 목록 :
- 없음
