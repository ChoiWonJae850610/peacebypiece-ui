# WAFL Cloudflare Worker 보관 기준

- 기준 앱 버전: `0.18.93`
- 이 폴더는 WAFL의 Cloudflare Worker 관련 기준 파일과 배포 보조 파일을 보관한다.
- 테스트 불가 기간에는 Worker 런타임 동작을 수정하지 않고, 배포 기준과 보관 기준을 문서화하는 범위로만 정리한다.

## 파일/폴더 역할

| 경로 | 역할 | 현재 판단 |
| --- | --- | --- |
| `cloudflare/r2-upload-worker.js` | R2 업로드·다운로드·삭제 요청을 중계하는 Worker 기준 파일 | 유지 |
| `cloudflare/pdf-generator-worker/` | PDF Generator Worker의 Wrangler 배포 기준 폴더 | 유지 |
| `cloudflare/pdf-generator-worker/src/index.js` | PDF Generator Worker 실제 엔트리 | 유지 |
| `cloudflare/pdf-generator-worker/wrangler.toml` | PDF Generator Worker Wrangler 설정 | 유지 |
| `cloudflare/pdf-generator-worker.js` | 과거 단일 파일/Deprecated PDF Worker 진입점 | 신규 배포 기준 아님, 삭제는 테스트 가능 후 판단 |
| `cloudflare/pdf-generator-worker.wrangler.example.toml` | 과거 예시 설정 | 신규 배포 기준 아님, 삭제는 테스트 가능 후 판단 |

## 운영 주의

- `.env.local`, 실제 Worker URL, R2 URL, secret key, 토큰은 Git에 포함하지 않는다.
- PDF Generator Worker의 실제 배포는 `cloudflare/pdf-generator-worker/`에서 Wrangler로 진행한다.
- R2 Worker와 PDF Generator Worker는 역할을 분리한다.
- `cloudflare/pdf-generator-worker/package.json`은 루트 앱의 `package.json`과 별개인 Worker 전용 package 파일이다.
