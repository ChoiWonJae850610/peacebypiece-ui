# 0.20.36 모바일 입력 확대 방지·공통 컴포넌트·직접그리기 보정

## 범위
- 작업지시서와 원단·부자재 발주 모바일 화면의 입력 필드 포커스 확대 방지
- 작업지시서/원단·부자재 발주에서 반복된 모바일 목록 드로어와 탭 시트 패턴 공통화
- 모바일 직접그리기 터치 입력과 landscape 차단 후 모달 잔류 문제 보정

## 입력 확대 방지
- `WaflMobileShell`에 `pbp-mobile-no-zoom` 범위를 부여했습니다.
- 모바일 폭에서 해당 Shell 내부 `input`, `textarea`, `select`, `contenteditable`의 폰트 크기를 16px 이상으로 강제해 iOS/Safari 포커스 확대를 줄였습니다.
- PC/태블릿의 기존 compact density는 유지합니다.

## 공통 컴포넌트
- `WaflMobileListDrawer`를 추가해 작업지시서와 원단·부자재 발주 목록 드로어의 폭, overlay, 닫기 동작을 공통화했습니다.
- `WaflMobileTabbedActionSheet`를 추가해 FAB로 여는 탭형 sheet 구조를 공통화했습니다.
- 작업지시서 추가정보 sheet와 원단·부자재 발주 도구 sheet는 같은 공통 탭 sheet를 사용합니다.

## 직접그리기 보정
- 모바일 drawing panel은 추가정보 sheet를 열 때 기본 탭을 첨부로 초기화해 이전 디자인/그리기 상태가 자동 복원되지 않게 했습니다.
- 모바일 전용 related panel은 drawing modal open 상태를 sessionStorage에서 복원하지 않도록 조정했습니다.
- 디자인 탭을 벗어나면 drawing modal 상태를 닫고 session flag를 정리합니다.
- 캔버스 포인터 이벤트에 `preventDefault`, `touchAction: none`, pointer capture 예외 처리를 추가했습니다.
- landscape 차단 안내 닫기 시 draft/session/dirty/interaction 상태를 같이 정리합니다.

## 비변경
- 상태전환 로직 변경 없음
- 권한 로직 변경 없음
- API/DB/R2/첨부/메모/휴지통/purge 흐름 변경 없음
- PC 3패널 구조 유지
- 태블릿 구조 유지
