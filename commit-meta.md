Version :
0.9.49

Base Version :
0.9.48

Target Version :
0.9.49

Summary :
첨부파일 다운로드 route 처리 로직 분리

Description :
app/api/workorders/attachments/file/route.ts에 있던 첨부파일 조회, Worker redirect URL 생성, 다운로드 파일명 처리, R2 SDK fallback 응답 생성 로직을 lib/workorder/attachments/attachmentFileRoute.ts로 분리했다. route 파일은 Next.js GET 요청을 handler로 위임하는 역할만 하도록 축소했다. 기존 업로드, 삭제, 화면 표시 로직은 변경하지 않았다.

수정 파일 목록 :
- app/api/workorders/attachments/file/route.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/workorder/attachments/attachmentFileRoute.ts

삭제 파일 목록 :
없음
