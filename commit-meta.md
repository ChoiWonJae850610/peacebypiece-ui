Version :
0.15.38

Summary :
작업지시서 히스토리 상수 기준 1차 정리

Description :
작업지시서 히스토리 category, filter, tone, memo action 값을 공통 상수로 분리하고 history builder와 filter의 직접 문자열 사용을 줄였다. 후속 result/reason code 정리 후보도 문서화했다.

수정 파일 목록 :
- types/workflow.ts
- lib/workorder/actionFlow/memoResults.ts
- lib/workorder/history/builders/workHistoryBuilders.ts
- lib/workorder/history/builders/inventoryHistoryBuilders.ts
- lib/workorder/history/builders/attachmentHistoryBuilders.ts
- lib/workorder/history/filters.ts
- lib/workorder/history/inventory.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- lib/constants/workorderHistory.ts
- docs/wafl-a-type/61_wafl-a-type-workorder-history-reason-constants.md

삭제 파일 목록 :
없음
