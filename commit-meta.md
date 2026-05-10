Version :
0.9.224394

Summary :
작업지시서 모바일 홈 버튼 타입 오류 수정

Description :
작업지시서 홈 버튼 추가 이후 모바일 상단바 props 타입에 homeNavigation이 중복 요구되어 발생한 빌드 타입 오류를 수정했다. 레이아웃과 워크스페이스 뷰모델의 MobileTopBarProps에서 homeNavigation을 별도 주입 props로 분리하고 APP_VERSION을 0.9.224394로 올렸다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/workspace/viewModelTypes.ts
- components/workorder/layout/types.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
