Version :
0.9.2181

Summary :
작업지시서 목록 스크롤 표시 보정

Description :
PC 작업지시서 화면에서 좌측 작업지시서 목록 하단 카드가 잘려 보여 테스트가 어려운 문제를 최소 수정했다. 목록 패널의 너비/스크롤 안정성을 보강하고 카드 세로 여백을 줄여 마지막 항목까지 확인하기 쉽게 정리했다. DB schema, API route, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- components/layout/SidebarContent.tsx
- components/workorder/list/WorkOrderListCard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-list-scroll-0.9.2181.md

삭제 파일 목록 :
없음
