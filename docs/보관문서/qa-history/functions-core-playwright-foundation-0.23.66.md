# Functions Core Playwright Foundation 0.23.66

## 목적

`/functions` 카탈로그의 대표 업무 기능을 Playwright 실행 파일과 연결한다. 사용자 직접 테스트가 어려운 기간이므로 실제 운영·개발 DB를 건드리지 않고, 전용 dev/test 환경이 명시적으로 활성화된 경우에만 실행한다.

## 추가 명령

```bash
npm run test:e2e:functions-core
```

기본 상태에서는 `WAFL_FUNCTIONS_E2E_ENABLED=1`이 없으므로 전체 suite가 skip된다.

## 대표 시나리오

- WKR-001-N01 작업지시서 목록 화면 진입
- MAT-001-N01 자재 발주 화면 진입
- ADM-001-N01 고객사 관리자 멤버 관리 진입
- SYS-001-N01 시스템관리자 고객사 승인 화면 진입
- USR-001-N01 개인 설정 화면 진입

## 실행 조건

- `WAFL_FUNCTIONS_E2E_ENABLED=1`
- `WAFL_SESSION_SECRET` 또는 `GOOGLE_OAUTH_CLIENT_SECRET`
- dev/test 전용 서버
- Functions fixture와 연결된 로그인·데이터 환경

## 안전 정책

- production에서 실행하지 않는다.
- 테스트가 기본으로 skip되므로 운영 데이터에 접근하지 않는다.
- 현재 버전에서는 생성·수정·삭제 mutation을 자동 실행하지 않는다.
- 화면 진입, 역할별 route, 기본 문구, document overflow만 검증한다.
- 실제 mutation과 DB 검증은 테스트 DB seed가 연결된 뒤 확장한다.

## PowerShell 자동화 메뉴 추가 대상

- 메뉴명: `Functions Core E2E Test`
- 명령: `npm run test:e2e:functions-core`
- 분류: 조건부 안전
- 파괴적 작업: 없음
- DB mutation: 없음
- runtime: dev/test 전용
- 필수 환경변수: `WAFL_FUNCTIONS_E2E_ENABLED=1`
- 환경 미준비 시 결과: skip

기존 전체 E2E 메뉴에 바로 합치기보다 별도 메뉴로 먼저 추가하고, fixture 연결 완료 후 전체 검사에 포함한다.
