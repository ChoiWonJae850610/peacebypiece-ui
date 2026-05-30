Version : 0.18.37
Summary : 저장소관리 휴지통 반응형 row 소스 정리
Description : 저장소관리 휴지통의 컨테이너 폭 기준 반응형 구조를 유지하면서 FileTrashResponsiveRows에 몰려 있던 wide table, compact list, 공통 cell, 유형 badge 매핑 책임을 분리했습니다. WorkspaceShell과 DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/files/FileTrashResponsiveRows.tsx
추가 파일 목록 :
- components/admin/files/trash/fileTrashResponsivePresentation.ts
- components/admin/files/trash/FileTrashTypeBadge.tsx
- components/admin/files/trash/FileTrashSharedCells.tsx
- components/admin/files/trash/FileTrashWideTableRows.tsx
- components/admin/files/trash/FileTrashCompactListRows.tsx
- docs/storage-trash-source-cleanup-0.18.37.md
삭제 파일 목록 :
- 없음
