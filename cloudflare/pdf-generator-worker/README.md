# WAFLOW PDF Generator Worker

This folder is the canonical Wrangler deployment project for the PDF Generator Worker. Do not deploy it by pasting a single JavaScript file into the Cloudflare Dashboard editor. The worker depends on `@cloudflare/puppeteer` and the Cloudflare Browser Rendering binding, so it must be deployed with Wrangler from this directory.

## Install And Deploy

```powershell
cd cloudflare/pdf-generator-worker
npm ci
npx wrangler login
npx wrangler secret put WAFLOW_PDF_GENERATOR_TOKEN
npx wrangler deploy
```

`node_modules` is intentionally not tracked. Recreate dependencies from `package-lock.json` with `npm ci` before local development or deployment.

`WAFLOW_PDF_GENERATOR_TOKEN` must match the app-side token configured outside this repository's source files.

```env
WAFLOW_PDF_GENERATOR_URL="https://waflow-pdf-generator.<account>.workers.dev"
WAFLOW_PDF_GENERATOR_TOKEN="same_value_entered_as_worker_secret"
WAFLOW_PDF_GENERATOR_TIMEOUT_MS="30000"
```

## Verify

After deployment, open the Worker URL or `/health`. A healthy response has this shape:

```json
{
  "ok": true,
  "service": "waflow-pdf-generator",
  "version": "0.16.1.1"
}
```

## Notes

- Do not modify the existing `peacebypiece-r2-upload` Worker for PDF generation.
- The R2 upload/download Worker and PDF Generator Worker have separate responsibilities.
- `cloudflare/pdf-generator-worker.js` is a deprecated single-file entry point.
- `cloudflare/pdf-generator-worker.wrangler.example.toml` is a deprecated example config.
- The active deployment baseline is this folder's `src/index.js`, `package.json`, `package-lock.json`, and `wrangler.toml`.
- If the Cloudflare Dashboard editor reports an `import puppeteer from "@cloudflare/puppeteer"` error, that is evidence that the wrong deployment method is being used. Deploy this folder with Wrangler instead.
