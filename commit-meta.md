Version : 0.15.55
Summary : 작업지시서 side effect route guard 1차 적용
Description : 메모, 첨부/R2, 저장소 복원/삭제 요청, purge worker route에 serviceCode 기반 resource/operation guard를 연결했습니다. 생산구성 replace guard와 별도로 route 단위 DB/R2 side effect를 serviceCode matrix 기준으로 확인하도록 보강했습니다. DB schema, R2 key, 권한/세션 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- app/api/admin/files/trash/purge/route.ts
- app/api/admin/files/trash/purge-worker/route.ts
- app/api/admin/files/trash/restore/route.ts
- app/api/admin/files/workorders/purge/route.ts
- app/api/admin/files/workorders/restore/route.ts
- app/api/system/storage-usage/purge/route.ts
- app/api/workorders/attachments/delete/route.ts
- app/api/workorders/attachments/primary/route.ts
- app/api/workorders/attachments/upload/complete/route.ts
- app/api/workorders/attachments/upload/route.ts
- app/api/workorders/memos/route.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
- lib/workorder/serviceCodeGuards.ts
추가 파일 목록 :
- docs/wafl-a-type/78_wafl-a-type-workorder-side-effect-route-guards.md
삭제 파일 목록 :
- 없음
