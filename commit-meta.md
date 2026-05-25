Version : 0.16.66
Summary : 작업지시서 repository 잔여 빌드 오류 파일 강제 보정
Description : 0.16.65 적용 후 브라우저 개발 서버에서 여전히 dbWorkOrderRepository.ts의 이전 select SQL fragment 오류가 표시되는 문제를 보정하기 위해, 현재 정상화된 dbWorkOrderRepository.ts와 dbWorkOrderSelectSql.ts 전체를 다시 패치 파일로 제공하고 앱 버전을 0.16.66으로 올렸습니다. DB query, 권한, 워크플로우, 버튼 표시 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
