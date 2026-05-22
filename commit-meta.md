Version :
0.15.68

Summary :
작업지시서 serviceCode 정리와 빌드 문법 오류 수정

Description :
영문 관리자 i18n의 누락 쉼표로 발생한 빌드 문법 오류를 수정하고, 작업지시서 serviceCode의 생산구성 replace 판단을 side effect matrix 기준으로 단일화했다. 작업지시서 저장 mutation과 workflow action의 serviceCode 처리도 공통 helper 중심으로 정리했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/constants/workorderServiceCodes.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/i18n/en/admin.ts
- lib/workorder/serviceCodeGuards.ts
- lib/workorder/serviceCodeSideEffects.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
