Version : 0.18.30
Summary : 저장소관리 휴지통 표시 밀도 재정리
Description : 저장소관리 PC 화면에서 휴지통 목록이 너무 낮고 작게 보이는 문제와 태블릿에서 휴지통 항목이 과하게 큰 카드처럼 보이는 문제를 보정했습니다. 저장소 요약 카드 높이를 줄이고 휴지통 row를 compact list-card 흐름으로 조정했으며, 태블릿 이하에서도 주요 컬럼 라벨이 row 내부에 표시되도록 했습니다. WorkspaceShell 스크롤 구조와 DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/common/AdminTable.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/files/fileTrashSectionColumns.tsx
추가 파일 목록 :
- docs/storage-trash-density-0.18.30.md
삭제 파일 목록 :
- 없음
