Version :
0.10.61

Summary :
API 권한 검증 1차 구조 추가

Description :
permission_code 기준 API 권한 검증 공통 유틸을 추가하고 작업지시서, 저장소 휴지통, 협력업체, 기준정보의 주요 변경 API에 1차 검증을 적용했다. 실제 세션 기반 권한 조회는 후속 작업으로 분리하고 현재는 고객관리자 기본 권한 묶음을 preview 권한으로 사용한다.

수정 파일 목록 :
- app/api/workorders/route.ts
- app/api/workorders/[workOrderId]/route.ts
- app/api/workorders/attachments/delete/route.ts
- app/api/admin/files/trash/restore/route.ts
- app/api/admin/files/trash/purge/route.ts
- app/api/admin/files/workorders/restore/route.ts
- app/api/admin/files/workorders/purge/route.ts
- app/api/admin/partners/route.ts
- app/api/admin/standards/route.ts
- lib/permissions/index.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/permissions/apiPermissionGuard.ts
- docs/api-permission-guard-0.10.61.md

삭제 파일 목록 :
없음
