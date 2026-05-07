Version : 0.9.2236
Summary : 저장소 휴지통 실제 복구/영구삭제 처리 결과 보정
Description : 저장소 관리 휴지통에서 파일 및 작업지시서 복구/영구삭제 요청 후 실제 affectedCount를 기준으로 성공/실패와 메시지를 표시하도록 보정했다. 작업지시서 단위 복구/영구삭제 응답에는 연결 첨부/메모 처리 개수를 포함하고, 파일 처리 API는 처리 개수가 0이면 실패 응답을 반환한다. DB schema, package 의존성, R2 Worker 정책은 변경하지 않는다.
수정 파일 목록 :
app/admin/files/page.tsx
app/api/admin/files/trash/restore/route.ts
app/api/admin/files/trash/purge/route.ts
app/api/admin/files/workorders/restore/route.ts
app/api/admin/files/workorders/purge/route.ts
lib/admin/adminFiles.actionFlow.ts
lib/admin/adminFiles.serverActions.ts
lib/admin/adminFiles.types.ts
lib/constants/app.ts
추가 파일 목록 :
docs/storage-trash-action-check-0.9.2236.md
삭제 파일 목록 :
없음
