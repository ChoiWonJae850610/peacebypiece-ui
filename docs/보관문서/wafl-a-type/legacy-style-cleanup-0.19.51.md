# 0.19.51 legacy style cleanup 1차

## 목적

WAFL 공통 컴포넌트가 이미 도입된 뒤에도 일부 관리자 화면에 남아 있던 `stone-*`, `bg-white`, 직접 button class를 저위험 범위에서 정리한다.

## 정리 범위

- 관리자 사이드바의 hardcoded stone/white 색상 일부를 WAFL semantic token으로 전환
- 작업지시서 이력 화면의 panel/input/text 색상을 WAFL semantic token으로 전환
- 작업지시서 이력 item의 surface/text/border 색상을 WAFL semantic token으로 전환
- 시스템 결제 콘솔의 직접 button/link class를 `AdminButton` / `AdminLinkButton`으로 전환

## 제외 범위

- 초대 skeleton, 기준정보 모달, 협력업체 공정 모달처럼 아직 기능/화면 구조가 별도 정리되지 않은 영역
- DB/API/R2/PDF/첨부/메모/휴지통 흐름
- layout grid, breakpoint, route 구조
- `package.json`, `package-lock.json`

## 확인 기준

- 관리자 사이드바 active/inactive 메뉴 색상 유지
- 이력 화면 검색/필터/새로고침 기능 유지
- 이력 item 상세 표시 유지
- 결제 콘솔 버튼 비활성/로그아웃 링크 동작 유지
