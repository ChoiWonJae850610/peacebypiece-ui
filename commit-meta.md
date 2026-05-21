Version : 0.15.52
Summary : 작업지시서 serviceCode 상수와 생산구성 replace allowlist 1차 도입
Description : 빌드 오류 원인이던 app constants 누락을 복원하고, 작업지시서 workflow 저장 경로에 serviceCode 기반 생산구성 replace 허용 기준을 1차로 연결했습니다. 반려/취소성 workflow는 생산구성 replace 저장을 하지 않도록 allowlist 기준을 둡니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/workorder/productionCompositionPolicy.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
추가 파일 목록 :
- lib/constants/workorderServiceCodes.ts
- docs/wafl-a-type/75_wafl-a-type-workorder-service-code-constants.md
삭제 파일 목록 :
없음
