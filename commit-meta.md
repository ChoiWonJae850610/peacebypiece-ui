Version :
0.9.183

Summary :
작업지시서 협력업체 선택 목록을 DB 등록 기준으로 정리

Description :
작업지시서의 공장, 원단/부자재, 외주처 선택 목록에서 mock/seed fallback을 제거하고 DB에 등록된 활성 협력업체 기준으로만 표시되도록 정리했다. 등록된 업체나 공정이 없을 때는 선택 목록에 안내용 비활성 항목을 표시하고, 외주처는 선택한 외주공정별 등록 업체만 표시하도록 보완했다.

수정 파일 목록 :
- app/api/partners/workorder-options/route.ts
- components/workorder/detail/shared/detailEditorShared.tsx
- lib/constants/app.ts
- lib/constants/workorderDomain.ts
- lib/hooks/partners/usePartnerWorkOrderOptions.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/workorder/detail/detailSelectors.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
