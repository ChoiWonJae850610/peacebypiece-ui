Version : 0.16.80
Summary : 작업지시서 repository trace helper 분리
Description : 작업지시서 repository 공개 계층의 query trace helper를 별도 파일로 분리하여 workOrderRepository.ts의 책임을 축소하고, dbWorkOrderRepository 계열 façade 정리 이후의 public repository 경계를 한 번 더 정리하였습니다. 기능 동작, DB schema, 권한, workflow 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/workOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/workOrderRepositoryTrace.ts
삭제 파일 목록 :
- 없음
