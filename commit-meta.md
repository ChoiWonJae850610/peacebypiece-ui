Version : 0.9.22373
Summary : 저장소 삭제 요청 요약과 빌드 타입 오류 수정
Description : 저장소 관리 상단 파일 운영 요약에서 대용량 파일 검토 예정 항목을 제거하고, 고객관리자가 영구삭제 요청해 시스템관리자 처리를 기다리는 첨부파일 개수와 용량을 표시하도록 수정했다. 작업지시서 영구삭제 요청에 연결된 첨부파일도 attachment_trash_items 기준으로 개수와 용량을 합산한다. AdminFileActionResult helper 타입을 보정해 requestedCount/affectedCount 반환 시 발생하던 build type 오류도 수정했다.
수정 파일 목록 :
lib/admin/adminFiles.actionFlow.ts
app/api/admin/files/snapshot/route.ts
components/admin/files/FileStorageSummary.tsx
lib/admin/adminFiles.presentation.ts
lib/constants/app.ts
추가 파일 목록 :
docs/storage-file-operations-purge-requested-0.9.22373.md
삭제 파일 목록 :
없음
