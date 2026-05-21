Version :
0.15.45

Summary :
생산구성 숫자 필드 매핑 기준 통합

Description :
생산구성 수량과 단가가 검토요청 후 0으로 떨어지는 문제를 입력 타이밍이 아니라 필드 매핑 불일치 관점에서 보정했다. 원단, 부자재, 외주공정, 공장 발주 row의 숫자 필드 alias를 공통 helper로 정리하고 detail editor, state patch, DB sync 직전에 같은 기준으로 normalize하도록 수정했다.

수정 파일 목록 :
- lib/hooks/workorder/detailEditor/materialMutations.ts
- lib/hooks/workorder/detailEditor/itemMutations.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- lib/workorder/repository/dbFactoryOrderRepository.ts
- lib/workorder/structure.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- lib/workorder/productionCompositionSnapshot.ts
- docs/wafl-a-type/68_wafl-a-type-production-composition-field-mapping.md

삭제 파일 목록 :
없음
