Version :
0.9.22400

Summary :
시스템 저장소 프리렌더 삭제 상태 컬럼 fallback 보정

Description :
삭제 상태 메타데이터 컬럼이 아직 DB에 적용되지 않은 상태에서도 시스템 저장소 실제 삭제 후보 페이지가 프리렌더 중 중단되지 않도록 컬럼 존재 여부 확인과 delete_reason fallback 조회를 추가했다.

수정 파일 목록 :
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-usage-prerender-delete-state-fallback-0.9.22400.md

삭제 파일 목록 :
없음
