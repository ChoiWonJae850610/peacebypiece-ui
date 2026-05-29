Version : 0.18.31
Summary : 저장소관리 휴지통 responsive 표시 구조 재정리
Description : 저장소관리 파일 유형 요약 카드가 태블릿 세로에서 한 칸만 차지하는 문제를 보정하고, 휴지통 목록을 넓은 화면에서는 table 형태로, 좁은 화면에서는 compact label-card 형태로 분리했습니다. WorkspaceShell 스크롤 구조와 DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/files/fileTrashSectionColumns.tsx
- lib/admin/files/trashTablePresentation.ts
추가 파일 목록 :
- docs/storage-responsive-table-card-0.18.31.md
삭제 파일 목록 :
- 없음
