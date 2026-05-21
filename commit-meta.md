Version :
0.15.44

Summary :
생산구성 확정 저장 정책과 빌드 오류 수정

Description :
작업지시서 생산구성 workflow action snapshot 보강 과정에서 누락된 material snapshot helper import를 추가해 빌드 오류를 수정했다. 생산구성은 검토요청, 검토완료, 발주/검수 진행처럼 앞으로 진행되는 workflow 상태에서만 확정 저장되도록 정책 함수를 추가하고 state patch 생성 기준에 반영했다.

수정 파일 목록 :
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- lib/workorder/productionCompositionPolicy.ts
- docs/wafl-a-type/67_wafl-a-type-production-composition-commit-policy.md

삭제 파일 목록 :
없음
