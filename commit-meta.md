Version : 0.16.69
Summary : 작업지시서 repository production sync helper 분리 및 0.16.68 빌드 오류 보정
Description : 0.16.68 빌드 실패 원인인 nullable isActiveColumn 전달 오류를 보정하고, 작업지시서 저장/상태패치 후 생산구성 동기화 로직을 dbWorkOrderProductionSync로 분리했습니다. DB query 정책, 권한/역할 정책, workflow 상태 정책, 버튼 표시 조건은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/repository/dbWorkOrderDeleteHelpers.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderProductionSync.ts
삭제 파일 목록 :
- 없음
