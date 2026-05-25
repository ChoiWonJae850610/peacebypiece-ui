Version : 0.16.59
Summary : 작업지시서 repository DB 타입 분리
Description : 작업지시서 repository 내부에 있던 spec_sheets row/schema 타입을 별도 타입 파일로 분리하여 repository 본문 크기를 줄이고 read/write/schema 분리 작업의 다음 단계를 준비했습니다. DB query, 권한, workflow, 버튼 표시 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepositoryTypes.ts
삭제 파일 목록 :
- 없음
