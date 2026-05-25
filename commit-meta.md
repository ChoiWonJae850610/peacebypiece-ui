Version : 0.16.42
Summary : Google 로그인 테스트 seed 승인 상태 보정
Description : 실제 Gmail 1개로 개발 테스트 콘솔에 진입할 수 있도록 Google login seed가 TEST A 고객사 관리자와 승인 완료 상태를 강제 보정하고, pending join request로 승인대기 화면에 걸리지 않도록 정리했습니다. verify SQL에는 회사 활성/온보딩/구독/멤버 승인/pending blocker 확인 항목을 추가했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- db/test/scenario_google_login_seed.sql
- db/test/verify_google_login_seed.sql
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
