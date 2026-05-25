Version : 0.16.65
Summary : 작업지시서 repository SQL literal 참조 빌드 오류 보정
Description : 0.16.64 빌드에서 발생한 quoteSqlLiteral 미정의 오류를 보정하고 APP_VERSION을 0.16.65로 갱신했습니다. dbWorkOrderRepository.ts 내부의 남은 quoteSqlLiteral 호출을 기존 quoteLiteral helper 사용으로 통일했으며, DB query 정책과 권한/워크플로우 동작은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
