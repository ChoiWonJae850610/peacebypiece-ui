Version :
0.9.2212

Summary :
관리자 통계 화면 문구 정리와 빌드 오류 수정

Description :
관리자 통계 화면에서 과도한 안내 문구와 개발자용 표시를 줄여 요금제 선택 중심으로 화면을 단순화했다. 0.9.2211 빌드에서 발견된 작업지시서 발주 정보 empty copy 누락도 ko/en i18n에 항목을 추가해 수정했다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-copy-cleanup-0.9.2212.md

삭제 파일 목록 :
없음
