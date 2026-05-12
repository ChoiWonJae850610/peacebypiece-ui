Version :
0.10.91

Summary :
작업지시서 목록 요약 조회 경량화

Description :
작업지시서 목록 summary API가 spec_sheets payload 전체를 내려받지 않고 목록 표시에 필요한 summary key와 DB row count만 조회하도록 분리했다. 상세 조회 흐름은 기존대로 유지해 선택한 작업지시서 상세 데이터 hydrate 동작은 보존했다.

수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-summary-lightweight-0.10.91.md

삭제 파일 목록 :
없음
