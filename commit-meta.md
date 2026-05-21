Version :
0.15.40

Summary :
작업지시서 생산구성 저장 흐름 보강

Description :
작업지시서 검토 요청 등 상태 변경 저장 시 디자이너가 입력한 공장, 원단, 부자재, 외주공정 정보가 누락되지 않도록 state patch와 DB 상세 테이블 동기화 흐름을 보강했다. 생산구성 항목은 상세 snapshot 또는 실제 row가 있을 때만 patch에 포함하여 요약 데이터 저장 중 기존 상세 row가 빈 배열로 지워지는 위험을 줄였다.

수정 파일 목록 :
- types/workorder.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/63_wafl-a-type-workorder-production-composition-persistence.md

삭제 파일 목록 :
없음
