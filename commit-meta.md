Version : 0.15.54
Summary : 작업지시서 serviceCode guard 1차 적용
Description : serviceCode side effect matrix를 생산구성 state patch 저장 직전 guard에 연결하고, 허용되지 않은 반려/취소/메모/첨부/삭제 계열에서 생산구성 replace payload가 섞여도 저장 전에 제거하도록 보강했습니다. DB schema/API/R2 동작은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/workorder/productionCompositionPolicy.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
추가 파일 목록 :
- lib/workorder/serviceCodeGuards.ts
- docs/wafl-a-type/77_wafl-a-type-workorder-service-guard-first-pass.md
삭제 파일 목록 :
- 없음
