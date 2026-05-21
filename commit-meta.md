Version :
0.15.42

Summary :
작업지시서 생산구성 숫자 입력값 실시간 반영 보강

Description :
작업지시서 원단, 부자재, 외주공정, 공장 발주 row의 수량과 단가 계열 숫자 입력값이 검토요청 직전 누락되지 않도록 현재 편집 중인 숫자 값을 작업지시서 draft patch에 즉시 반영하도록 보강했다. 생산구성 숫자 입력 회귀 테스트 문서도 추가했다.

수정 파일 목록 :
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/hooks/workorder/detailEditor/useWorkOrderMaterialsEditor.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/65_wafl-a-type-workorder-live-production-draft.md

삭제 파일 목록 :
없음
