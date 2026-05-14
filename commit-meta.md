Version :
0.12.14

Summary :
저장소 관리 semantic class 정리와 Cold Winter 대비 보정

Description :
저장소 관리 화면의 파일 요약, 작업지시서 저장소, 파일 목록, 휴지통 목록과 상세 모달의 직접 색상 class를 semantic class와 theme variable 기반으로 정리했다. default-light와 구분이 약했던 cold-winter 테마의 배경, surface, border, modal, field 계열 값을 더 차가운 블루 그레이 톤으로 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/theme/themes/coldWinter.ts
- components/admin/common/adminSemanticClassNames.ts
- components/admin/common/AdminTable.tsx
- components/admin/files/FileListSection.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- components/admin/files/fileTrashSectionColumns.tsx
- components/admin/files/fileTrashSectionModals.tsx
- components/admin/files/fileTrashSectionPresentation.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
