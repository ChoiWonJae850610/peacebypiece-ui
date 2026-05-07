Version : 0.9.22361
Summary : 작업지시서 삭제 후보 시스템관리자 연결 보정
Description : 시스템관리자 실제 삭제 후보 화면에서 attachment 기반 파일 후보만 표시되던 구조에 삭제 상태 작업지시서 후보를 추가했다. 작업지시서 후보는 방금 삭제된 pending 상태에서도 목록에 표시되며, 선택 처리 시 작업지시서를 DB 삭제 완료 상태로 전환하고 연결 첨부파일은 R2 purge 요청 후보로 이어지도록 처리한다. 파일 후보의 Worker 기반 R2 삭제 흐름은 기존대로 유지한다.
수정 파일 목록 :
lib/system/storagePurgeCandidates.ts
components/system/storage/SystemStoragePurgeCandidatesClient.tsx
app/system/storage-usage/page.tsx
lib/constants/app.ts
추가 파일 목록 :
docs/system-workorder-purge-candidates-0.9.22361.md
삭제 파일 목록 :
