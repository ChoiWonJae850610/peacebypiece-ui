Version : 0.16.78
Summary : 작업지시서 repository facade 정리
Description : dbWorkOrderRepository의 조회, 삭제, 상태 패치 흐름을 별도 flow 파일로 분리하고 repository 본문을 공개 facade 중심으로 축소했습니다. DB schema, 권한 정책, workflow 정책, 버튼 표시 조건은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderReadFlows.ts
- lib/workorder/repository/dbWorkOrderDeleteFlows.ts
- lib/workorder/repository/dbWorkOrderStatePatchFlows.ts
삭제 파일 목록 :
