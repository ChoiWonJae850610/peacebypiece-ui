Version : 0.10.14
Summary : 작업지시서와 첨부파일 감사 로그 연결
Description : 작업지시서 삭제/복원과 개별 첨부파일 삭제/복원 액션을 시스템관리자 감사 로그에 기록하도록 연결했습니다. 감사 로그 쓰기 실패가 기존 업무 처리를 막지 않도록 safe wrapper를 사용하고, 첨부파일 로그에는 R2 key 원문 대신 key 존재 여부만 metadata에 남깁니다. DB schema와 기존 저장소 실제 삭제 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/audit/writeActions.ts
- app/api/workorders/attachments/delete/route.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- app/api/admin/files/workorders/restore/route.ts
- app/api/admin/files/trash/restore/route.ts

추가 파일 목록 :
- docs/system-audit-logs-workorder-file-0.10.14.md

삭제 파일 목록 :
- 없음
