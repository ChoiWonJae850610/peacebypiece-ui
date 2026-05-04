Version :
0.9.176

Summary :
작업지시서 단위 휴지통 처리 API skeleton 추가

Description :
통합 휴지통의 작업지시서 복구/영구삭제 확인 모달에 API 미연결 상태를 명확히 표시하고, 실제 DB/R2 상태를 변경하지 않는 작업지시서 단위 복구/영구삭제 서버 action skeleton과 방어용 API route를 추가했다. 작업지시서 단위 실제 복구/영구삭제 로직은 아직 연결하지 않았다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- lib/admin/adminFiles.serverActions.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/admin/files/workorders/restore/route.ts
- app/api/admin/files/workorders/purge/route.ts

삭제 파일 목록 :
없음
