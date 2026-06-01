# 0.18.93 Cloudflare Worker 보관 기준 점검

## 목적

테스트 불가 상태에서 Cloudflare Worker 관련 파일을 삭제하거나 동작 변경하지 않고, 현재 보관 기준과 후속 정리 후보를 문서화한다.

## 점검 결과

| 경로 | 판단 | 이유 |
| --- | --- | --- |
| `cloudflare/r2-upload-worker.js` | 유지 | R2 업로드·다운로드·삭제 중계 Worker 기준 파일이다. 첨부/메모/R2 흐름과 직접 연결될 수 있어 테스트 불가 상태에서 수정하지 않는다. |
| `cloudflare/pdf-generator-worker/` | 유지 | PDF Generator Worker의 Wrangler 배포 기준 폴더다. `@cloudflare/puppeteer`와 Browser Rendering binding 기준을 포함한다. |
| `cloudflare/pdf-generator-worker/src/index.js` | 유지 | PDF Generator Worker의 실제 엔트리다. |
| `cloudflare/pdf-generator-worker/wrangler.toml` | 유지 | PDF Generator Worker 배포 설정이다. 실제 토큰은 secret으로 주입해야 한다. |
| `cloudflare/pdf-generator-worker/package.json` | 유지 | 루트 앱 package가 아니라 Worker 전용 package다. |
| `cloudflare/pdf-generator-worker/package-lock.json` | 유지 | Worker 전용 dependency lock이다. |
| `cloudflare/pdf-generator-worker.js` | 삭제 보류 | deprecated 단일 파일 진입점으로 보이지만, 테스트 불가 상태에서 즉시 삭제하지 않고 후속 삭제 후보로 둔다. |
| `cloudflare/pdf-generator-worker.wrangler.example.toml` | 삭제 보류 | deprecated 예시 설정으로 보이지만, 후속 삭제 후보로만 둔다. |

## 보강 내용

- `cloudflare/README.md`를 추가해 Worker 파일·폴더 역할을 정리했다.
- `cloudflare/pdf-generator-worker/README.md`에 deprecated 파일과 신규 배포 기준을 명시했다.
- 루트 `README.md`와 `docs/README.md`에 Cloudflare Worker 보관 기준을 연결했다.

## 삭제 보류 후보

테스트 가능 상태가 되면 아래 파일은 실제 참조 여부를 다시 확인한 뒤 삭제를 검토한다.

- `cloudflare/pdf-generator-worker.js`
- `cloudflare/pdf-generator-worker.wrangler.example.toml`

## 변경하지 않은 영역

- R2 Worker 런타임 코드
- PDF Worker 런타임 코드
- DB/API/R2/첨부/메모/휴지통/purge/권한/상태 흐름
- package.json/package-lock.json
