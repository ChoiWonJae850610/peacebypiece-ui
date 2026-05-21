Version : 0.15.63
Summary : 작업지시서 workflow/save serviceCode 연결 보강
Description : serviceCode 즉시 저장 field 판정의 WorkOrder 타입 불일치 빌드 오류를 수정하고, workflow action 및 명시 저장 scope의 serviceCode mapping 기준을 상수로 정리했습니다. DB schema, R2, 권한, 세션 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/constants/workorderServiceCodes.ts
- lib/workorder/serviceCodeForWorkOrderPatch.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
추가 파일 목록 :
- docs/wafl-a-type/86_wafl-a-type-workorder-service-code-workflow-wire.md
삭제 파일 목록 :
- 없음
