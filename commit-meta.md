Version : 0.15.57
Summary : 반려 workflow 생산구성 보존과 빌드 오류 수정
Description : audit source type 오류를 수정하고, 상세 snapshot이 없는 작업지시서 full save가 orders/materials/outsourcing 현재값 테이블을 비우지 않도록 생산구성 sync 조건을 보강했습니다. 생산구성 patch가 없는 state patch 응답은 기존 DB 상세 생산구성을 병합해 반려/취소/되돌리기 workflow에서 원단, 부자재, 외주공정, 공장 발주 row가 삭제되거나 비활성화되는 사고를 방어합니다.
수정 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/80_wafl-a-type-workorder-reject-production-preserve.md
삭제 파일 목록 :
- 없음
