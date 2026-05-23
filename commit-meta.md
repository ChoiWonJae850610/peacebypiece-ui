Version : 0.16.1
Summary : PDF Generator Worker 1차 구현
Description : 발주서 HTML을 PDF로 변환하는 Cloudflare Browser Rendering 기반 PDF Generator Worker 예시와 배포 설정 문서를 추가하고, 앱의 외부 PDF Generator 호출에 timeout 설정을 보강하였습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/generated-documents/pdfGeneratorClient.ts
- .env.example
추가 파일 목록 :
- cloudflare/pdf-generator-worker.js
- cloudflare/pdf-generator-worker.wrangler.example.toml
- docs/wafl-a-type/101_pdf-generator-worker.md
삭제 파일 목록 :
- 없음
