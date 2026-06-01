# WAFL / PeaceByPiece UI

- 기준 앱 버전: `0.18.93`
- 프로젝트 성격: 의류 생산·작업지시서·원단/부자재 발주·고객사 운영을 관리하는 WAFL 웹 UI
- 현재 작업 상태: 사용자가 테스트 가능하다고 명시하기 전까지 테스트 불가 상태로 간주한다.
- 테스트 불가 기간 작업 원칙: 문서 최신화, 소스 점검, 로컬 생성물 정리, 명백한 타입 오류 수정처럼 영향 범위가 좁은 작업만 우선한다.

## 개발 실행

```bash
npm run dev
```

로컬 실행 후 브라우저에서 `http://localhost:3000`을 연다.

## 빌드 확인

```bash
npm run build
```

ChatGPT/container에서는 `npm run build`를 실행하지 않는다. 빌드 확인은 사용자가 로컬에서 수행하고, 실패 로그가 있으면 다음 패치에서 원인을 먼저 반영한다.

## 주요 문서

- 문서 인덱스: `docs/README.md`
- 현재 기준 문서: `docs/현재기준/`
- 정책 문서: `docs/정책문서/`
- 보관 문서: `docs/보관문서/`
- 누적 테스트 항목: `pending-tests.md`

## 작업 규칙 요약

- `APP_VERSION`, `commit-meta.md Version`, 패치 zip 파일명 버전은 일치해야 한다.
- 패치 zip은 flat 구조로 제공한다.
- `.env.local`, 실제 DB/R2 URL, 토큰, secret key는 포함하지 않는다.
- DB/API/R2/첨부/메모/휴지통/purge/권한/작업지시서 상태 흐름은 직접 목표가 아니면 변경하지 않는다.
- 공통 컴포넌트와 공통 유틸을 우선 사용하고, 화면 TSX에 도메인 로직을 과도하게 넣지 않는다.
- 고객 공개 문서와 UI에서는 서비스명을 WAFL 기준으로 유지한다.

## 현재 저위험 정리 흐름

최근 정리 흐름은 통계정보 소스 분리 이후 테스트 불가 상태에 맞춰 문서와 프로젝트 루트 정리를 우선한다.

- `docs/project-source-cleanup-audit-0.18.87.md`
- `docs/dev-test-route-audit-0.18.88.md`
- `docs/project-readme-refresh-0.18.89.md`
- `docs/current-baseline-doc-audit-0.18.90.md`
- `docs/source-artifact-ignore-audit-0.18.91.md`
- `docs/scripts-folder-audit-0.18.93.md`


## 개발/시드 스크립트 안내

- `scripts/` 폴더는 운영 앱 런타임에 직접 포함되는 화면 코드가 아니라 개발·시드·검증 보조 스크립트 영역이다.
- R2 더미 파일 스크립트는 개발 DB와 초기화 가능한 테스트 R2에서만 실행한다.
- 실제 DB/R2 URL, Worker URL, secret 값은 문서와 Git에 기록하지 않는다.
- 테스트 불가 기간에는 스크립트 동작 변경보다 사용 범위 문서화와 실행 조건 정리를 우선한다.

## Cloudflare Worker 보관 기준

- `cloudflare/r2-upload-worker.js`는 R2 업로드·다운로드·삭제 요청을 중계하는 Worker 기준 파일이다.
- `cloudflare/pdf-generator-worker/`는 PDF 생성 Worker의 Wrangler 배포 기준 폴더다.
- `cloudflare/pdf-generator-worker.js`와 `cloudflare/pdf-generator-worker.wrangler.example.toml`은 과거/예시 진입점이므로 신규 배포 기준으로 사용하지 않는다.
- 테스트 불가 기간에는 Worker 코드 동작 변경보다 배포 기준과 보관 기준 문서화를 우선한다.
