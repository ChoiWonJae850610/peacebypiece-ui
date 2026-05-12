Version :
0.10.94

Summary :
작업지시서 payload 호환 코드 제거

Description :
작업지시서 repository 내부의 payload 컬럼 탐색, payload 파싱 fallback, payload INSERT/UPDATE 및 summary payload 재구성 로직을 제거했다. 작업지시서 row 매핑은 정규 컬럼과 정규 하위 테이블 기준으로 단순화하고, 상태 patch에서 발주정보 변경 시 orders 동기화가 유지되도록 보정했다.

수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-payload-compat-removal-0.10.94.md

삭제 파일 목록 :
없음
