Version : 0.15.56
Summary : 작업지시서 state patch 서버 guard 보강
Description : 작업지시서 state patch payload에 serviceCode를 포함하고 서버 route에서 serviceCode 유효성 및 생산구성 replace guard를 한 번 더 적용했습니다. 반려/취소/되돌리기 계열에서 생산구성 patch가 서버로 넘어와도 DB 저장 직전에 제거되도록 보강했으며 system audit source에 serviceCode를 포함해 추적성을 높였습니다.
수정 파일 목록 :
- types/workorder.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/79_wafl-a-type-workorder-state-patch-server-guard.md
삭제 파일 목록 :
- 없음
