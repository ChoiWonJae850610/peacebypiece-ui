Version :
0.9.119

Summary :
작업지시서 view model 타입 참조의 client 컴포넌트 런타임 import 제거

Description :
ComponentProps 타입 계산에만 사용되는 작업지시서 UI 컴포넌트 import를 type-only import로 변경했다. 서버/도메인 presentation 계층에서 client 컴포넌트가 런타임 import graph에 포함될 가능성을 줄였고, 기존 API, repository, DB schema, 업로드/삭제/표시 로직은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/layout/types.ts
- lib/workorder/presentation/workOrderDetailPresentation.ts
- lib/workorder/workspace/viewModelTypes.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
