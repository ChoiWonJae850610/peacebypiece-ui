Version :
0.9.2223

Summary :
통계 화면 bar list 타입 오류 수정

Description :
0.9.2222 통계 분석 섹션 재구성 이후 AdminStatsDashboard.tsx에서 renderBarList가 limit 필드를 요구하는 타입으로 고정되어 factoryProductionBars를 전달할 때 TypeScript 빌드가 실패하던 문제를 수정했다. renderBarList 입력 타입을 실제 렌더링에 필요한 label, value, widthPercent, valueLabel 기준으로 완화하고 APP_VERSION을 0.9.2223으로 올렸다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
