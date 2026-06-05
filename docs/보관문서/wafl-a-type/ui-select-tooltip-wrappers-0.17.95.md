# UI Select / Tooltip 래퍼 0.17.95

## 목적

WAFL 화면에서 Radix Select와 Tooltip을 직접 사용하는 대신 `components/common/ui`의 내부 래퍼를 통해 적용한다.

## 추가 항목

- `AppSelect`
  - `@radix-ui/react-select` 기반
  - `lucide-react`의 `ChevronDown`, `Check` 사용
  - `value`, `onValueChange`, `options`, `placeholder`, `disabled`, `size`, `width` 지원
  - 공급처 선택, 상태 선택, 필터 선택처럼 반복되는 선택 UI 정리에 사용

- `AppTooltip`
  - `@radix-ui/react-tooltip` 기반
  - 짧은 도움말, 비활성 버튼 사유, 축약 라벨 설명에 사용

## 적용 원칙

- 화면 파일에서 Radix 컴포넌트를 직접 import하지 않는다.
- 화면 파일은 `AppSelect`, `AppTooltip`만 사용한다.
- 기존 `<select>` 전체 치환은 한 번에 하지 않는다.
- 먼저 원단·부자재 공급처/구분 선택처럼 범위가 좁고 테스트하기 쉬운 곳부터 적용한다.

## 후속 작업

0.17.96에서 원단·부자재 화면의 구분/공급처 select를 `AppSelect`로 1차 전환한다.
