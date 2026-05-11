Version : 0.10.22
Summary : 저장소 관리 휴지통 표시량 보정
Description : 저장소 관리 화면의 현황 카드 3개 높이와 내부 여백을 줄이고, 휴지통 목록 카드의 상단 간격과 테이블 행/헤더 여백을 소폭 축소했습니다. 휴지통 목록이 PC 화면에서 더 많이 보이도록 조정했으며, 복원/선택 삭제/비우기/새로고침/R2 purge/감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- app/admin/files/page.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/common/AdminTable.tsx

추가 파일 목록 :
- docs/admin-files-trash-visible-rows-0.10.22.md

삭제 파일 목록 :
- 없음
