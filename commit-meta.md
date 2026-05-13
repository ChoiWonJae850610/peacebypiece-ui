Version :
0.11.30

Summary :
시스템관리자 저장소 empty 설명과 공통 UI 잔여 조사 정리

Description :
시스템관리자 화면의 공통 UI 적용 상태를 조사하고, 실제 삭제 후보 목록의 empty 상태 설명을 AdminTable의 emptyDescription 슬롯으로 보강했다. 삭제 후보 조회, 선택 삭제, 전체삭제, R2 purge action flow는 변경하지 않았다.

수정 파일 목록 :
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/system/storagePurgePresentation.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-common-ui-standardization-0.11.30.md

삭제 파일 목록 :
없음
