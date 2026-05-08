Version :
0.9.22409

Summary :
저장소 휴지통 코드 책임과 공통 정책 함수 정리

Description :
저장소 휴지통의 작업지시서 묶음 항목 판정, 복원 정책 라벨, 묶음 항목 count, 용량 합산 로직을 trashPolicy 공통 함수로 정리했다. UI 컴포넌트와 server action에 남아 있던 inline 도메인 판단을 줄이고, 작업지시서 묶음 복원 정책 비교를 정책 상수 기준으로 통일했다.

수정 파일 목록 :
- components/admin/files/fileTrashSectionActions.ts
- components/admin/files/fileTrashSectionColumns.tsx
- components/admin/files/fileTrashSectionRows.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/files/trashPolicy.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-trash-code-responsibility-cleanup-0.9.22409.md

삭제 파일 목록 :
없음
