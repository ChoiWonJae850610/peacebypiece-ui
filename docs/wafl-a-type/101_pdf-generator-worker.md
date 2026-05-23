# 0.16.1 PDF Generator Worker 1차

## 목적

발주서 PDF를 앱 서버에서 좌표 기반으로 직접 그리지 않고, HTML 문서를 PDF로 변환하는 전용 Generator로 분리한다.

0.16.1에서는 Cloudflare Browser Rendering 기반 Worker 예시를 추가한다. 앱은 기존 `WAFLOW_PDF_GENERATOR_URL`로 이 Worker를 호출하고, Worker는 HTML을 받아 `application/pdf`를 반환한다.

## 추가 파일

```text
cloudflare/pdf-generator-worker.js
cloudflare/pdf-generator-worker.wrangler.example.toml
```

## 호출 계약

Request:

```json
{
  "html": "<!doctype html>...",
  "fileName": "발주서_작업지시서_2026-05-24_0000_담당자.pdf",
  "format": "A4",
  "orientation": "portrait"
}
```

Response:

```text
HTTP 200
Content-Type: application/pdf
body: PDF binary
```

## 보안

Worker에 `WAFLOW_PDF_GENERATOR_TOKEN` 또는 `PDF_GENERATOR_TOKEN`을 설정하면 앱은 동일한 토큰을 `WAFLOW_PDF_GENERATOR_TOKEN`에 설정해야 한다.

앱에서 보내는 헤더:

```text
Authorization: Bearer <WAFLOW_PDF_GENERATOR_TOKEN>
```

## 배포 후 앱 환경변수

```env
WAFLOW_PDF_GENERATOR_URL="https://your-pdf-generator.your-domain.workers.dev"
WAFLOW_PDF_GENERATOR_TOKEN="same-secret-as-worker"
```

## Worker 설정 요약

1. Cloudflare Workers 프로젝트를 만든다.
2. Browser Rendering을 활성화하고 binding 이름을 `BROWSER`로 둔다.
3. `cloudflare/pdf-generator-worker.js`를 Worker main으로 배포한다.
4. 필요하면 Worker secret으로 `WAFLOW_PDF_GENERATOR_TOKEN`을 설정한다.
5. 앱 `.env.local` 또는 Vercel 환경변수에 `WAFLOW_PDF_GENERATOR_URL`을 설정한다.

## 현재 한계

- Worker 배포 자동화는 아직 포함하지 않는다.
- 대표 이미지 실제 삽입은 HTML 템플릿이 이미지 URL을 안정적으로 제공한 뒤 별도 보정한다.
- 앱 내부 fallback PDF는 Generator 미설정 환경의 안전장치로 유지한다.
