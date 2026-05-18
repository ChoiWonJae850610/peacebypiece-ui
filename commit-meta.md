Version :
0.13.67

Summary :
작업지시서 첨부 R2 key를 고객사 하위 구조로 전환

Description :
신규 작업지시서 첨부와 썸네일 R2 key가 companies/{companyId}/workorders/{workOrderId}/... 구조로 생성되도록 수정했다. 기존 workorders/{workOrderId}/... key는 조회, 삭제, legacy 호환 대상으로 유지하고, Worker와 앱의 안전 key 검증도 고객사 하위 작업지시서 경로를 허용하도록 보강했다.

수정 파일 목록 :
- cloudflare/r2-upload-worker.js
- app/api/workorders/attachments/upload/route.ts
- app/api/workorders/attachments/upload/complete/route.ts
- lib/storage/r2/r2Keys.ts
- lib/storage/r2/r2ThumbnailKeys.ts
- lib/storage/r2/r2WorkerUpload.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
