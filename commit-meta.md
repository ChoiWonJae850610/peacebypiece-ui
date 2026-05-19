Version :
0.13.90

Summary :
작업지시서 검토요청과 발주요청 권한 흐름 보정

Description :
작업지시서 워크플로우 상태 변경 권한 판단을 공통 정책으로 분리하고, 단건/일괄 저장 및 상태 패치에서 검토요청, 검토완료, 반려, 발주요청 권한을 동일하게 검증하도록 보정했다. 디자이너 기본 역할에서는 발주 가능 권한을 제외해 검토요청 중심 기본 권한으로 정리했다.

수정 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/permissions/memberPermissionMatrix.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/workorder/workflowPermissionPolicy.ts

삭제 파일 목록 :
없음
