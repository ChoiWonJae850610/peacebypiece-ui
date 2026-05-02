Version : 0.9.88
Base Version : 0.9.87
Target Version : 0.9.88
Summary : 작업지시서 company_id scope 점검 기준 추가
Description : 작업지시서, 첨부, 메모, 거래처, 원부자재/외주/재고 관련 테이블의 company_id scope 점검 기준과 helper를 추가했습니다. 기존 작업지시서 저장, 첨부, 메모, 거래처 동작은 변경하지 않았고 DB schema도 수정하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- lib/workorder/scope/workOrderCompanyScope.ts
- docs/workorder/workorder_company_scope_audit.md
- docs/workorder/company_scope_checklist.md
삭제 파일 목록 :
- 없음
