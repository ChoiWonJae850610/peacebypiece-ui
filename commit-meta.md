Version : 0.12.75
Summary : 통계 도넛 툴팁 payload 타입 오류 수정
Description : Recharts Tooltip payload가 readonly 배열로 전달되는 타입 특성에 맞춰 통계 도넛 툴팁 props 타입을 readonly 배열로 보정하고, Tooltip payload 캐스팅을 unknown 경유 방식으로 수정하여 TypeScript 빌드 오류를 해소했습니다. APP_VERSION을 0.12.75로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminBasicStatsCharts.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
