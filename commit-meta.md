Version : 0.15.58
Summary : 반려 workflow 생산구성 repository sync 차단
Description : 반려/취소/되돌리기 등 생산구성 replace가 허용되지 않는 serviceCode에서 orders, spec_sheet_materials, spec_sheet_outsourcing_lines 동기화가 실행되지 않도록 repository 저장 gate를 보강했습니다. Full work-order save 경로에서는 생산구성 detail table을 동기화하지 않고, serviceCode가 허용된 state patch에서만 생산구성 replace 저장을 실행하도록 정리했습니다.
수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/81_wafl-a-type-workorder-production-sync-gate.md
삭제 파일 목록 :
- 없음
