Version: 0.7.3

Summary: 사용자/권한 테스트 구조 준비

Description: 관리자 환경설정 화면에 사용자/권한 테스트 패널을 추가하고, 실제 로그인 전환 전 확인할 users/company_users SQL 패치와 중앙 role policy 기반 표시 모델을 추가함.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.7.3으로 갱신.
- app/admin/settings/page.tsx: 환경설정 화면에 사용자/권한 테스트 패널 배치.
- lib/i18n/ko/admin.ts: 사용자/권한 테스트 패널 문구 추가.
- lib/i18n/en/admin.ts: 사용자/권한 테스트 패널 영문 문구 추가.
- commit-meta.md: 모바일 최소 응답용 작업 상세 메타데이터 갱신.

추가 파일 목록:
- lib/admin/settings/userAccessPresentation.ts: mock 사용자와 중앙 role policy를 기반으로 권한 테스트 표시 모델 생성.
- components/admin/settings/AdminUserAccessPreview.tsx: 환경설정 내 사용자/권한 테스트 읽기 전용 패널 추가.
- db/schema/patch_0_7_3_user_access_test_structure.sql: users/company_users 테이블과 테스트 계정 seed SQL 준비.

삭제 파일 목록:
- 없음

작업 상세 내용:
1. 0.7.3 단계 목표인 작업지시서 권한/사용자 테스트 구조 준비를 환경설정 화면에 읽기 전용 패널로 연결.
2. 현재 실제 로그인 연결 전이므로 mock 사용자 seed를 기준으로 관리자/디자이너/검수자 역할별 권한 표시.
3. 권한 판단은 tsx 내부 조건이 아니라 lib/constants/roles.ts의 중앙 role/permission 결과를 presentation 모델에서 받아 표시.
4. users 및 company_users SQL 패치를 추가해 다음 단계의 실제 DB 사용자 조회/역할 변경 모달 연결 기반을 마련.
5. 기능 변경, WorkOrder actionFlow/selector 변경, package.json/package-lock.json 수정 없음.

이번 작업 진행 판단:
- 사용자/권한 테스트 구조 준비 완료.
- 실제 로그인 adapter 및 권한 변경 저장 모달은 아직 미연결이며 다음 단계 작업 대상.
- node_modules가 없어 로컬 build 검증은 수행하지 못함.

다음 작업 권장 버전:
- 0.8.0 — 사용자/권한 DB 구조 도입 또는 실제 DB 조회 repository 연결 시작.
