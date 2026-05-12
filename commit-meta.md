Version :
0.10.88

Summary :
작업지시서 초기 로딩 상세 조회 분리

Description :
작업지시서 화면 초기 진입 시 목록 요약 조회와 선택 작업지시서 상세 조회가 한 흐름에서 묶여 있던 구조를 분리했다. 초기 loadWorkspaceState는 목록 요약만 반환하고, 선택된 작업지시서 상세는 기존 상세 지연 로딩 흐름에서 별도로 가져오도록 변경했다. summary/detail API 응답 meta에 durationMs를 추가해 이후 성능 병목을 분리 확인할 수 있게 했다.

수정 파일 목록 :
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-performance-first-pass-0.10.88.md

삭제 파일 목록 :
없음
