Version : 0.15.78
Summary : 작업지시서 임시 저장 버튼 제거
Description : 진행 단계 영역의 임시 저장 버튼을 제거하고 관련 i18n 문구와 action props 전달을 정리했습니다. 발주정보/생산구성 입력값은 별도 임시 저장 버튼 없이 workflow 액션에서 현재 draft 기준으로 처리하는 흐름을 유지합니다.
수정 파일 목록 :
- components/workorder/detail/WorkOrderActionSection.tsx
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
추가 파일 목록 :
삭제 파일 목록 :
