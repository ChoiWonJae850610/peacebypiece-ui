Version : 0.16.38
Summary : 실제 Google 테스트 계정 연결형 seed 추가
Description : DB 검증용 테스트 seed와 별도로 실제 Gmail 주소를 연결할 수 있는 개발/test 전용 seed와 검증 SQL을 추가했습니다. Google 로그인 우회 없이 이메일 매칭 후 최초 로그인 시 google_sub가 연결되도록 구성하고, placeholder/중복 이메일/멤버십 상태를 검증하는 SQL을 함께 제공합니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- db/test/scenario_google_login_seed.sql
- db/test/verify_google_login_seed.sql
삭제 파일 목록 :
