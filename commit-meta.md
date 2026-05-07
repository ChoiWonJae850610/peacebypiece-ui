Version : 0.9.2237
Summary : 작업지시서 휴지통 요청과 시스템 실제삭제 후보 흐름 정리
Description : 고객관리자 저장소 화면에서 작업지시서 영구삭제를 실행할 때 즉시 삭제 완료 상태로 바꾸지 않고 영구삭제 요청 상태로 남기도록 수정했다. 작업지시서와 연결 첨부/메모는 purge_requested 상태로 전환되고, 시스템관리자 실제 삭제 후보 화면에서 최종 처리하도록 흐름을 정리했다. 작업지시서 복구는 pending뿐 아니라 purge_requested 상태의 묶음 첨부도 함께 복구할 수 있도록 보정했다.
수정 파일 목록 :
app/admin/files/page.tsx
app/api/admin/files/workorders/purge/route.ts
lib/admin/adminFiles.serverActions.ts
lib/constants/app.ts
추가 파일 목록 :
docs/storage-trash-workorder-flow-0.9.2237.md
삭제 파일 목록 :
없음
