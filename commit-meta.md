Version : 0.9.22371
Summary : 작업지시서 영구삭제 요청 SQL parameter 오류 수정
Description : 고객관리자 저장소 휴지통에서 작업지시서 영구삭제 요청 시 SQL에서 사용하지 않는 $2 parameter 때문에 PostgreSQL이 타입을 결정하지 못하던 문제를 수정했다. 작업지시서 영구삭제 요청 쿼리의 delete_reason parameter 위치를 $2로 정리하고 전달 params 배열을 실제 사용값만 포함하도록 축소했다. APP_VERSION을 0.9.22371로 갱신했다.
수정 파일 목록 :
lib/admin/adminFiles.serverActions.ts
lib/constants/app.ts
추가 파일 목록 :
docs/storage-trash-workorder-purge-param-fix-0.9.22371.md
삭제 파일 목록 :
없음
