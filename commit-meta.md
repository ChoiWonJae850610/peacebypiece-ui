Version :
0.9.224349

Summary :
spec_sheets payload 의존성 점검과 상세 조회 범위 축소

Description :
spec_sheets.payload 컬럼을 즉시 필수 조건으로 보지 않도록 DB 상태 점검을 완화하고, 작업지시서 상세 1건 조회가 전체 작업지시서 목록을 다시 읽지 않도록 repository 조회 범위를 축소했다. payload 정리 원칙과 남은 의존성도 문서화했다.

수정 파일 목록 :
- app/api/workorders/status/route.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-payload-dependency-plan-0.9.224349.md

삭제 파일 목록 :
없음
