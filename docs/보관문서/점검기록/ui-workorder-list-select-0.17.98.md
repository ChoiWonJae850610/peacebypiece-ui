# 0.17.98 작업지시서 목록 선택 UI 전환

## 목적

작업지시서 좌측 목록과 모바일 drawer의 상태/정렬 필터를 WAFL 공통 `AppSelect`로 전환한다.

## 적용 범위

- `components/layout/SidebarContent.tsx`
  - PC/태블릿 사이드바 상태 필터
  - PC/태블릿 사이드바 정렬 필터
- `components/layout/MobileDrawer.tsx`
  - 모바일 drawer 상태 필터
  - 모바일 drawer 정렬 필터

## 유지한 것

- 검색 input
- 목록 reset 동작
- 작업지시서 선택/생성/삭제/리오더 동작
- 기존 list status/sort state
- PC/tablet/mobile 레이아웃 구조

## 다음 후보

- 담당자 선택 UI
- 기본정보 수정 모달 카테고리/품목/세부형태 select
- 검수 모달 공장/발주 항목 select
- 관리자/멤버/업체관리 필터 select
