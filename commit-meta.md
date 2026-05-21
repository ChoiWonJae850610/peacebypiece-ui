Version : 0.15.48
Summary : 생산구성 원단·외주 현재값 replace 저장 1차
Description : spec_sheet_materials와 spec_sheet_outsourcing_lines 저장 방식을 is_active=false 누적 방식에서 spec_sheet_id 기준 삭제 후 현재 row 재삽입 방식으로 변경했습니다. 삭제와 삽입은 transaction으로 묶어 중간 실패 시 rollback되도록 했고, 기존 schema 컬럼은 유지한 채 현재값 테이블 저장 정책만 우선 정리했습니다.
수정 파일 목록 :
- lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/71_wafl-a-type-production-replace-save.md
삭제 파일 목록 :
- 없음
