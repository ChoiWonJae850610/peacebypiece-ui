Version :
0.9.148

Summary :
작업지시서 detail 컨테이너 모델 조립부 분리

Description :
작업지시서 상세 화면의 기존 UI와 동작을 유지하면서 WorkOrderDetailContainer 내부의 모델 조립 책임을 별도 helper로 분리했다. 생산구성 통합 토글 handler도 이름 있는 지역 함수로 정리했다. 상태 변경, 첨부, 메모, R2 purge, DB schema, package 파일은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/detail/WorkOrderDetailContainer.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- components/workorder/detail/workOrderDetailContainerModels.ts
- docs/workorder-detail-refactor-0.9.148.md

삭제 파일 목록 :
없음
