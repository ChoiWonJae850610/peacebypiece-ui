# 0.18.88 개발/테스트 라우트 점검

## 목적

테스트 불가 기간에는 기능 동작을 넓게 바꾸지 않고, 프로젝트 안에 남아 있는 개발용·테스트용 경로와 파일을 분류한다. 이번 패치는 DB/API/R2/권한/작업지시서 상태 흐름을 변경하지 않는다.

## 확인 범위

### `app/dev/test-console`

- 현재 개발 전용 테스트 사용자 전환 화면이다.
- `isDevTestContextEnabled()`가 꺼져 있으면 `notFound()`로 차단한다.
- 실제 세션이 없으면 로그인 필요 경로로 보낸다.
- `system_admin`은 접근하지 못하게 차단한다.
- 삭제 대상이 아니라, 테스트 가능 시점까지 유지한다.

### `app/api/dev/test-context/*`

- 개발용 테스트 컨텍스트 API다.
- `WAFL_ENABLE_DEV_TEST_CONSOLE === "true"`이고 production이 아닐 때만 열린다.
- production 또는 flag disabled 상태에서는 404로 응답한다.
- 삭제 대상이 아니라, dev-only guard가 걸린 개발 편의 기능으로 유지한다.

### `lib/dev/testContext/*`

- 개발용 테스트 컨텍스트의 config, repository, service, session 유틸이다.
- 서버 전용 모듈이며 production 차단 조건을 포함한다.
- 삭제 대상이 아니라, 테스트 자동화/권한 확인용 보조 코드로 유지한다.

### `app/test/hello.txt`

- 라우트 또는 기능에서 참조되지 않는 단순 테스트 파일이다.
- 프로젝트 소스에 남길 이유가 없어 삭제 대상으로 처리한다.

### `app/worker`

- 현재 파일이 없는 빈 디렉터리 후보로 보인다.
- 실제 라우트 구현은 `app/(workspace)/worker`에 있다.
- Git은 빈 폴더를 추적하지 않으므로 패치 파일 삭제 대상에는 포함하지 않는다.

### `app/(workspace)/worker`

- 실제 작업지시서 workspace 라우트다.
- `requireWaflSessionForArea("worker")`를 통해 session guard가 적용되어 있다.
- 삭제 대상이 아니다.

## 0.18.88 처리

- `app/test/hello.txt` 삭제.
- 개발/테스트 라우트 점검 결과 문서화.
- `docs/README.md` 기준 버전 및 점검 문서 링크 최신화.
- `APP_VERSION`을 `0.18.88`로 갱신.

## 보류

- `app/dev/test-console` 삭제 또는 UI 변경은 보류한다. 테스트 가능 시점에 실제 권한 전환 흐름 확인 후 결정한다.
- `app/api/dev/test-context/*` 삭제 또는 guard 변경은 보류한다.
- `app/(workspace)/worker`는 실제 사용 라우트이므로 수정하지 않는다.
- DB/API/R2/권한/상태 전환 흐름은 이번 범위에서 제외한다.
