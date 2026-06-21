# 문서 구조와 Codex 검색 정책

- 기준 버전: `0.24.13`
- 목적: 기능 개발 전에 Codex와 사람이 먼저 읽을 문서, 보관할 문서, 검색에서 제외할 문서를 구분한다.
- 적용 범위: `README.md`, `docs/README.md`, `docs/codex-current-state.md`, `docs/productization-roadmap.md`, `docs/현재기준/`, `docs/보관문서/`, `docs/audits/`

## 1. 문서 계층

| 계층 | 위치 | 역할 | Codex 기본 검색 |
| --- | --- | --- | --- |
| 진입점 | `README.md`, `docs/codex-current-state.md` | 현재 작업 시작, 버전 기준, profile 선택 | 포함 |
| 현재 기준 | `docs/현재기준/` | 제품·정책·화면·자동화의 현재 기준 | 포함 |
| 로드맵 | `docs/productization-roadmap.md`, `lib/internal/roadmap/*` | 다음 버전 범위와 완료 조건 | 포함 |
| 감사 | `docs/audits/` | 대량 정리, 정책 변경, 위험 판단 기록 | 필요한 경우 포함 |
| 정책 | `docs/정책문서/` | 약관, 개인정보, 요금, 보관, 권한 정책 | 관련 작업에서만 포함 |
| 보관 | `docs/보관문서/` | 완료 이력, 과거 QA, deprecated 기록 | 기본 제외 |

## 2. 기본 읽기 순서

새 작업은 다음 순서로 확인한다.

1. 로컬 Git 상태와 `APP_VERSION`
2. `docs/codex-current-state.md`
3. 해당 버전의 `lib/internal/roadmap/roadmap-*.ts`
4. `docs/현재기준/`의 관련 현재 기준 문서
5. `tools/pipeline/README.md`의 profile/finish 기준
6. 필요한 경우에만 `docs/audits/`와 `docs/보관문서/`

## 3. 기본 제외 규칙

현재 구현·정책 판단을 할 때는 아래 경로를 기본 제외한다.

```text
docs/보관문서/**
docs/**/legacy/**
docs/**/deprecated/**
node_modules/**
.next/**
artifacts/**
.tmp/**
test-results/**
playwright-report/**
```

예외적으로 과거 회귀 원인, 완료 이력, 삭제 근거를 확인해야 할 때만 보관 문서를 검색한다.

## 4. root 문서 기준

repository root에는 최소 진입점만 둔다.

- `README.md`: 현재 실행/검증/주요 문서 안내
- `AGENTS.md`: Codex/agent 작업 규칙
- `pending-tests.md`: 누적 수동 테스트 항목

새로운 완료 이력, 패치 결과, 감사 결과는 root에 추가하지 않고 `docs/audits/` 또는 `docs/보관문서/versions/`에 둔다.

## 5. 문서 이동 기준

문서 이동은 다음 조건을 만족할 때만 한다.

- canonical 현재 기준 문서에 내용이 반영되어 있다.
- 참조 경로를 수정할 수 있다.
- 정책/DB/권한/법무/Cloudflare 배포 파일이 아니다.
- 삭제가 아니라 보관 이동이 우선이다.
- 대량 이동은 별도 manifest를 남긴다.

## 6. Vercel QA 흐름

1. 로컬 또는 Codex가 변경을 완료한다.
2. 관련 contract/build가 PASS인지 확인한다.
3. 1.0 전까지는 `master`에 commit/push한다.
4. Vercel 배포본을 운영이 아니라 실기기 QA 환경으로 본다.
5. iPad, Galaxy Tab, mobile, PC에서 필요한 화면을 확인한다.
6. 문제가 있으면 같은 버전 보완 또는 다음 버전 패치로 처리한다.

## 7. 금지

- 기능 코드 수정과 문서 정리를 한꺼번에 대형 범위로 섞지 않는다.
- 보관 문서를 기본 검색 대상으로 삼지 않는다.
- root에 일회성 결과 문서를 계속 추가하지 않는다.
- `.env.local`, 실제 DB/R2 URL, token, secret key를 문서화하지 않는다.
