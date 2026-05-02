Version :
0.9.48

Summary :
작업지시서 API route 처리 로직 분리

Description :
app/api/workorders/route.ts에 직접 들어 있던 DB 오류 처리, 메모 스냅샷 병합, 히스토리 기록, GET/POST/PATCH/DELETE 처리 로직을 lib/workorder/api/workOrderRouteHandlers.ts로 분리했다. route.ts는 Next route handler 위임만 담당하도록 축소했다. API 응답 포맷과 DB 저장 흐름은 변경하지 않았다.

수정 파일 목록 :
- app/api/workorders/route.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts

삭제 파일 목록 :
없음
