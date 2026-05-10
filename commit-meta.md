Version :
0.9.224344

Summary :
작업지시서 목록 전용 summary API 1차 추가

Description :
작업지시서 화면 첫 진입 병목을 줄이기 위한 준비 단계로 기존 전체 작업지시서 API를 유지하면서 별도 목록 전용 summary API를 추가했다. DB repository에 summary 조회 함수를 추가하고, 작업지시서 목록용 타입과 route handler를 분리했다.

수정 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- types/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/workorders/summary/route.ts
- docs/workorder-summary-api-first-pass-0.9.224344.md

삭제 파일 목록 :
없음
