Version : 0.10.23
Summary : 저장소 휴지통 테이블 표시 보정
Description : 저장소 관리 휴지통 테이블의 컬럼 폭과 긴 텍스트 표시를 보정했습니다. 대상 컬럼은 넓게 유지하고 작업지시서/유형/크기 컬럼은 말줄임 및 배지 표시로 정리해 긴 파일명과 긴 작업지시서명이 테이블 균형을 깨지 않도록 했습니다. 복원/선택 삭제/비우기/새로고침/R2 purge/감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/files/FileTrashSection.tsx
- components/admin/files/fileTrashSectionColumns.tsx
- components/admin/files/fileTrashSectionRows.ts

추가 파일 목록 :
- docs/admin-files-trash-columns-0.10.23.md

삭제 파일 목록 :
- 없음
