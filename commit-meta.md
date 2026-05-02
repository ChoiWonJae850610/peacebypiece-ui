Version : 0.9.47
Summary : 첨부파일 다운로드 API를 Worker redirect 방식으로 전환
Description : /api/workorders/attachments/file 요청에서 Worker가 설정된 경우 미리보기와 다운로드 모두 R2 SDK GetObject 서버 스트림 대신 Worker 서명 URL로 307 redirect 하도록 수정했습니다. download=1 요청은 Worker URL에 download/name 파라미터를 전달하고, Worker GET 응답에서 Content-Disposition을 내려 파일 다운로드 동작을 안정화했습니다. Worker 미설정 환경에서는 기존 R2 SDK fallback을 유지했습니다. APP_VERSION을 0.9.47로 증가했습니다.
수정 파일 목록 :
- app/api/workorders/attachments/file/route.ts
- cloudflare/r2-upload-worker.js
- lib/constants/app.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
