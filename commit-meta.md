Version : 0.15.59
Summary : 검토요청 생산구성 serviceCode 전달 보강
Description : 서버 PATCH route에서 검증된 serviceCode를 repository state patch payload에 전달해 검토요청 시 orders, spec_sheet_materials, spec_sheet_outsourcing_lines 생산구성 replace 저장이 차단되지 않도록 보정했습니다. serviceCode guard는 side effect matrix의 allowsProductionCompositionReplace 기준을 사용하도록 정리했습니다.
수정 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/serviceCodeGuards.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/82_wafl-a-type-review-request-production-service-code-forward.md
삭제 파일 목록 :
- 없음
