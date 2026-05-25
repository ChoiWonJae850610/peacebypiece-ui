Version : 0.16.53
Summary : API guard 권한 코드 상수화 정리
Description : app/api 라우트와 workspace API guard 호출부의 permissionCode 직접 문자열을 MEMBER_PERMISSION_CODE 상수 참조로 정리했습니다. 권한 판정 정책과 workflow 동작은 변경하지 않았습니다.

수정 파일 목록 :
- app/api/admin/files/trash/purge/route.ts
- app/api/admin/files/trash/restore/route.ts
- app/api/admin/files/workorders/purge/route.ts
- app/api/admin/files/workorders/restore/route.ts
- app/api/admin/members/[memberId]/permissions/route.ts
- app/api/admin/members/[memberId]/route.ts
- app/api/admin/members/route.ts
- app/api/invitations/join-requests/[requestId]/approve/route.ts
- app/api/invitations/join-requests/[requestId]/reject/route.ts
- app/api/materials/route.ts
- app/api/workorders/[workOrderId]/route.ts
- app/api/workorders/attachments/delete/route.ts
- app/api/workorders/material-lines/route.ts
- app/api/workorders/route.ts
- lib/constants/app.ts
- lib/system/systemCompanyApprovalConsole.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
