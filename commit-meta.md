Version :
0.15.69

Summary :
작업지시서 저장 액션 serviceCode 연결 보정

Description :
작업지시서 저장 버튼이 생산구성 현재값을 serviceCode 기반 state patch로 저장하도록 보정했다. 분류 등 기본정보는 즉시 저장 필드로 정리하고, 발주정보/생산구성은 명시 저장 흐름으로 분리했다. 검수완료와 완료처리 serviceCode가 생산구성 현재값 replace를 허용하도록 side effect matrix를 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/workorder/serviceCodeSideEffects.ts
- lib/workorder/storagePolicy.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
