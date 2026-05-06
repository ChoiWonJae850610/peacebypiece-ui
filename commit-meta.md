Version :
0.9.2171

Summary :
협력업체 관리 i18n 문법 오류 수정

Description :
협력업체 관리 UI 정리 과정에서 lib/i18n/ko/admin.ts의 createTitle 항목 뒤 쉼표가 누락되어 Next.js 빌드가 실패하던 문제를 수정했다. APP_VERSION을 0.9.2171로 올렸고, DB schema, API route, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- lib/i18n/ko/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
