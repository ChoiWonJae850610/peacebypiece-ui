Version : 0.16.56
Summary : 작업지시서 repository write 경계 분리 및 0.16.55 빌드 오류 보정
Description : dbWorkOrderReadRepository의 WorkOrderListOptions 순환 import 오류를 제거하고, 작업지시서 create/save/delete/state patch 계열을 dbWorkOrderWriteRepository 경계로 분리했습니다. 기존 DB query와 권한/워크플로우 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderReadRepository.ts
- lib/workorder/repository/workOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderWriteRepository.ts
삭제 파일 목록 :
- 없음
