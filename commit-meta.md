Version : 0.15.49
Summary : 반려/취소성 workflow 생산구성 보존
Description : 생산구성 replace 저장을 확정 이벤트에서만 수행하도록 state patch 포함 범위를 정리하고, 저장 결과 merge 시 요청 patch에 포함된 생산구성 필드만 화면 state에 반영하도록 보강했습니다. 반려/취소/되돌리기성 workflow에서는 기존 원단·부자재·외주공정 row를 유지합니다.
수정 파일 목록 :
- lib/hooks/workorder/workorderRepositoryMutations.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/72_wafl-a-type-production-reject-preserve.md
삭제 파일 목록 :
- 없음
