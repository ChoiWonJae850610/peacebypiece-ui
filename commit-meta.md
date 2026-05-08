Version :
0.9.22393

Summary :
시스템관리자 실제 삭제 후보 점검 기준 보정

Description :
시스템관리자 저장소 실제 삭제 후보 화면의 안내 문구를 정상 흐름 화면 확인과 예외 처리 코드 확인 기준으로 정리했다. R2 Worker 삭제 응답에서 not found 계열 응답은 이미 삭제된 객체로 보고 성공 처리하도록 보정하고, Worker/권한/네트워크 실패만 재시도 후보로 남기는 기준을 문서화했다. 삭제 후보 표의 예정일 정렬 버튼 중복 표시도 제거했다.

수정 파일 목록 :
- app/system/storage-usage/page.tsx
- components/system/storage/SystemStoragePurgeButton.tsx
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/constants/app.ts
- lib/storage/r2/r2WorkerUpload.ts
- lib/system/storagePurgeCandidates.ts

추가 파일 목록 :
- docs/system-storage-purge-final-check-0.9.22393.md

삭제 파일 목록 :
없음
