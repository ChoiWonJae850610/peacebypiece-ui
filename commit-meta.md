Version :
0.15.70

Summary :
메모와 첨부 API serviceCode 요청 기준 정리

Description :
작업지시서 메모와 첨부 관련 클라이언트 호출부에서 serviceCode를 명시적으로 전달하도록 정리했다. API route에서는 요청 serviceCode가 기대값과 다르면 차단하도록 공통 검증 유틸을 추가하고, 메모 생성/수정/삭제, 첨부 업로드 준비/완료, 첨부 삭제 요청, 대표 디자인 지정 흐름의 side effect 검증 기준을 명확히 했다.

수정 파일 목록 :
- app/api/workorders/attachments/delete/route.ts
- app/api/workorders/attachments/primary/route.ts
- app/api/workorders/attachments/upload/complete/route.ts
- app/api/workorders/attachments/upload/route.ts
- app/api/workorders/memos/route.ts
- lib/constants/app.ts
- lib/workorder/attachments/attachmentDeleteApiClient.ts
- lib/workorder/attachments/attachmentPrimaryApiClient.ts
- lib/workorder/attachments/attachmentUploadApiClient.ts
- lib/workorder/memo/memoApiClient.ts

추가 파일 목록 :
- lib/workorder/serviceCodeRequest.ts

삭제 파일 목록 :
없음
