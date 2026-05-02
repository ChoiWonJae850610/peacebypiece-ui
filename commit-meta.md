Version : 0.9.74
Base Version : 0.9.73
Target Version : 0.9.74
Summary : full_reset 실행 검증 파일 추가
Description : full_reset.sql 실행 후 핵심 테이블, view, seed, FK 정합성을 확인하는 smoke test SQL과 실행 검증 가이드를 추가하고 앱 버전을 0.9.74로 갱신했습니다. 기존 full_reset.sql 구조와 package.json, package-lock.json, .env.local은 수정하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- db/schema/full_reset_smoke_test.sql
- docs/db/full_reset_validation.md
삭제 파일 목록 :
- 없음
