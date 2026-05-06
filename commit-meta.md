Version :
0.9.2220

Summary :
시스템 통계 화면 JSX 닫힘 오류 수정

Description :
0.9.2219에서 시스템관리자 통계 화면으로 운영 기준 영역을 이동하는 과정에서 SystemStatsOverview.tsx의 grid 컨테이너 닫힘 태그가 누락되어 Next.js 빌드가 실패하던 문제를 수정했다. APP_VERSION을 0.9.2220으로 올렸으며 DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/system/SystemStatsOverview.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
