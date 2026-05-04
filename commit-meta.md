Version :
0.9.149

Summary :
작업지시서 detail view model section props 조립부 분리

Description :
작업지시서 detail view model 내부의 header, action, 발주정보, 생산구성, 비용 요약 props 조립을 별도 builder 파일로 분리했다. 화면 배치, 상태 변경, 첨부, 메모, R2 purge 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/workorder/presentation/workOrderDetailPresentation.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- docs/workorder-detail-refactor-0.9.149.md

삭제 파일 목록 :
없음
