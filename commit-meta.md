Version :
0.9.177

Summary :
통합 휴지통 작업지시서 선택 UX와 복구 API를 1차 연결

Description :
통합 휴지통에서 작업지시서 대표 row에 체크박스 선택을 추가하고, 작업지시서에 딸린 첨부 row는 선택 대상에서 제외했다. 작업지시서 복구 API를 실제 DB 복원 로직에 연결해 삭제된 작업지시서와 작업지시서 삭제로 함께 휴지통 이동한 첨부/메모만 함께 복구하도록 했다. 작업지시서 영구삭제는 아직 연결하지 않고 준비 상태로 유지했다.

수정 파일 목록 :
- app/admin/files/page.tsx
- app/api/admin/files/workorders/restore/route.ts
- components/admin/files/FileTrashSection.tsx
- lib/admin/adminFiles.serverActions.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
