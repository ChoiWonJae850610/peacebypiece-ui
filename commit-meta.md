Version : 0.16.54
Summary : 작업지시서 repository scope 분리 1차 정리
Description : 작업지시서 DB repository에 포함되어 있던 회사 scope와 담당자 조회 visibility scope 타입/정규화 함수를 별도 모듈로 분리했습니다. 기존 repository export 호환성은 유지하고 동작 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepositoryScope.ts
삭제 파일 목록 :
- 없음
