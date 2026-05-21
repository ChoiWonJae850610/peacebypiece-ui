Version : 0.15.64
Summary : 공장 발주 orders 현재값 replace 저장 정리
Description : orders 저장 방식을 spec_sheet_id 기준 DELETE 후 현재 공장 발주 row INSERT 방식으로 정리하고, is_active=false/deleted_at 누적 저장 경로를 제거했습니다. 트랜잭션으로 delete/insert를 묶어 실패 시 rollback되도록 했으며 관련 문서를 추가했습니다.
수정 파일 목록 :
- lib/workorder/repository/dbFactoryOrderRepository.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/87_wafl-a-type-factory-order-replace-save.md
삭제 파일 목록 :
- 없음
