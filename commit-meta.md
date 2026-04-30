Version: 0.8.0

Summary: 사용자/권한 DB 구조 도입

Description: 관리자 환경설정의 사용자/권한 테스트 패널을 실제 DB 사용자 조회 repository와 연결하고, 역할/권한 기준 테이블 SQL 패치를 추가함.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.8.0으로 갱신.
- app/admin/settings/page.tsx: 사용자/권한 패널 초기 데이터를 DB repository에서 조회하고 실패 시 mock fallback을 사용하도록 연결.
- components/admin/settings/AdminUserAccessPreview.tsx: 사용자 목록과 sourceState를 props로 받도록 변경.
- lib/admin/settings/userAccessPresentation.ts: DB 조회 상태와 사용자/역할 DB 조회 체크리스트 항목 추가.
- lib/i18n/ko/admin.ts: 사용자/권한 패널의 DB 조회 상태 및 체크리스트 문구 추가.
- lib/i18n/en/admin.ts: 사용자/권한 패널의 DB 조회 상태 및 체크리스트 문구 영문 동기화.
- commit-meta.md: 모바일 최소 응답용 작업 상세 메타데이터 갱신.

추가 파일 목록:
- lib/admin/settings/userAccessRepository.ts: users/company_users 기준 사용자/역할 조회 repository 추가.
- app/api/admin/settings/users/route.ts: 관리자 사용자/권한 조회 API route 추가.
- db/schema/patch_0_8_0_user_permission_db_structure.sql: role_catalog, permission_catalog, role_permissions 및 사용자/회사 역할 seed SQL 추가.

삭제 파일 목록:
- 없음

작업 상세 내용:
1. 관리자 환경설정 사용자/권한 패널이 실제 DB 조회 결과를 우선 사용하도록 연결.
2. users + company_users 구조를 우선 조회하고, 기존 full_reset.sql의 users.company_id + users.role 구조도 fallback 조회할 수 있게 repository를 구성.
3. 실제 DB 조회 성공, DB 구조 준비, mock fallback 상태를 presentation sourceState로 분리.
4. 역할/권한 기준 테이블(role_catalog, permission_catalog, role_permissions)과 기본 seed SQL을 추가.
5. 기능 흐름, WorkOrder 권한/actionFlow/selector, package.json/package-lock.json은 수정하지 않음.

이번 작업 진행 판단:
- 0.8.0 사용자/권한 DB 구조 도입 1차 완료.
- 실제 권한 변경 저장 모달과 로그인 adapter 연결은 아직 미완료이며 다음 단계 작업 대상.
- node_modules가 없어 로컬 build 검증은 수행하지 못함.

다음 작업 권장 버전:
- 0.8.1 — 관리자 환경설정 권한 관리 모달
