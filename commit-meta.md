Version :
0.13.30

Summary :
저장소관리 회사 범위 기준과 snapshot fallback 제거

Description :
저장소 관리 snapshot, 휴지통 복원, 삭제 요청, 작업지시서 묶음 복원/삭제 요청 API가 실제 로그인 세션의 companyId를 기준으로 동작하도록 보강했다. DB 조회 실패 시 mock/fallback snapshot을 반환하지 않도록 정리하고, 저장소 화면의 회사명도 세션 snapshot 기반으로 표시하도록 조정했다.

수정 파일 목록 :
- lib/admin/adminFiles.adapter.ts
- lib/admin/adminFiles.purgeWorker.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/admin/dbIntegration.ts
- lib/constants/app.ts
- app/api/admin/files/snapshot/route.ts
- app/api/admin/files/workorders/purge/route.ts
- app/api/admin/files/workorders/restore/route.ts
- app/api/admin/files/trash/purge/route.ts
- app/api/admin/files/trash/purge-candidates/route.ts
- app/api/admin/files/trash/restore/route.ts
- app/admin/files/page.tsx

추가 파일 목록 :
- lib/admin/files/sessionScope.ts

삭제 파일 목록 :
없음
