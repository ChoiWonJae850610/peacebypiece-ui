Version :
0.9.218

Summary :
작업지시서 납기일 과거 날짜 입력 제한

Description :
작업지시서 상세의 발주 정보 납기일 편집 필드에 오늘 이전 날짜 선택 제한을 적용했다. 날짜 정책은 lib/workorder/datePolicy.ts로 분리하고, 기존 상세 편집 UI는 해당 정책을 호출하도록 최소 수정했다. 기존 저장 데이터는 강제로 변경하지 않으며, 관리자 예외 입력과 기존 자료 입력 모드는 후속 버전으로 분리한다.

수정 파일 목록 :
- components/workorder/detail/shared/detailEditorShared.tsx
- lib/constants/app.ts

추가 파일 목록 :
- lib/workorder/datePolicy.ts
- docs/workorder-date-ux-0.9.218.md

삭제 파일 목록 :
없음
