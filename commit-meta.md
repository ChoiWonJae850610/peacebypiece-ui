Version : 0.11.17
Summary : 시스템 저장소 실제 삭제 후보 테이블 공통 컴포넌트 적용
Description : /system/storage-usage 실제 삭제 후보 목록을 AdminTable 기준으로 전환하고 선택, 정렬, 상태 라벨, key 표시 구조를 공통 테이블 컬럼 정의로 정리했습니다. purge API, R2 삭제 처리, 삭제 후보 조회 조건은 변경하지 않았습니다.
수정 파일 목록 :
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/constants/app.ts
추가 파일 목록 :
- docs/system-storage-purge-table-standardization-0.11.17.md
삭제 파일 목록 :
