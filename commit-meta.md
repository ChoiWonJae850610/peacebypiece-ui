Version :
0.9.22377

Summary :
시스템관리자 실제 삭제 후보 묶음 처리와 정렬 기능 보강

Description :
시스템관리자 R2 실제 삭제 후보 화면에서 작업지시서 대표 row를 유지하면서 연결 첨부파일과 메모를 같은 실제 삭제 흐름에서 처리하도록 보정했다. 정상 처리된 연결 첨부파일은 다시 후보 목록에 노출하지 않고, R2 삭제 실패 항목만 재시도 후보로 남기도록 정리했다. 삭제 후보 목록에는 컬럼 정렬, 새로고침 버튼, 전체삭제 버튼명을 반영했다.

수정 파일 목록 :
- app/system/storage-usage/page.tsx
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-storage-purge-bundle-sort-refresh-0.9.22377.md

삭제 파일 목록 :
없음
