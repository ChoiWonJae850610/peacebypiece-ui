Version : 0.9.22372
Summary : 고객관리자 휴지통 영구삭제 요청 항목 숨김 처리
Description : 고객관리자 저장소 휴지통에서 작업지시서 영구삭제 요청이 완료된 purge_requested 상태 항목을 기본 목록에서 숨기도록 보정했다. 고객관리자 휴지통은 복구 가능한 항목 중심으로 유지하고, 영구삭제 요청된 작업지시서는 시스템관리자 실제 삭제 후보 화면에서 최종 처리하도록 흐름을 분리한다.
수정 파일 목록 :
lib/admin/adminFiles.serverActions.ts
lib/constants/app.ts
추가 파일 목록 :
docs/storage-trash-admin-hide-purge-requested-0.9.22372.md
삭제 파일 목록 :
없음
