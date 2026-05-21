Version : 0.15.60
Summary : 검토요청 반려 재검토요청 회귀 테스트 기준 문서화
Description : 검토요청, 반려, 재검토요청, 검토완료 흐름에서 생산구성 현재값 테이블을 어떻게 저장하거나 보존해야 하는지 회귀 테스트 기준을 문서화했습니다. 반려 시 orders, spec_sheet_materials, spec_sheet_outsourcing_lines를 변경하지 않는 기준과 검토요청/재검토요청/검토완료 시 replace 저장 허용 기준을 명시했습니다.
수정 파일 목록 :
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/83_wafl-a-type-workorder-review-reject-regression.md
삭제 파일 목록 :
- 없음
