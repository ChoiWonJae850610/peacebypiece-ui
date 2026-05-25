# 0.16.1.1 PDF Generator Worker Wrangler 배포 구조 보정

## 목적

0.16.1에서 추가한 PDF Generator Worker는 `@cloudflare/puppeteer`를 사용한다. 이 파일은 Cloudflare Dashboard의 `Edit code` 화면에 단일 JS로 붙여넣으면 모듈을 찾지 못한다.

따라서 0.16.1.1에서는 PDF Generator Worker를 Wrangler 배포용 패키지 구조로 정리한다.

## 사용하지 않을 방식

```text
Cloudflare Dashboard
→ Worker
→ Edit code
→ pdf-generator-worker.js 붙여넣기
```

이 방식은 다음 오류가 날 수 있다.

```text
No such module "@cloudflare/puppeteer" imported from "worker.js"
```

## 사용할 방식

```text
cloudflare/pdf-generator-worker/
  package.json
  wrangler.toml
  src/index.js
  README.md
```

## 배포 순서

PowerShell 기준:

```powershell
cd C:\CWJ_Project\peacebypiece-2.0\cloudflare\pdf-generator-worker
npm install
npx wrangler login
npx wrangler secret put WAFLOW_PDF_GENERATOR_TOKEN
npx wrangler deploy
```

`WAFLOW_PDF_GENERATOR_TOKEN`은 앱 `.env.local`에 넣을 값과 동일하게 둔다.

## 앱 환경변수

```env
WAFLOW_PDF_GENERATOR_URL="https://waflow-pdf-generator.<account>.workers.dev"
WAFLOW_PDF_GENERATOR_TOKEN="Worker에 secret으로 넣은 같은 값"
WAFLOW_PDF_GENERATOR_TIMEOUT_MS="30000"
```

## Worker 역할

```text
Next.js 앱
→ PDF Generator Worker: HTML을 PDF로 변환
→ Next.js 앱: 반환된 PDF를 기존 R2 업로드 흐름으로 저장
→ Neon attachments row 등록
```

## 기존 R2 Worker와의 관계

기존 `peacebypiece-r2-upload` Worker는 수정하지 않는다.

```text
peacebypiece-r2-upload
- R2 업로드/다운로드 담당

waflow-pdf-generator
- HTML → PDF 변환 담당
```

두 Worker를 분리하면 PDF 생성 실패가 기존 첨부파일 업로드/다운로드 흐름에 영향을 덜 준다.

## 확인

배포 후 아래 URL을 브라우저에서 열어 JSON 응답을 확인한다.

```text
https://waflow-pdf-generator.<account>.workers.dev/health
```

예상 응답:

```json
{
  "ok": true,
  "service": "waflow-pdf-generator",
  "version": "0.16.1.1"
}
```

## 다음 단계

0.16.2에서 실제 Worker URL을 앱 `.env.local`에 연결하고, 발주서 PDF 재생성 버튼으로 HTML → PDF 변환 결과를 확인한다.
