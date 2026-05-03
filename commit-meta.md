Version :
0.9.142

Summary :
시스템관리자 R2 삭제 후보 화면 갱신과 썸네일 표시 보완

Description :
시스템관리자 저장소 삭제 후보 목록에 썸네일 기반 미리보기를 추가하고, 선택 삭제 또는 전체 삭제 후 후보 목록과 요약 카드가 갱신되도록 보완했다. 선택 삭제 후보 조회 SQL의 불필요한 괄호도 정리했다. R2 직접 SDK 삭제 방식은 사용하지 않고 기존 Worker 기반 삭제 흐름을 유지했다.

수정 파일 목록 :
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/system-storage-purge-result-0.9.142.md

삭제 파일 목록 :
없음
