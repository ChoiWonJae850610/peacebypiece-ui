Version :
0.13.36

Summary :
첨부파일 삭제 감사 로그 빌드 오류 수정

Description :
첨부파일 삭제 API의 시스템 감사 로그 생성 과정에서 제거된 company 객체를 참조하던 부분을 세션 companyId 참조로 수정했다. APP_VERSION을 0.13.36으로 갱신했다.

수정 파일 목록 :
- app/api/workorders/attachments/delete/route.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
