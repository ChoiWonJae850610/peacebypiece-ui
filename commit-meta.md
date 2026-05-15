Version :
0.12.71

Summary :
저장소 관리 화면 소스 마감 정리

Description :
저장소 관리 화면의 요약 카드 표시 변환 로직과 휴지통 테이블 표시 상수/유틸을 lib/admin/files 하위 presentation 파일로 분리했다. FileStorageSummary와 휴지통 관련 컴포넌트의 중복 표시 로직을 줄이고, 기존 DB/R2/복원/삭제/비우기 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/files/fileTrashSectionActions.ts
- components/admin/files/fileTrashSectionColumns.tsx
- components/admin/files/fileTrashSectionPresentation.tsx
- components/admin/files/fileTrashSectionRows.ts

추가 파일 목록 :
- lib/admin/files/storageSummaryPresentation.ts
- lib/admin/files/trashTablePresentation.ts

삭제 파일 목록 :
없음
