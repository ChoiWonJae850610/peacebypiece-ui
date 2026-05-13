Version : 0.11.71
Summary : 작업지시서 목록 필터 회귀 보정
Description : 작업지시서 목록 상태 필터가 legacy workflow 상태값까지 포함해 조회되도록 보정하고, 기본 진행 중 목록에서 completed/완료 상태와 휴지통 이동 항목을 SQL WHERE 단계에서 제외하도록 정리했습니다. 선택 적용용 작업지시서 목록 조회 index SQL과 회귀 테스트 문서를 추가했습니다.
수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts
추가 파일 목록 :
- db/schema/patch_0_11_71_workorder_list_indexes.sql
- docs/qa-workorder-list-filter-sort-regression-0.11.71.md
삭제 파일 목록 :
