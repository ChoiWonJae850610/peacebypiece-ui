Version :
0.9.143

Summary :
시스템관리자 R2 purge 후보 표시와 결과 메시지 보완

Description :
시스템관리자 저장공간 삭제 후보 화면에서 썸네일이 없는 이미지 파일은 원본 fallback을 사용하되 “썸네일 없음 · 원본 표시”로 명확히 표시하도록 보완했다. purge 실행 결과 메시지를 성공, 일부 실패, 요청 실패 상태로 구분하고 실패 항목은 목록에 남아 재시도할 수 있음을 문서화했다. R2 직접 SDK 삭제 방식, 자동 purge 스케줄러, DB schema는 변경하지 않았다.

수정 파일 목록 :
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/system-storage-purge-retry-0.9.143.md

삭제 파일 목록 :
없음
