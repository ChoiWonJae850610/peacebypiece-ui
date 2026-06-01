# WAFLOW PDF Generator Worker

- 기준 앱 버전: `0.18.93`
- 이 폴더는 PDF 생성 Worker의 Wrangler 배포 기준 폴더다.
- Cloudflare Dashboard의 `Edit code` 화면에 단일 JS 파일을 붙여넣는 방식으로 배포하지 않는다.
- `@cloudflare/puppeteer` 의존성과 Browser Rendering binding이 필요하므로 Wrangler로 배포한다.

## 배포 순서

```powershell
cd cloudflare/pdf-generator-worker
npm install
npx wrangler login
npx wrangler secret put WAFLOW_PDF_GENERATOR_TOKEN
npx wrangler deploy
```

`WAFLOW_PDF_GENERATOR_TOKEN` 값은 앱의 `.env.local`에 넣는 값과 같아야 한다.

```env
WAFLOW_PDF_GENERATOR_URL="https://waflow-pdf-generator.<account>.workers.dev"
WAFLOW_PDF_GENERATOR_TOKEN="위에서_입력한_같은_값"
WAFLOW_PDF_GENERATOR_TIMEOUT_MS="30000"
```

## 확인

배포 후 브라우저에서 Worker URL 또는 `/health`를 열어 다음 형태의 JSON이 나오면 기본 응답은 정상이다.

```json
{
  "ok": true,
  "service": "waflow-pdf-generator",
  "version": "0.16.1.1"
}
```

## 주의

- 기존 `peacebypiece-r2-upload` Worker는 수정하지 않는다.
- R2 업로드/다운로드 Worker와 PDF 생성 Worker는 역할을 분리한다.
- `cloudflare/pdf-generator-worker.js`는 deprecated 단일 파일 진입점이다.
- `cloudflare/pdf-generator-worker.wrangler.example.toml`은 deprecated 예시 설정이다.
- 신규 PDF Worker 배포 기준은 이 폴더의 `src/index.js`와 `wrangler.toml`이다.
- Cloudflare Dashboard 코드 편집기에서 `import puppeteer from "@cloudflare/puppeteer"` 오류가 나는 경우는 정상적인 배포 방식이 아니다. 이 폴더를 Wrangler로 배포해야 한다.
