Version :
0.11.40

Summary :
모바일 관리자 저장소 화면 표시 보정

Description :
관리자 저장소 화면의 모바일 표시를 위해 저장소 요약 카드, 휴지통 액션 버튼, 목록 overflow, 휴지통 확인 모달 footer 배치를 보정했다. 저장소 복원, 삭제 요청, R2 purge, DB/API 흐름은 변경하지 않았다.

수정 파일 목록 :
- app/admin/files/page.tsx
- components/admin/common/AdminActionBar.tsx
- components/admin/common/AdminTable.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/files/FileListSection.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- components/admin/files/fileTrashSectionModals.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/responsive-admin-files-0.11.40.md

삭제 파일 목록 :
없음
