# WAFL Radius Consistency Audit 0.21.44

## 목적

0.21.43 캡처 기준으로 확인된 외부 카드와 내부 요약 박스의 곡률 차이를 전체 소스 기준으로 먼저 보정한다. 기준은 더 직각에 가까운 내부 정보 박스 곡률이다.

## 적용 기준

- WAFL은 업무형 SaaS 화면이므로 과하게 둥근 카드 실루엣을 기본값으로 쓰지 않는다.
- surface 계열은 `8px`을 기준으로 한다.
- control 계열은 `7px`을 기준으로 한다.
- compact/icon 계열은 `6px`을 기준으로 한다.
- modal 계열 legacy radius는 `10px`로 낮춰 화면 카드와 과하게 벌어지지 않게 한다.
- 기존 `rounded-2xl`, `rounded-3xl`, `rounded-[32px]` 같은 직접 radius 유틸은 WAFL surface 기준으로 정규화한다.
- `rounded-full`은 dot, spinner, avatar, progress node, toggle thumb, calendar day 등 원형 의미가 있는 경우만 예외로 둔다.
- `rounded-t-*`, `rounded-b-*`, `rounded-l-*`, `rounded-r-*`, `rounded-none`은 방향성 모서리/캘린더 range/도형 표현 가능성이 있어 이번 1차에서는 강제 정규화하지 않는다.

## 전체 소스 점검 결과

0.21.43 기준 `app`, `components`, `features`, `lib`, `docs`에서 radius 관련 표현을 전수 검색했다.

- radius 관련 표현 발견 파일: 111개
- radius 관련 표현 수: 592개
- 주요 직접 utility:
  - `rounded-full`: 149개
  - `rounded-2xl`: 141개
  - `rounded-xl`: 80개
  - `rounded-3xl`: 65개
  - `rounded-lg`: 22개
  - `rounded-[var(--pbp-radius-wafl)]`: 16개
  - `rounded-[24px]`: 12개
  - `rounded-[var(--pbp-radius-xl)]`: 11개

## 0.21.44 수정 범위

- `app/globals.css`
  - fallback legacy radius token을 더 직각적인 값으로 정리
  - WAFL shape token을 `surface 8px / control 7px / compact 6px / icon 6px`으로 고정
  - 직접 `rounded-*` utility 정규화 rule에 `!important`를 추가해 Tailwind utility보다 WAFL 기준이 우선되게 변경
- `lib/theme/themes/defaultLight.ts`
  - 런타임 theme token을 globals fallback과 동기화
  - page/content/empty legacy radius token 추가
- `app/ui/WaflUiCatalogPage.tsx`
  - `/ui` 기준 문구를 신규 radius 값으로 갱신

## 다음 확인 필요

- 실제 화면에서 외부 패널과 내부 요약 박스가 모두 더 직각적으로 보이는지 확인한다.
- `rounded-full`이 남은 항목 중 실제 원형 의미가 아닌 버튼/칩이 있으면 다음 차수에서 WaflBadge/WaflPlainButton/WaflIconButton 계열로 교체한다.
- PDF preview, drawing canvas, calendar range, chart primitive는 도형/문서 미리보기 성격이 있어 화면 확인 후 별도 예외 여부를 결정한다.
