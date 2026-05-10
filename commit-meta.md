Version :
0.9.22437

Summary :
시스템관리자 저장소 삭제 후보 조회 표시 기준 보정

Description :
시스템관리자 storage-usage 실제 삭제 후보에서 작업지시서 대표 row의 문서, 디자인, 메모 집계를 구분해 표시하도록 보정했다. 문서/디자인 수는 attachment_trash_items와 attachments.type 기준으로 계산하고, 작업지시서 묶음 후보 메시지도 고객 화면 용어에 맞게 정리했다.

수정 파일 목록 :
- lib/system/storagePurgeCandidates.ts
- lib/system/storagePurgePresentation.ts
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-storage-usage-candidate-query-0.9.22437.md

삭제 파일 목록 :
없음
