# 문서·SQL·스크립트 정리 후보 재분류 (0.19.94.3)

## 목적

0.19.94.2 적용 후 프로젝트 zip을 다시 분석하여, 테스트가 어려운 기간에 추가로 지울 수 있는 것과 보류해야 하는 것을 분리한다. 이번 버전은 기능 코드/API/DB/R2 흐름을 수정하지 않고, 문서와 기준 파일만 정리한다.

## 기준 상태

- 기준 버전: 0.19.94.2
- 전체 파일 수: 1427
- 전체 폴더 수: 337
- `docs/**/*.md` 수: 389
- `playwright-report/`, `test-results/` 파일: zip 기준 남아 있지 않음
- `public/*.svg` 기본 파일: zip 기준 남아 있지 않음

## 1. 이번에 삭제하지 않는 항목

### docs/

`docs/`에는 버전별 작업 기록, 정책 문서, 현재 기준 문서, 과거 보관문서가 섞여 있다. 수량은 많지만 정책/권한/DB/작업지시서 흐름의 판단 근거가 포함되어 있어 테스트 불가 기간에 대량 삭제하지 않는다.

정리 방향은 삭제가 아니라 다음 순서가 맞다.

1. `docs/현재기준/`은 현행 기준 문서로 유지한다.
2. `docs/정책문서/`는 고객 공개 약관/정책과 연결되므로 유지한다.
3. 버전별 작업 기록은 당장은 유지하되, 향후 `docs/보관문서/작업기록/0.18/`, `docs/보관문서/작업기록/0.19/`처럼 archive 이동을 검토한다.
4. 한글 경로가 포함된 문서는 zip 인코딩 문제가 생기지 않도록 한꺼번에 이동하지 않는다.

### db/

현재 `db/` 파일은 삭제하지 않는다.

- `db/schema/full_reset.sql`: 개발 DB 초기화 기준
- `db/schema/full_reset_smoke_test.sql`: full reset 후 schema smoke 검증 기준
- `db/migrations/*`: 과거 개발 DB 보정 SQL
- `db/seed/*`: 시스템 관리자/기준정보 seed
- `db/test/*`: 권한, workflow, Google login bridge, 회사 범위 검증용 SQL

0.19.93.1에서 DB full reset 후 협력업체 저장 문제가 해결되었으므로, 오히려 DB 기준 파일은 유지해야 한다.

### scripts/

현재 `scripts/` 파일은 유지한다.

- `scripts/smoke-db-api.mjs`: DB/API smoke test 기준 파일
- `scripts/seed-r2-demo-files.mjs`: R2 demo seed 보조 파일
- `scripts/seed-r2-demo-files-usage.md`: 사용 조건 문서
- `scripts/README.md`: scripts 폴더 기준 문서

## 2. 추가 정리 후보

### 루트 README/docs README/db README 최신화

루트 README와 docs/db README의 기준 버전이 과거 버전으로 남아 있었다. 이번 패치에서 0.19.94.3 기준으로 갱신한다.

### 빈 폴더

zip 기준 비어 있는 폴더는 다음과 같다.

```text
app/(admin)/admin
app/admin
app/invite/company
app/invite/member
app/system/standards
app/workspace
cloudflare/pdf-generator-worker/.wrangler
public
```

이들은 Git 추적 대상이 아닐 가능성이 높다. 단, Next.js route group 상위 폴더처럼 의미가 있는 경로가 섞여 있으므로 패치 삭제 목록에 넣지 않는다. 빈 폴더 정리는 패치 스크립트가 아니라 별도 clean 단계에서 처리하는 편이 안전하다.

### commit-meta.md

`commit-meta.md`는 패치 zip에는 반드시 필요하지만, 장기적으로 repo root에 계속 남는 것은 이상적이지 않다. 다만 현재 자동화 스크립트가 이 파일을 적용/커밋 흐름에 사용하고 있으므로 이번에는 삭제하지 않는다.

후속으로는 패치 스크립트를 수정해 `commit-meta.md`를 patch metadata로만 읽고, repo root에는 남기지 않는 방식이 더 적절하다.

## 3. 다음 정리 권장 순서

```text
0.19.94.4 — 패치 스크립트 삭제 안전장치 설계/수정
- 삭제 목록의 폴더 경로 기본 차단
- 생성 산출물 폴더만 allowlist로 삭제
- app/lib/components/db 하위 폴더 삭제는 기본 차단
- commit-meta.md를 repo root에 남기지 않는 방식 검토

0.19.94.5 — docs archive 이동 계획 문서화
- 버전별 작업 기록을 현행/보관/삭제금지로 분류
- 실제 이동은 테스트 가능 시점 또는 별도 검토 후 진행

0.19.95 — 고객사 회사 파일 DB/API 1차 복귀
```

## 4. 이번 패치의 변경 범위

- `README.md` 기준 버전과 파일 구조 정리 기준 갱신
- `docs/README.md` 기준 버전과 정리 기준 갱신
- `db/README.md` 기준 버전과 DB 파일 유지 기준 갱신
- 신규 감사 문서 추가
- 기능 코드, DB schema, API route, R2 flow 변경 없음

ChatGPT/container에서는 `npm run build`를 실행하지 않았다.
