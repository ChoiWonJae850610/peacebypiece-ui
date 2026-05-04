Version :
0.9.165

Summary :
고객관리자 저장소 작업지시서 탭 구조 1차 반영

Description :
/admin/files에 작업지시서 탭을 추가하고 삭제된 작업지시서와 연결 첨부·메모 상태를 읽기 전용으로 확인할 수 있게 했다. 기존 첨부파일목록과 휴지통 탭의 삭제, 복구, 영구삭제 요청 흐름은 변경하지 않았다. 작업지시서 복원 버튼은 실제 로직 없이 준비중 상태로 표시했다.

수정 파일 목록 :
- app/admin/files/page.tsx
- app/api/admin/files/snapshot/route.ts
- lib/admin/adminFiles.adapter.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/files/WorkOrderStorageSection.tsx

삭제 파일 목록 :
없음
