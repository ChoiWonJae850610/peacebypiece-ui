Version :
0.11.92

Summary :
작업지시서 semantic theme token 1차 기준과 생산구성 필드 톤 보정

Description :
작업지시서 화면에서 입력 가능, 선택 가능, 계산, 비활성, 빈 상태를 의미 기준으로 구분할 수 있도록 semantic theme token 1차 기준을 추가했다. 생산구성 테이블의 과한 테두리 표현을 옅은 배경과 약한 경계선 중심으로 재보정하고, PC 원단/부자재 및 외주공정 테이블에서 선택 필드와 입력 필드를 구분했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- components/workorder/detail/shared/detailEditorShared.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx

추가 파일 목록 :
- lib/theme/semanticThemeTokens.ts
- docs/workorder-semantic-theme-tokens-0.11.92.md

삭제 파일 목록 :
없음
