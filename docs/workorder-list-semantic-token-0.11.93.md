# 0.11.93 작업지시서 목록 semantic token 적용

## 범위

작업지시서 좌측 목록의 생성 버튼, 선택 카드, 상태 뱃지, 빈 목록 상태에 semantic class를 1차 적용했다.

## 기준

- 생성 버튼: `action.primary`
- 일반 목록 카드: `surface.cardMuted`
- 선택 목록 카드: `surface.selected`
- 상태 뱃지: `status.*`
- 빈 목록 상태: `surface.emptyState`

## 의도

컴포넌트가 `bg-stone-*`, `bg-violet-*` 같은 색상값을 직접 판단하지 않고 의미 class를 사용하도록 분리한다. 이후 테마 파일이 추가되면 각 의미 token의 실제 색상만 교체해 작업지시서 목록 톤을 바꿀 수 있다.

## 미포함

- 실제 테마 선택 UI 변경 없음
- 전체 앱 테마 파일 분리 없음
- 모바일 생산구성 카드 semantic token 적용 없음
