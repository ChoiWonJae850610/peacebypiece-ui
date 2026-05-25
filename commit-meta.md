Version : 0.16.79
Summary : 작업지시서 repository facade import 경계 정리
Description : dbWorkOrderRepository.ts가 read/write repository를 통해 외부 공개 facade 역할만 수행하도록 정리하고, dbWorkOrderReadRepository와 dbWorkOrderWriteRepository가 facade 파일을 다시 참조하지 않도록 flow 파일을 직접 바라보게 수정했습니다. 순환 import 위험을 줄이고 repository 계층의 read/write/facade 경계를 명확히 했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/repository/dbWorkOrderReadRepository.ts
- lib/workorder/repository/dbWorkOrderWriteRepository.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
