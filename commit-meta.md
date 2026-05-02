Version : 0.9.98
Base Version : 0.9.97
Target Version : 0.9.98
Summary : 관리자 파일 관리 read-only 복원
Description : 0.9.93에서 회귀 점검 화면으로 대체된 /admin/files를 read-only 파일 관리 화면으로 복원했습니다. 기존 /api/admin/files/snapshot GET API를 사용해 첨부파일 목록, 휴지통, 저장소 사용량, 최근 업로드 추이, 파일 유형 분포를 표시하며 업로드/삭제/복구/다운로드/R2/DB 저장 흐름은 수정하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/files/page.tsx
추가 파일 목록 :
- components/admin/files/AdminFilesReadOnlyPage.tsx
- docs/admin/admin_files_readonly_restore.md
삭제 파일 목록 :
- 없음
