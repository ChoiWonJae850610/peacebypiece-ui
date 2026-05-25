Version : 0.16.43
Summary : 개발 테스트 seed 회사 프로필 완료 상태 보정
Description : Google 로그인 테스트 계정과 dev test fixture 회사가 workspace 진입 시 고객사 등록/승인대기 모달에 걸리지 않도록 테스트 seed의 회사 필수 프로필 값과 관리자 전화번호를 보강했습니다. verify_google_login_seed.sql은 회사 프로필 누락 여부까지 확인하도록 확장했습니다. npm run build 미실행 — 사용자가 로컬에서 확인.
수정 파일 목록 :
- lib/constants/app.ts
- db/test/scenario_seed.sql
- db/test/scenario_google_login_seed.sql
- db/test/verify_google_login_seed.sql
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
