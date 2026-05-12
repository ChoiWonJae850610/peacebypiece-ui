Version :
0.10.95

Summary :
작업지시서 schema 조회 캐시 보정

Description :
작업지시서 repository에서 spec_sheets schema 정보를 매 호출마다 information_schema에서 다시 조회하던 흐름을 module-level Promise cache로 보정했다. 최초 조회 실패 시 캐시를 초기화해 다음 호출에서 재시도할 수 있게 했고, DB schema나 작업지시서 저장/조회 동작은 변경하지 않았다.

수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-schema-cache-0.10.95.md

삭제 파일 목록 :
없음
