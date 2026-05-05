Version :
0.9.1991

Summary :
작업지시서 헤더 추천분류와 기본정보 수정 모달 기준 보완

Description :
작업지시서 제목 인라인 수정 중 표시되던 추천분류 안내를 런타임 플래그 기준으로 숨기고, 기본정보 수정 모달의 분류 선택을 DB 등록 생산품 유형 기준으로 조회하도록 보완했다. 기본정보 수정 모달에서는 시즌/연도 입력을 제거하고, 헤더 요약도 분류 중심으로 표시되도록 정리했다.

수정 파일 목록 :
- components/workorder/detail/WorkOrderHeaderSection.tsx
- components/workorder/detail/modals/BasicInfoEditModal.tsx
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/workorder/detail/detailFormatting.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
