Version : 0.16.1.1
Summary : PDF Generator Worker Wrangler 배포 구조 보정
Description : Cloudflare Dashboard 코드 편집기에 단일 파일을 붙여넣는 방식에서 발생하는 @cloudflare/puppeteer 모듈 오류를 피하기 위해 PDF Generator Worker를 Wrangler 배포용 패키지 구조로 정리하였습니다. 기존 R2 Worker는 건드리지 않고 PDF 전용 Worker를 별도 배포할 수 있도록 package.json, wrangler.toml, src/index.js, README를 추가하고 관련 문서를 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- cloudflare/pdf-generator-worker.js
- cloudflare/pdf-generator-worker.wrangler.example.toml
- docs/wafl-a-type/101_pdf-generator-worker.md
추가 파일 목록 :
- cloudflare/pdf-generator-worker/package.json
- cloudflare/pdf-generator-worker/wrangler.toml
- cloudflare/pdf-generator-worker/src/index.js
- cloudflare/pdf-generator-worker/README.md
삭제 파일 목록 :
- 없음
