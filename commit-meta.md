Version :
0.9.224352

Summary :
작업지시서 상태 patch 응답 경량화

Description :
작업지시서 상태 변경 전용 PATCH 응답이 상세 첨부와 메모를 포함하지 않도록 경량화했다. 프론트 저장 경로는 patch 결과를 현재 작업지시서 상태에 부분 병합하도록 조정해 상세 snapshot 상태가 false로 덮이는 문제를 줄였다.

수정 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- types/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-state-patch-response-lightweight-0.9.224352.md

삭제 파일 목록 :
없음
