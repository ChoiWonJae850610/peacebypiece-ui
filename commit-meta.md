Version :
0.9.199

Summary :
작업지시서 생성 모달 구조 리팩토링

Description :
작업지시서 생성 모달의 카테고리 source 조립, 추천분류 패널, 카테고리 입력 필드를 별도 파일로 분리했다. 추천분류 feature flag와 시즌/연도 제거 상태, category id 저장 흐름은 유지했다.

수정 파일 목록 :
- components/common/modal/CreateWorkOrderModal.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/common/modal/createWorkOrder/CreateWorkOrderCategoryFields.tsx
- components/common/modal/createWorkOrder/CreateWorkOrderRecommendationPanel.tsx
- components/common/modal/createWorkOrder/createWorkOrderCategorySource.ts

삭제 파일 목록 :
없음
