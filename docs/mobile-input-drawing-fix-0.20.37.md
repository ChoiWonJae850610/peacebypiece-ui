# 0.20.37 모바일 입력 확대 잔여 필드 및 직접그리기 보정

## 목적
- 작업지시서 메모 입력, 원단·부자재 발주도구 검색 입력처럼 portal/sheet 내부에 있는 입력 필드의 iOS/Safari 포커스 확대를 줄인다.
- PC에서는 동작하지만 모바일/태블릿 세로모드에서 직접그리기 터치 입력이 되지 않는 문제를 보정한다.

## 변경 범위
- `AppSheet` root에 `pbp-mobile-no-zoom` 범위를 부여해 bottom sheet/portal 내부 입력 필드도 16px 이상으로 보정되게 했다.
- no-zoom CSS 적용 범위를 `max-width: 1023px`까지 확장해 태블릿 portrait에서도 입력 확대를 줄였다.
- 원단·부자재 검색 입력 공통 클래스는 모바일/태블릿에서 `text-base`, md 이상에서 기존 `text-xs` 밀도를 유지하도록 조정했다.
- 직접그리기 캔버스는 touch 이벤트 fallback을 추가해 모바일/태블릿 touch 입력을 직접 처리한다.
- touch 입력 중 pointer 이벤트와 중복 처리되지 않도록 touch pointerType은 pointer handler에서 무시한다.

## 유지 사항
- PC 3패널 구조 유지
- 태블릿 구조 유지
- 상태전환/권한/API/DB/R2/첨부/메모/휴지통/purge 흐름 변경 없음
