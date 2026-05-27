Version : 0.17.32
Summary : 작업지시서 비용 요약 빌드 오류와 런타임 오류 보정
Description : 비용 요약 공정별 금액 표시에서 locale 타입을 Locale로 정리하고, 비용 요약 섹션 props 생성 시 orderItems를 누락 없이 전달하도록 보정했습니다. APP_VERSION을 0.17.32로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/WorkOrderCostSummarySection.tsx
- lib/workorder/presentation/workOrderDetailSectionProps.ts
추가 파일 목록 :
- commit-meta.md
삭제 파일 목록 :
