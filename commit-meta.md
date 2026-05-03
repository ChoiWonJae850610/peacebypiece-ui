Version :
0.9.136

Summary :
관리자 파일관리 액션 중복 실행 방지

Description :
관리자 파일관리 화면에서 첨부 삭제, 휴지통 복구, 영구삭제 요청 중 버튼을 반복 클릭해 같은 액션이 중복 실행될 수 있는 위험을 줄였다. 액션 진행 중에는 관련 버튼과 전체 선택을 비활성화하고 처리 중 상태를 표시한다. 기존 R2 Worker 기반 삭제 흐름, DB schema, API 응답 포맷은 변경하지 않았다.

수정 파일 목록 :
- app/admin/files/page.tsx
- components/admin/files/FileListSection.tsx
- components/admin/files/FileTrashSection.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/admin-files-stability-0.9.136.md

삭제 파일 목록 :
없음
