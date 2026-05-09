Version :
0.9.22416

Summary :
작업지시서 i18n 표시 구조 정리와 build 오류 보정

Description :
작업지시서 상세 편집 공통 컴포넌트에서 nullish coalescing 연산자와 논리 연산자를 함께 사용해 발생하던 Turbopack parsing 오류를 수정했다. 0.9.22415에서 추가한 작업지시서 표시 변환 helper도 상태, 액션, 값 표시 기준으로 분리해 추후 i18n 리팩토링 시 다시 수정해야 할 가능성을 줄였다.

수정 파일 목록 :
- components/workorder/detail/shared/detailEditorShared.tsx
- lib/workorder/presentation/workOrderDisplayTranslation.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/workorder/presentation/workOrderActionPresentation.ts
- lib/workorder/presentation/workOrderStatusPresentation.ts
- lib/workorder/presentation/workOrderValuePresentation.ts
- docs/workorder-i18n-presentation-structure-build-fix-0.9.22416.md

삭제 파일 목록 :
없음
